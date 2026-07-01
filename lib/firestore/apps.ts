import "server-only";
import { adminDb, FieldValue, Timestamp, type DocumentSnapshot } from "@/lib/firebase/admin";
import type { ServiceType } from "@/types";
import type { AppStatus } from "@/lib/app-status";
import { getReviewedAppIds } from "@/lib/firestore/reviews";

export type { AppStatus };

// Obuna faqat "Store-ga chiqarish" xizmatlarida bor (transfer'larda yo'q).
const PUBLISH_SERVICES: ServiceType[] = ["play-market", "app-store"];

// Obuna muddati: 9 oy = 270 kun (xizmat narxlari sahifasiga muvofiq).
export const SUBSCRIPTION_DURATION_DAYS = 270;

export function hasSubscription(serviceType: ServiceType): boolean {
  return PUBLISH_SERVICES.includes(serviceType);
}

// Store'ga chiqqaniga oid ma'lumot.
export interface Publication {
  published: boolean;
  publishedAt: Timestamp | null; // qachon chiqdi
  storeUrl: string | null; // ilova store havolasi (ixtiyoriy)
}

// Obuna ma'lumoti (270 kun, publishedAt'dan boshlanadi).
export interface Subscription {
  plan: "publish";
  durationDays: number;
  startDate: Timestamp | null; // = publishedAt (birinchi muddat boshlanishi)
  endDate: Timestamp | null; // hozirgi tugash sanasi (uzaytirilsa o'zgaradi)
  active: boolean;
  renewedCount: number; // necha marta uzaytirilgan
  lastRenewedAt: Timestamp | null;
}

export interface CreateAppInput {
  ownerUid: string;
  ownerEmail: string | null;
  serviceType: ServiceType;
  appName: string | null;
  contact: { fullName: string; phone: string; email: string };
  submission: Record<string, string>;
}

const APPS = "apps";

