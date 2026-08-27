import "server-only";
import { adminDb, FieldValue, Timestamp, type DocumentSnapshot } from "@/lib/firebase/admin";
import { confirmPayment, rejectPayment } from "@/lib/firestore/payments";
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
export async function confirmPaymentBatch(id: string, actor?: Actor): Promise<{ ok: number; failed: number }> {
  const batch = await getPaymentBatch(id);
  if (!batch) throw new Error("Guruh topilmadi");
  let ok = 0;
  let failed = 0;
  for (const pid of batch.paymentIds) {
    try {
      await confirmPayment(pid, undefined, actor);
      ok++;
    } catch (e) {
      console.error("[confirmPaymentBatch] xato:", pid, e);
      failed++;
    }
  }
  await adminDb.collection(BATCHES).doc(id).update({
    status: ok > 0 ? "confirmed" : "pending",
    confirmedAt: FieldValue.serverTimestamp(),
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
