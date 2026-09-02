import "server-only";
import { adminDb, FieldValue, Timestamp, type DocumentSnapshot } from "@/lib/firebase/admin";
import { markAppTransferred, renewSubscription, consumeUpdatePackage } from "@/lib/firestore/apps";
import { REQUEST_TYPE_LABEL, requestStatusLabel, isRequestPreWork, type RequestStatus, type RequestType } from "@/lib/request-status";
import { logActivity, SYSTEM_ACTOR, type Actor } from "@/lib/firestore/activity";
import { newRequestPayment, type PaymentState } from "@/lib/payment-state";
import { notifyUser, esc, appLink } from "@/lib/notify";
import { SERVICE_LABELS } from "@/lib/labels";
import { getPricing } from "@/lib/firestore/settings";
import { estimatedDateIso, etaDaysForRequest } from "@/lib/eta";
import type { ServiceType } from "@/types";

// ISO -> "DD.MM.YYYY"
function etaDate(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}

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
  discountId?: string | null;
  discountPercent?: number;
  fromPackage?: boolean; // update paketi ichida (bepul)
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
  discountId: string | null;
  discountPercent: number;
  payment: PaymentState | null;
  fromPackage: boolean;
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
    discountId: x.discountId ?? null,
    discountPercent: x.discountPercent ?? 0,
    payment: (x.payment as PaymentState) ?? null,
    fromPackage: Boolean(x.fromPackage),
    createdAt: iso(x.createdAt),
  };
}

export async function createRequest(input: CreateRequestInput): Promise<string> {
  const ref = adminDb.collection(REQUESTS).doc();
  await ref.set({
    ...input,
    discountId: input.discountId ?? null,
    discountPercent: input.discountPercent ?? 0,
    fromPackage: Boolean(input.fromPackage),
    status: "requested" as RequestStatus,
    receiptSent: false,
    note: "",
    // Paket ichida (bepul) — to'lov qismi darhol "confirmed"; aks holda "due"
    payment: input.fromPackage
      ? { installments: { full: { state: "confirmed", paymentId: null, taxPhone: null, taxReceiptUrl: null } } }
      : newRequestPayment(),
    createdAt: FieldValue.serverTimestamp(),
    statusUpdatedAt: FieldValue.serverTimestamp(),
  });
  await logActivity(
    input.appId,
    "request_created",
    `${REQUEST_TYPE_LABEL[input.type]} so'rovi yaratildi ($${Math.round(input.amountUsd)})`,
    { type: "user", name: input.ownerName || "Foydalanuvchi", uid: input.ownerUid }
  );
  const rName = input.appName || SERVICE_LABELS[input.serviceType];
  const etaIso = estimatedDateIso(new Date().toISOString(), etaDaysForRequest(input.type, await getPricing()));
  const etaLine = etaIso ? `\n\n🗓 Taxminan *${esc(etaDate(etaIso))}* da tayyor bo'ladi` : "";
  await notifyUser(
    input.ownerUid,
    `📝 *${esc(REQUEST_TYPE_LABEL[input.type])}* so'rovingizni oldik 🙌\n📱 ${esc(rName)}${etaLine}\n\nTez orada ko'rib chiqamiz 👌${appLink(input.appId)}`
  );
  return ref.id;
}

async function getById(id: string): Promise<DocumentSnapshot> {
  return adminDb.collection(REQUESTS).doc(id).get();
}

export interface CreateCustomInvoiceInput {
  appId: string;
  ownerUid: string;
  ownerName: string;
  ownerPhone: string;
  title: string; // admin kiritgan nom (masalan: "Domen narxi")
  amountUsd: number;
  rate: number | null;
  amountUzs: number | null;
  actor: Actor;
}

// Admin tomonidan ariza ustiga qo'shimcha (custom) hisob-faktura biriktiriladi —
// so'rovlar (requests) kolleksiyasida "custom" turi sifatida, servis turi "other".
// Foydalanuvchiga oddiy to'lov sifatida (bitta "full" qism) ko'rinadi.
export async function createCustomInvoice(input: CreateCustomInvoiceInput): Promise<string> {
  const ref = adminDb.collection(REQUESTS).doc();
  await ref.set({
    appId: input.appId,
    ownerUid: input.ownerUid,
    ownerName: input.ownerName,
    ownerPhone: input.ownerPhone,
    serviceType: "other" as ServiceType,
    appName: input.title,
    type: "custom" as RequestType,
    data: {},
    amountUsd: input.amountUsd,
    rate: input.rate,
    amountUzs: input.amountUzs,
    discountId: null,
    discountPercent: 0,
    fromPackage: false,
    status: "requested" as RequestStatus,
    receiptSent: false,
    note: "",
    payment: newRequestPayment(),
    createdAt: FieldValue.serverTimestamp(),
    statusUpdatedAt: FieldValue.serverTimestamp(),
  });
  await logActivity(
    input.appId,
    "custom_invoice_created",
    `Qo'shimcha hisob-faktura yaratildi: "${input.title}" ($${input.amountUsd})`,
    input.actor
  );
  await notifyUser(
    input.ownerUid,
    `🧾 Sizga yangi hisob\\-faktura yuborildi\n\n📌 ${esc(input.title)}\n💵 $${esc(String(input.amountUsd))}\n\nTo'lovni "To'lov" bo'limida amalga oshirishingiz mumkin${appLink(input.appId)}`
  );
  return ref.id;
}