// Yangi ariza hujjatini yaratadi. appId qaytaradi.
export async function createAppSubmission(input: CreateAppInput): Promise<string> {
  const ref = adminDb.collection(APPS).doc();

  // Boshlang'ich: hali store'ga chiqmagan.
  const publication: Publication = {
    published: false,
    publishedAt: null,
    storeUrl: null,
  };

  // Chiqarish xizmatlarida bo'sh obuna (admin chiqargach to'ladi), transfer'da null.
  const subscription: Subscription | null = hasSubscription(input.serviceType)
    ? {
        plan: "publish",
        durationDays: SUBSCRIPTION_DURATION_DAYS,
        startDate: null,
        endDate: null,
        active: false,
        renewedCount: 0,
        lastRenewedAt: null,
      }
    : null;

  await ref.set({
    ownerUid: input.ownerUid,
    ownerEmail: input.ownerEmail,
    serviceType: input.serviceType,
    appName: input.appName,
    contact: input.contact,
    submission: input.submission,
    iconUrl: null, // Storage'ga yuklangach to'ladi
    status: "submitted" satisfies AppStatus,
    statusUpdatedAt: FieldValue.serverTimestamp(),
    publication,
    subscription,
    telegramSent: false,
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

// Telegramga muvaffaqiyatli yuborilgach belgilaydi.
export async function markTelegramSent(appId: string): Promise<void> {
  await adminDb.collection(APPS).doc(appId).update({ telegramSent: true });
}

// Storage'ga yuklangan ikona URL'ini hujjatga yozadi.
export async function setAppIconUrl(appId: string, iconUrl: string): Promise<void> {
  await adminDb.collection(APPS).doc(appId).update({ iconUrl });
}

// To'lov cheki yuborilganini belgilaydi.
export async function markReceiptSent(appId: string): Promise<void> {
  await adminDb.collection(APPS).doc(appId).update({
    receiptSent: true,
    receiptSentAt: FieldValue.serverTimestamp(),
  });
}

// Admin: arizani o'chiradi + unga bog'liq to'lov va sharhlarni.
export async function deleteApp(appId: string): Promise<void> {
  const [pays, revs] = await Promise.all([
    adminDb.collection("payments").where("appId", "==", appId).get(),
    adminDb.collection("reviews").where("appId", "==", appId).get(),
  ]);
  const batch = adminDb.batch();
  batch.delete(adminDb.collection(APPS).doc(appId));
  pays.forEach((d) => batch.delete(d.ref));
  revs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

// Admin: ilova holatini o'zgartiradi (oqim bo'ylab yoki rad etish/bekor qilish).
export async function setAppStatus(appId: string, status: AppStatus): Promise<void> {
  await adminDb.collection(APPS).doc(appId).update({
    status,
    statusUpdatedAt: FieldValue.serverTimestamp(),
  });
}

// Panel uchun seriyalashtirилgan ko'rinish (Timestamp -> ISO string).
export interface AppView {
  id: string;
  serviceType: ServiceType;
  appName: string | null;
  status: AppStatus;
  iconUrl: string | null;
  telegramSent: boolean;
  reviewed: boolean;
  receiptSent: boolean;
  ownerEmail: string | null;
  contact: { fullName: string; phone: string; email: string } | null;
  createdAt: string | null;
  publication: { published: boolean; publishedAt: string | null; storeUrl: string | null };
  subscription: null | {
    durationDays: number;
    startDate: string | null;
    endDate: string | null;
    active: boolean;
    renewedCount: number;
  };
}

function tsToIso(v: unknown): string | null {
  return v instanceof Timestamp ? v.toDate().toISOString() : null;
}

function mapApp(d: DocumentSnapshot, reviewed: boolean): AppView {
  const x = d.data() ?? {};
  const pub = x.publication ?? {};
  const sub = x.subscription as Subscription | null;
  return {
    id: d.id,
    serviceType: x.serviceType,
    appName: x.appName ?? null,
    status: (x.status ?? "submitted") as AppStatus,
    iconUrl: x.iconUrl ?? null,
    telegramSent: Boolean(x.telegramSent),
    reviewed,
    receiptSent: Boolean(x.receiptSent),
    ownerEmail: x.ownerEmail ?? null,
    contact: x.contact ?? null,
    createdAt: tsToIso(x.createdAt),
    publication: {
      published: Boolean(pub.published),
      publishedAt: tsToIso(pub.publishedAt),
      storeUrl: pub.storeUrl ?? null,
    },
    subscription: sub
      ? {
          durationDays: sub.durationDays,
          startDate: tsToIso(sub.startDate),
          endDate: tsToIso(sub.endDate),
          active: Boolean(sub.active),
          renewedCount: sub.renewedCount ?? 0,
        }
      : null,
  };
}

// Foydalanuvchining barcha arizalari (yangi -> eski). Xotirada saralanadi
// (kompozit indeks talab qilinmaydi).
export async function getUserApps(uid: string): Promise<AppView[]> {
  const [snap, reviewedIds] = await Promise.all([
    adminDb.collection(APPS).where("ownerUid", "==", uid).get(),
    getReviewedAppIds(uid),
  ]);
  const apps = snap.docs.map((d) => mapApp(d, reviewedIds.has(d.id)));
  apps.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  return apps;
}

// Admin: barcha foydalanuvchilarning arizalari (yangi -> eski).
export async function getAllApps(): Promise<AppView[]> {
  const snap = await adminDb.collection(APPS).get();
  const apps = snap.docs.map((d) => mapApp(d, false));
  apps.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  return apps;
}

// Admin: bitta ariza + submission ma'lumotlari.
export async function getAppDetail(
  appId: string
): Promise<{ app: AppView; submission: Record<string, string> } | null> {
  const d = await adminDb.collection(APPS).doc(appId).get();
  if (!d.exists) return null;
  return {
    app: mapApp(d, false),
    submission: (d.get("submission") as Record<string, string>) ?? {},
  };
}

// Admin: ilova store'ga chiqdi deb belgilash. Chiqarish xizmatlarida obunani
// avtomatik hisoblaydi (startDate = publishedAt, endDate = +270 kun, active = true).
export async function markPublished(
  appId: string,
  publishedAt: Date,
  storeUrl?: string
): Promise<void> {
  const ref = adminDb.collection(APPS).doc(appId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Ariza topilmadi");

  const serviceType = snap.get("serviceType") as ServiceType;
  const publishedTs = Timestamp.fromDate(publishedAt);

  const update: Record<string, unknown> = {
    publication: {
      published: true,
      publishedAt: publishedTs,
      storeUrl: storeUrl ?? snap.get("publication")?.storeUrl ?? null,
    } satisfies Publication,
    status: "published" satisfies AppStatus,
    statusUpdatedAt: FieldValue.serverTimestamp(),
  };

  if (hasSubscription(serviceType)) {
    const endMs = publishedAt.getTime() + SUBSCRIPTION_DURATION_DAYS * 24 * 60 * 60 * 1000;
    update.subscription = {
      plan: "publish",
      durationDays: SUBSCRIPTION_DURATION_DAYS,
      startDate: publishedTs,
      endDate: Timestamp.fromDate(new Date(endMs)),
      active: true,
      renewedCount: 0,
      lastRenewedAt: null,
    } satisfies Subscription;
  }

  await ref.update(update);
}

// Admin: obunani uzaytirish (to'lov tasdiqlangach). Yana 270 kun qo'shadi.
// Muddat tugamagan bo'lsa — joriy tugash sanasidan davom etadi (stack).
// Tugagan bo'lsa — uzaytirilgan kundan yangi muddat boshlanadi.
export async function renewSubscription(appId: string, renewedAt: Date = new Date()): Promise<void> {
  const ref = adminDb.collection(APPS).doc(appId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Ariza topilmadi");

  const sub = snap.get("subscription") as Subscription | null;
  if (!sub) throw new Error("Bu xizmatda obuna yo'q");

  const currentEnd = sub.endDate ? sub.endDate.toDate() : renewedAt;
  // Tugamagan bo'lsa joriy tugashdan, tugagan bo'lsa hozirdan boshlab uzaytiramiz.
  const base = currentEnd.getTime() > renewedAt.getTime() ? currentEnd : renewedAt;
  const newEnd = new Date(base.getTime() + SUBSCRIPTION_DURATION_DAYS * 24 * 60 * 60 * 1000);

  await ref.update({
    "subscription.endDate": Timestamp.fromDate(newEnd),
    "subscription.active": true,
    "subscription.renewedCount": (sub.renewedCount ?? 0) + 1,
    "subscription.lastRenewedAt": Timestamp.fromDate(renewedAt),
  });
}
