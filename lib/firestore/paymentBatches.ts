import "server-only";
import { adminDb, FieldValue, Timestamp, type DocumentSnapshot } from "@/lib/firebase/admin";
import { confirmPayment, rejectPayment } from "@/lib/firestore/payments";
import { adjustWallet } from "@/lib/firestore/users";
import type { Actor } from "@/lib/firestore/activity";

// "Hammasini birga to'lash" — bir nechta to'lov (avans/yakuniy/so'rov) bitta chek bilan
// birgalikda yuborilganda, ular shu kolleksiyadagi bitta guruh yozuviga bog'lanadi.
const BATCHES = "paymentBatches";

export interface CreatePaymentBatchInput {
  ownerUid: string;
  ownerName: string;
  ownerPhone: string;
  paymentIds: string[];
  totalUsd: number;
  totalUzs: number | null;
}

export interface PaymentBatchView {
  id: string;
  ownerUid: string;
  ownerName: string;
  ownerPhone: string;
  paymentIds: string[];
  totalUsd: number;
  totalUzs: number | null;
  status: "pending" | "confirmed" | "rejected";
  createdAt: string | null;
  confirmedAt: string | null;
}

function iso(v: unknown): string | null {
  return v instanceof Timestamp ? v.toDate().toISOString() : null;
}

function map(d: DocumentSnapshot): PaymentBatchView {
  const x = d.data() ?? {};
  return {
    id: d.id,
    ownerUid: x.ownerUid ?? "",
    ownerName: x.ownerName ?? "",
    ownerPhone: x.ownerPhone ?? "",
    paymentIds: Array.isArray(x.paymentIds) ? x.paymentIds : [],
    totalUsd: x.totalUsd ?? 0,
    totalUzs: typeof x.totalUzs === "number" ? x.totalUzs : null,
    status: x.status === "confirmed" ? "confirmed" : x.status === "rejected" ? "rejected" : "pending",
    createdAt: iso(x.createdAt),
    confirmedAt: iso(x.confirmedAt),
  };
}

export async function createPaymentBatch(input: CreatePaymentBatchInput): Promise<string> {
  const ref = adminDb.collection(BATCHES).doc();
  await ref.set({
    ...input,
    status: "pending",
    createdAt: FieldValue.serverTimestamp(),
    confirmedAt: null,
  });
  return ref.id;
}

export async function getPaymentBatch(id: string): Promise<PaymentBatchView | null> {
  const snap = await adminDb.collection(BATCHES).doc(id).get();
  if (!snap.exists) return null;
  return map(snap);
}

// Guruhdagi barcha to'lovlarni birma-bir tasdiqlaydi — har biri o'z ta'sirini
// (status ilgarilash, hamyon, foydalanuvchiga xabar) mustaqil bajaradi.
// Allaqachon tasdiqlangan a'zo to'lov jim o'tkazib yuboriladi (confirmPayment idempotent).
export async function confirmPaymentBatch(
  id: string,
  opts?: { taxReceiptUrl?: string; actualPaidUzs?: number },
  actor?: Actor
): Promise<{ ok: number; failed: number }> {
  const batch = await getPaymentBatch(id);
  if (!batch) throw new Error("Guruh topilmadi");

  // Guruhdagi to'lov hujjatlari — netDue yig'indisini hisoblaymiz
  const payDocs = await Promise.all(batch.paymentIds.map((pid) => adminDb.collection("payments").doc(pid).get()));
  let totalNetDue = 0;
  for (const d of payDocs) {
    if (d.exists && d.get("status") === "pending") {
      totalNetDue += (d.get("netDueUzs") as number) ?? (d.get("amountUzs") as number) ?? 0;
    }
  }

  let ok = 0;
  let failed = 0;
  for (const d of payDocs) {
    if (!d.exists) { failed++; continue; }
    if (d.get("status") === "confirmed") { ok++; continue; }
    // Har bir to'lovni ANIQ o'z netDue summasida tasdiqlaymiz (ortiqcha bittada, guruh bo'yicha hisoblanadi)
    const netDue = (d.get("netDueUzs") as number) ?? (d.get("amountUzs") as number) ?? 0;
    try {
      await confirmPayment(d.id, opts?.taxReceiptUrl, actor, netDue);
      ok++;
    } catch (e) {
      console.error("[confirmPaymentBatch] xato:", d.id, e);
      failed++;
    }
  }

  // Guruh bo'yicha ortiqcha to'lov (bir marta) — mijoz hamyoniga
  if (opts?.actualPaidUzs != null && totalNetDue > 0) {
    const overpay = Math.round(opts.actualPaidUzs - totalNetDue);
    if (overpay > 0) await adjustWallet(batch.ownerUid, overpay);
  }

  await adminDb.collection(BATCHES).doc(id).update({
    status: ok > 0 ? "confirmed" : "pending",
    confirmedAt: FieldValue.serverTimestamp(),
    ...(opts?.taxReceiptUrl ? { taxReceiptUrl: opts.taxReceiptUrl } : {}),
    ...(opts?.actualPaidUzs != null ? { actualPaidUzs: Math.round(opts.actualPaidUzs) } : {}),
  });
  return { ok, failed };
}

export async function rejectPaymentBatch(id: string, actor?: Actor): Promise<{ ok: number; failed: number }> {
  const batch = await getPaymentBatch(id);
  if (!batch) throw new Error("Guruh topilmadi");
  let ok = 0;
  let failed = 0;
  for (const pid of batch.paymentIds) {
    try {
      await rejectPayment(pid, actor);
      ok++;
    } catch (e) {
      console.error("[rejectPaymentBatch] xato:", pid, e);
      failed++;
    }
  }
  await adminDb.collection(BATCHES).doc(id).update({ status: ok > 0 ? "rejected" : "pending" });
  return { ok, failed };
}