// Ilova uchun faol (tugallanmagan/rad etilmagan) shu turdagi so'rov bormi?
export async function hasActiveRequest(appId: string, type: RequestType): Promise<boolean> {
  const snap = await adminDb.collection(REQUESTS).where("appId", "==", appId).where("type", "==", type).get();
  return snap.docs.some((d) => {
    const s = d.get("status") as RequestStatus;
    return !["completed", "rejected", "cancelled"].includes(s);
  });
}

// Ilova uchun faol shu turdagi so'rov id'si (bo'lsa) — "get-or-create" oqimlari uchun
// (masalan home page'dan bittada to'lash: so'rov mavjud bo'lsa — o'shani qaytaradi).
export async function getActiveRequestId(appId: string, type: RequestType): Promise<string | null> {
  const snap = await adminDb.collection(REQUESTS).where("appId", "==", appId).where("type", "==", type).get();
  const active = snap.docs.find((d) => {
    const s = d.get("status") as RequestStatus;
    return !["completed", "rejected", "cancelled"].includes(s);
  });
  return active?.id ?? null;
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
export async function setRequestStatus(id: string, status: RequestStatus, actor?: Actor): Promise<void> {
  const ref = adminDb.collection(REQUESTS).doc(id);
  const before = await ref.get();
  const type = before.get("type") as RequestType | undefined;
  const appId = before.get("appId") as string | undefined;
  const act = actor ?? SYSTEM_ACTOR;

  await ref.update({ status, statusUpdatedAt: FieldValue.serverTimestamp() });

  // Yakunlangach turga qarab ilova ustida amal bajaramiz
  if (status === "completed") {
    if (appId && type === "transfer") await markAppTransferred(appId, act);
    if (appId && type === "subscription_renewal") await renewSubscription(appId, { actor: act });
    // Paket ichidagi update yakunlansa — kvotadan bittasi ishlatiladi
    if (appId && type === "update" && before.get("fromPackage")) await consumeUpdatePackage(appId, act);
  }

  if (actor && appId && type) {
    await logActivity(
      appId,
      "request_status_changed",
      `${REQUEST_TYPE_LABEL[type]} so'rovi holati "${requestStatusLabel(type, status)}" ga o'zgartirildi`,
      actor
    );
  }

  // Foydalanuvchiga xabar.
  // Transfer/obuna yakunlanishi markAppTransferred/renewSubscription orqali alohida xabar beradi —
  // bu yerda takror yubormaymiz.
  const outcomeOwned = status === "completed" && (type === "transfer" || type === "subscription_renewal");
  if (appId && type && !outcomeOwned) {
    const ownerUid = before.get("ownerUid") as string | undefined;
    const st = before.get("serviceType") as ServiceType;
    const name = (before.get("appName") as string) || SERVICE_LABELS[st];
    if (ownerUid) {
      let msg: string;
      if (status === "completed") {
        if (type === "update") {
          msg = `✅ *${esc(name)}* uchun yangilanish chiqarildi — ilovangiz store'da yangilandi 🎉${appLink(appId)}`;
        } else if (type === "push_certificate") {
          msg = `✅ *${esc(name)}* uchun push-sertifikat tayyor bo'ldi 🎉\nEndi push-bildirishnomalarni yuborsangiz bo'ladi${appLink(appId)}`;
        } else {
          msg = `✅ *${esc(REQUEST_TYPE_LABEL[type])}* so'rovingiz bajarildi — *${esc(name)}* 🎉${appLink(appId)}`;
        }
      } else if (status === "rejected" || status === "cancelled") {
        msg = `❌ *${esc(REQUEST_TYPE_LABEL[type])}* so'rovingiz bekor qilindi — *${esc(name)}*\nSavollar bo'lsa biz bilan bog'laning 🙌${appLink(appId)}`;
      } else {
        msg = `🔧 *${esc(name)}* — *${esc(REQUEST_TYPE_LABEL[type])}* so'rovingizda yangilik\n\n📍 Bosqich: *${esc(requestStatusLabel(type, status))}*${appLink(appId)}`;
      }
      await notifyUser(ownerUid, msg);
    }
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

// To'lov tasdiqlangach: to'lov-oldi bosqich -> in_progress
export async function confirmRequestPayment(id: string): Promise<void> {
  const snap = await getById(id);
  if (!snap.exists) throw new Error("So'rov topilmadi");
  const status = snap.get("status") as RequestStatus;
  if (!isRequestPreWork(status)) return; // terminal yoki allaqachon jarayonda/yakunlangan
  await setRequestStatus(id, "in_progress");
}

export async function deleteRequest(id: string): Promise<void> {
  await adminDb.collection(REQUESTS).doc(id).delete();
}
