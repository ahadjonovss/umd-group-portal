import "server-only";
import { adminDb, FieldValue, Timestamp, type QueryDocumentSnapshot } from "@/lib/firebase/admin";
import { getStatusFlow, workStartStatus, type AppStatus } from "@/lib/app-status";
import { setAppStatus, setFinalPaid } from "@/lib/firestore/apps";
import { confirmRequestPayment } from "@/lib/firestore/requests";
import { markDiscountUsed } from "@/lib/firestore/discounts";
import { logActivity, type Actor } from "@/lib/firestore/activity";
import { kindToInstallment } from "@/lib/payment-state";
import type { ServiceType } from "@/types";

// Servisning (app/request) payment obyektidagi installment holatini yangilaydi.
async function setInstallment(
  appId: string,
  requestId: string | null | undefined,
  kind: string,
  fields: Record<string, unknown>
): Promise<void> {
  try {
    const key = kindToInstallment(kind);
    const col = requestId ? "requests" : "apps";
    const id = requestId ?? appId;
    if (!id) return;
    const update: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(fields)) update[`payment.installments.${key}.${k}`] = v;
    await adminDb.collection(col).doc(id).update(update);
  } catch (e) {
    console.error("[setInstallment] xato:", e);
  }
}

const PAYMENTS = "payments";

export type PaymentKind = "advance" | "final" | "transfer" | "update" | "renewal" | "push_certificate";

const PAYMENT_KIND_LABEL: Record<PaymentKind, string> = {
  advance: "Avans",
  final: "Yakuniy",
  transfer: "Transfer",
  update: "Update",
  renewal: "Obuna uzaytirish",
  push_certificate: "Push sertifikat",
};

export interface CreatePaymentInput {
  appId: string;
  requestId?: string | null; // request to'lovi bo'lsa
  ownerUid: string;
  ownerName: string;
  ownerPhone: string;
  serviceType: ServiceType;
  appName: string | null;
  kind: PaymentKind;
  amountUsd: number; // to'langan summa ($)
  rate: number | null; // to'lov paytidagi kurs
  amountUzs: number | null; // so'mdagi summa
  totalUsd: number; // xizmatning to'liq narxi ($)
  advancePercent: number; // avans foizi
  taxPhone?: string | null; // soliq cheki uchun telefon (yakuniy/to'liq to'lovda)
  discountId?: string | null; // qo'llangan chegirma id
  discountPercent?: number; // qo'llangan chegirma foizi
}

export async function createPayment(input: CreatePaymentInput): Promise<string> {
  const ref = adminDb.collection(PAYMENTS).doc();
  await ref.set({
    ...input,
    requestId: input.requestId ?? null,
    taxPhone: input.taxPhone ?? null,
    discountId: input.discountId ?? null,
    discountPercent: input.discountPercent ?? 0,
    status: "pending",
    createdAt: FieldValue.serverTimestamp(),
    confirmedAt: null,
  });
  // payment obyekti: qism "submitted" holatiga o'tadi
  await setInstallment(input.appId, input.requestId, input.kind, {
    state: "submitted",
    paymentId: ref.id,
    taxPhone: input.taxPhone ?? null,
  });
  await logActivity(
    input.appId,
    "payment_submitted",
    `${PAYMENT_KIND_LABEL[input.kind]} to'lovi uchun kvitansiya yuborildi ($${Math.round(input.amountUsd)})`,
    { type: "user", name: input.ownerName || "Foydalanuvchi", uid: input.ownerUid }
  );
  return ref.id;
}

export interface PaymentView {
  id: string;
  appId: string;
  requestId: string | null;
  ownerUid: string;
  ownerName: string;
  ownerPhone: string;
  serviceType: ServiceType;
  appName: string | null;
  kind: PaymentKind;
  amountUsd: number;
  rate: number | null;
  amountUzs: number | null;
  totalUsd: number;
  advancePercent: number;
  status: "pending" | "confirmed" | "rejected";
  note: string;
  taxPhone: string | null; // mijoz bergan soliq cheki telefoni
  taxReceiptUrl: string | null; // soliqdan berilgan chek havolasi (tasdiqlashda)
  discountPercent: number; // qo'llangan chegirma foizi (0 = yo'q)
  createdAt: string | null;
}

function iso(v: unknown): string | null {
  return v instanceof Timestamp ? v.toDate().toISOString() : null;
}

function mapPayment(d: QueryDocumentSnapshot): PaymentView {
  const x = d.data();
  return {
    id: d.id,
    appId: x.appId,
    requestId: x.requestId ?? null,
    ownerUid: x.ownerUid ?? "",
    ownerName: x.ownerName ?? "",
    ownerPhone: x.ownerPhone ?? "",
    serviceType: x.serviceType,
    appName: x.appName ?? null,
    kind: (x.kind as PaymentKind) ?? "advance",
    amountUsd: x.amountUsd ?? 0,
    rate: typeof x.rate === "number" ? x.rate : null,
    amountUzs: typeof x.amountUzs === "number" ? x.amountUzs : null,
    totalUsd: x.totalUsd ?? 0,
    advancePercent: x.advancePercent ?? 0,
    status: x.status === "confirmed" ? "confirmed" : x.status === "rejected" ? "rejected" : "pending",
    note: x.note ?? "",
    taxPhone: x.taxPhone ?? null,
    taxReceiptUrl: x.taxReceiptUrl ?? null,
    discountPercent: typeof x.discountPercent === "number" ? x.discountPercent : 0,
    createdAt: iso(x.createdAt),
  };
}

function sortPayments(items: PaymentView[]): PaymentView[] {
  return items.sort((a, b) => {
    if (a.status !== b.status) return a.status === "pending" ? -1 : 1;
    return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
  });
}

