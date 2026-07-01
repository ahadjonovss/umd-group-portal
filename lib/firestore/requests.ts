import "server-only";
import { adminDb, FieldValue, Timestamp, type DocumentSnapshot } from "@/lib/firebase/admin";
import { markAppTransferred, renewSubscription } from "@/lib/firestore/apps";
import type { RequestStatus, RequestType } from "@/lib/request-status";
import type { ServiceType } from "@/types";

const REQUESTS = "requests";

export interface CreateRequestInput {
  appId: string;
  ownerUid: string;
  ownerName: string;
  ownerPhone: string;
  serviceType: ServiceType; // ilova platformasi
  appName: string | null;
  type: RequestType;
  data: Record<string, string>;
  amountUsd: number;
  rate: number | null;
  amountUzs: number | null;
}

export interface RequestView {
  id: string;
  appId: string;
  ownerUid: string;
  ownerName: string;
  ownerPhone: string;
  serviceType: ServiceType;
  appName: string | null;
  type: RequestType;
  status: RequestStatus;
  data: Record<string, string>;
  amountUsd: number;
  rate: number | null;
  amountUzs: number | null;
  receiptSent: boolean;
  note: string;
  createdAt: string | null;
}

function iso(v: unknown): string | null {
  return v instanceof Timestamp ? v.toDate().toISOString() : null;
}

function mapRequest(d: DocumentSnapshot): RequestView {
  const x = d.data() ?? {};
  return {
    id: d.id,
    appId: x.appId,
    ownerUid: x.ownerUid,
    ownerName: x.ownerName ?? "",
    ownerPhone: x.ownerPhone ?? "",
    serviceType: x.serviceType,
    appName: x.appName ?? null,
    type: (x.type as RequestType) ?? "transfer",
    status: (x.status as RequestStatus) ?? "requested",
    data: x.data ?? {},
    amountUsd: x.amountUsd ?? 0,
    rate: typeof x.rate === "number" ? x.rate : null,
    amountUzs: typeof x.amountUzs === "number" ? x.amountUzs : null,
    receiptSent: Boolean(x.receiptSent),
    note: x.note ?? "",
    createdAt: iso(x.createdAt),
  };
}

export async function createRequest(input: CreateRequestInput): Promise<string> {
  const ref = adminDb.collection(REQUESTS).doc();
  await ref.set({
    ...input,
    status: "requested" as RequestStatus,
    receiptSent: false,
    note: "",
    createdAt: FieldValue.serverTimestamp(),
    statusUpdatedAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

async function getById(id: string): Promise<DocumentSnapshot> {
  return adminDb.collection(REQUESTS).doc(id).get();
}

// Ilova uchun faol (tugallanmagan/rad etilmagan) shu turdagi so'rov bormi?
export async function hasActiveRequest(appId: string, type: RequestType): Promise<boolean> {
  const snap = await adminDb.collection(REQUESTS).where("appId", "==", appId).where("type", "==", type).get();
  return snap.docs.some((d) => {
    const s = d.get("status") as RequestStatus;
    return !["completed", "rejected", "cancelled"].includes(s);
  });
}

export async function getUserRequests(ownerUid: string): Promise<RequestView[]> {
  const snap = await adminDb.collection(REQUESTS).where("ownerUid", "==", ownerUid).get();
  const items = snap.docs.map(mapRequest);
  items.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  return items;
}

export async function getAppRequests(appId: string): Promise<RequestView[]> {
  const snap = await adminDb.collection(REQUESTS).where("appId", "==", appId).get();
  const items = snap.docs.map(mapRequest);
  items.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  return items;
}

export async function getAllRequests(): Promise<RequestView[]> {
  const snap = await adminDb.collection(REQUESTS).get();
  const items = snap.docs.map(mapRequest);
  items.sort((a, b) => {
    const aActive = !["completed", "rejected", "cancelled"].includes(a.status);
    const bActive = !["completed", "rejected", "cancelled"].includes(b.status);
    if (aActive !== bActive) return aActive ? -1 : 1;
    return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
  });
  return items;
}

// ── Admin ──────────────────────────────
export async function setRequestStatus(id: string, status: RequestStatus): Promise<void> {
  const ref = adminDb.collection(REQUESTS).doc(id);
  await ref.update({ status, statusUpdatedAt: FieldValue.serverTimestamp() });

  // Yakunlangach turga qarab ilova ustida amal bajaramiz
  if (status === "completed") {
    const snap = await ref.get();
    const type = snap.get("type") as RequestType | undefined;
    const appId = snap.get("appId") as string | undefined;
    if (appId && type === "transfer") await markAppTransferred(appId);
    if (appId && type === "subscription_renewal") await renewSubscription(appId);
  }
}

export async function setRequestNote(id: string, note: string): Promise<void> {
  await adminDb.collection(REQUESTS).doc(id).update({ note: note.slice(0, 1000) });
}

export async function markRequestReceiptSent(id: string): Promise<void> {
  await adminDb.collection(REQUESTS).doc(id).update({
    receiptSent: true,
    receiptSentAt: FieldValue.serverTimestamp(),
  });
}

// To'lov tasdiqlangach: payment_pending -> in_progress
export async function confirmRequestPayment(id: string): Promise<void> {
  const snap = await getById(id);
  if (!snap.exists) throw new Error("So'rov topilmadi");
  const status = snap.get("status") as RequestStatus;
  if (status !== "payment_pending") return;
  await setRequestStatus(id, "in_progress");
}

export async function deleteRequest(id: string): Promise<void> {
  await adminDb.collection(REQUESTS).doc(id).delete();
}
