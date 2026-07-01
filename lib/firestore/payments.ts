import "server-only";
import { adminDb, FieldValue, Timestamp, type QueryDocumentSnapshot } from "@/lib/firebase/admin";
import { getStatusFlow, type AppStatus } from "@/lib/app-status";
import { setAppStatus, setFinalPaid } from "@/lib/firestore/apps";
import { confirmRequestPayment } from "@/lib/firestore/requests";
import type { ServiceType } from "@/types";

const PAYMENTS = "payments";

export type PaymentKind = "advance" | "final" | "transfer" | "update" | "renewal";

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
}

export async function createPayment(input: CreatePaymentInput): Promise<string> {
  const ref = adminDb.collection(PAYMENTS).doc();
  await ref.set({
    ...input,
    requestId: input.requestId ?? null,
    status: "pending",
    createdAt: FieldValue.serverTimestamp(),
    confirmedAt: null,
  });
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
  status: "pending" | "confirmed";
  note: string;
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
    status: x.status === "confirmed" ? "confirmed" : "pending",
    note: x.note ?? "",
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
export async function confirmPayment(paymentId: string): Promise<void> {
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
      if (st === "payment_pending" && idx >= 0 && idx < flow.length - 1) {
        await setAppStatus(appId, flow[idx + 1]);
      }
    }
  }

  await ref.update({ status: "confirmed", confirmedAt: FieldValue.serverTimestamp() });
}