export async function getAllPayments(max = 200): Promise<PaymentView[]> {
  const snap = await adminDb.collection(PAYMENTS).get();
  return sortPayments(snap.docs.map(mapPayment)).slice(0, max);
}

// Bitta ariza uchun to'lovlar.
export async function getAppPayments(appId: string): Promise<PaymentView[]> {
  const snap = await adminDb.collection(PAYMENTS).where("appId", "==", appId).get();
  return sortPayments(snap.docs.map(mapPayment));
}

// Bitta foydalanuvchi uchun to'lovlar.
export async function getUserPayments(ownerUid: string): Promise<PaymentView[]> {
  const snap = await adminDb.collection(PAYMENTS).where("ownerUid", "==", ownerUid).get();
  return sortPayments(snap.docs.map(mapPayment));
}

export async function setPaymentNote(paymentId: string, note: string): Promise<void> {
  await adminDb.collection(PAYMENTS).doc(paymentId).update({ note: note.slice(0, 1000) });
}

export async function deletePayment(paymentId: string): Promise<void> {
  await adminDb.collection(PAYMENTS).doc(paymentId).delete();
}

// To'lovni tasdiqlash: ariza statusini keyingi bosqichga o'tkazadi.
// taxReceiptUrl — soliqdan berilgan chek havolasi (yakuniy/to'liq to'lovda).
export async function confirmPayment(paymentId: string, taxReceiptUrl?: string, actor?: Actor): Promise<void> {
  const ref = adminDb.collection(PAYMENTS).doc(paymentId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("To'lov topilmadi");
  const p = snap.data()!;
  if (p.status === "confirmed") return;

  const requestId = p.requestId as string | null | undefined;
  if (requestId) {
    // Request to'lovi: so'rovni keyingi bosqichga o'tkazadi
    await confirmRequestPayment(requestId);
  } else if (p.kind === "final") {
    // Yakuniy (qolgan) to'lov tasdiqlandi
    await setFinalPaid(p.appId as string);
  } else {
    // Ariza avans to'lovi: ilova statusini keyingi bosqichga
    const appId = p.appId as string;
    const serviceType = p.serviceType as ServiceType;
    const appSnap = await adminDb.collection("apps").doc(appId).get();
    if (appSnap.exists) {
      const st = appSnap.get("status") as AppStatus;
      const flow = getStatusFlow(serviceType);
      const idx = flow.indexOf(st);
      const work = workStartStatus(serviceType);
      const workIdx = flow.indexOf(work);
      // Avans to'lov-oldi bosqichda (submitted / review) tasdiqlanса — ish bosqichiga o'tkazamiz.
      if (idx >= 0 && workIdx >= 0 && idx < workIdx) {
        await setAppStatus(appId, work);
      }
    }
  }

  await ref.update({
    status: "confirmed",
    confirmedAt: FieldValue.serverTimestamp(),
    ...(taxReceiptUrl ? { taxReceiptUrl } : {}),
  });

  // payment obyekti: qism "confirmed"
  await setInstallment(p.appId as string, p.requestId as string | null, p.kind as string, {
    state: "confirmed",
    ...(taxReceiptUrl ? { taxReceiptUrl } : {}),
  });

  if (actor) {
    const kind = (p.kind as PaymentKind) ?? "advance";
    await logActivity(
      p.appId as string,
      "payment_confirmed",
      `${PAYMENT_KIND_LABEL[kind]} to'lovi tasdiqlandi ($${Math.round((p.amountUsd as number) ?? 0)})`,
      actor
    );
  }

  // Chegirma yakuniy/to'liq to'lov tasdiqlanganda ishlatilgan deb belgilanadi
  const discountId = p.discountId as string | null | undefined;
  const completing = p.kind === "final" || (p.advancePercent ?? 0) >= 100;
  if (discountId && completing) {
    try {
      await markDiscountUsed(discountId);
    } catch (e) {
      console.error("[confirmPayment] markDiscountUsed xato:", e);
    }
  }
}

// So'rov uchun kutilayotgan (pending) to'lov yozuvi id'si (bo'lsa).
export async function getPendingPaymentIdByRequest(requestId: string): Promise<string | null> {
  const snap = await adminDb
    .collection(PAYMENTS)
    .where("requestId", "==", requestId)
    .where("status", "==", "pending")
    .get();
  if (snap.empty) return null;
  return snap.docs[0].id;
}

// To'lovni rad etish: faqat to'lov yozuvi rad etiladi, ariza/so'rov statusi
// o'zgarmaydi. Chek belgisi tozalanadi — mijoz qayta yuborishi mumkin.
export async function rejectPayment(paymentId: string, actor?: Actor): Promise<void> {
  const ref = adminDb.collection(PAYMENTS).doc(paymentId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("To'lov topilmadi");
  const p = snap.data()!;
  if (p.status === "confirmed") return; // tasdiqlangan to'lovni rad etib bo'lmaydi

  await ref.update({ status: "rejected", rejectedAt: FieldValue.serverTimestamp() });

  const requestId = p.requestId as string | null | undefined;
  if (requestId) {
    await adminDb.collection("requests").doc(requestId).update({ receiptSent: false });
  } else if (p.kind === "final") {
    await adminDb.collection("apps").doc(p.appId as string).update({ finalReceiptSent: false });
  } else {
    await adminDb.collection("apps").doc(p.appId as string).update({ receiptSent: false });
  }

  // payment obyekti: qism "rejected" (mijoz qayta yubora oladi)
  await setInstallment(p.appId as string, requestId, p.kind as string, { state: "rejected" });

  if (actor) {
    const kind = (p.kind as PaymentKind) ?? "advance";
    await logActivity(p.appId as string, "payment_rejected", `${PAYMENT_KIND_LABEL[kind]} to'lovi rad etildi`, actor);
  }
}
