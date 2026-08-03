import "server-only";
import { adminDb, FieldValue, Timestamp, type DocumentSnapshot } from "@/lib/firebase/admin";
import type { ServiceType } from "@/types";
import { isTerminalSuccess, type AppStatus } from "@/lib/app-status";
import { getReviewedAppIds } from "@/lib/firestore/reviews";
import { getPricing } from "@/lib/firestore/settings";
import { fullUsd, finalUsd } from "@/lib/payment";
import { logActivity, type Actor } from "@/lib/firestore/activity";
import { STATUS_META, SERVICE_LABELS } from "@/lib/labels";
import { notifyUser, esc, appLink } from "@/lib/notify";
import { newAppPayment, appInstallmentKeys, type PaymentState } from "@/lib/payment-state";

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
  servicePrice?: number | null; // narx platforma/turga bog'liq xizmatlar uchun (akkaunt ochish)
  accountPlatform?: string | null; // "google" | "apple" (akkaunt ochish)
  accountType?: string | null; // "personal" | "corporate" (akkaunt ochish)
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
    servicePrice: input.servicePrice ?? null,
    accountPlatform: input.accountPlatform ?? null,
    accountType: input.accountType ?? null,
    iconUrl: null, // Storage'ga yuklangach to'ladi
    status: "submitted" satisfies AppStatus,
    statusUpdatedAt: FieldValue.serverTimestamp(),
    publication,
    subscription,
    telegramSent: false,
    finalReceiptSent: false,
    finalPaid: false,
    payment: newAppPayment(input.serviceType),
    createdAt: FieldValue.serverTimestamp(),
  });
  await logActivity(ref.id, "created", "Ariza yaratildi", {
    type: "user",
    name: input.contact?.fullName || input.ownerEmail || "Foydalanuvchi",
    uid: input.ownerUid,
  });
  const subName = input.appName || SERVICE_LABELS[input.serviceType];
  await notifyUser(
    input.ownerUid,
    `🎉 Arizangizni oldik, rahmat 🙌\n📱 ${esc(subName)}\n\nTez orada ko'rib chiqib ishga kirishamiz — yangiliklarni shu yerda kuzatib boring 👍${appLink(ref.id)}`
  );
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

// Yakuniy (qolgan) to'lov cheki yuborilgani.
export async function markFinalReceiptSent(appId: string): Promise<void> {
  await adminDb.collection(APPS).doc(appId).update({
    finalReceiptSent: true,
    finalReceiptSentAt: FieldValue.serverTimestamp(),
  });
}

// Yakuniy to'lov tasdiqlangani.
export async function setFinalPaid(appId: string): Promise<void> {
  await adminDb.collection(APPS).doc(appId).update({ finalPaid: true });
}

// Soliq cheki uchun berilgan telefon (yakuniy/to'liq to'lovda).
export async function setAppTaxPhone(appId: string, phone: string): Promise<void> {
  await adminDb.collection(APPS).doc(appId).update({ taxPhone: phone });
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
// Store nomi (xabarlar uchun)
function storeName(serviceType: ServiceType): string {
  return serviceType === "app-store" || serviceType === "apple-transfer" ? "App Store" : "Play Market";
}

// Qolgan (yakuniy) to'lov haqida eslatma qatori — faqat to'lanmagan bo'lsa.
function finalDueLine(snap: DocumentSnapshot, serviceType: ServiceType, pricing: Awaited<ReturnType<typeof getPricing>>): string {
  const finState = snap.get("payment")?.installments?.final?.state;
  const amt = Math.round(finalUsd(serviceType, pricing));
  if ((finState === "due" || finState === "rejected") && amt > 0) {
    return `\n\n💳 Eslatma: qolgan to'lovingiz $${amt} — iltimos, kechiktirmasdan yakunlang`;
  }
  return "";
}

export async function setAppStatus(appId: string, status: AppStatus, actor?: Actor): Promise<void> {
  const ref = adminDb.collection(APPS).doc(appId);
  const snap = await ref.get();
  const update: Record<string, unknown> = { status, statusUpdatedAt: FieldValue.serverTimestamp() };
  // Yakuniy bosqichga (published/completed) yetganda — yakuniy to'lov qismini "ochamiz".
  if (isTerminalSuccess(status)) {
    const st = snap.get("serviceType") as ServiceType;
    if (appInstallmentKeys(st).includes("final")) {
      const finalState = snap.get("payment")?.installments?.final?.state;
      if (finalState === "locked" || finalState === undefined) update["payment.installments.final.state"] = "due";
    }
  }
  await ref.update(update);
  if (actor) await logActivity(appId, "status_changed", `Holat "${STATUS_META[status]?.label ?? status}" ga o'zgartirildi`, actor);

  // Foydalanuvchiga xabar (published bundan mustasno — u markPublished orqali alohida xabar beradi)
  if (status !== "published") {
    const serviceType = snap.get("serviceType") as ServiceType;
    const name = snap.get("appName") || SERVICE_LABELS[serviceType];
    const meta = STATUS_META[status];
    const label = meta?.label ?? status;
    let msg = `📱 *${esc(name)}* — ilovangizda yangilik bor 👇\n\n📍 Bosqich: *${esc(label)}*`;
    if (meta?.desc) msg += `\n${esc(meta.desc)}`;
    const pricing = await getPricing();
    msg += finalDueLine(snap, serviceType, pricing);
    msg += appLink(appId);
    await notifyUser(snap.get("ownerUid"), msg);
  }
}

// Obuna to'xtatildi — ilova store'dan olib tashlandi (terminal). Obuna faolsizlanadi.
export async function endSubscription(appId: string, actor?: Actor): Promise<void> {
  await adminDb.collection(APPS).doc(appId).update({
    status: "subscription_ended" satisfies AppStatus,
    statusUpdatedAt: FieldValue.serverTimestamp(),
    "subscription.active": false,
  });
  if (actor) await logActivity(appId, "subscription_ended", "Obuna to'xtatildi (ilova store'dan olib tashlandi)", actor);
  const s = await adminDb.collection(APPS).doc(appId).get();
  const name = s.get("appName") || SERVICE_LABELS[s.get("serviceType") as ServiceType];
  await notifyUser(s.get("ownerUid"), `😔 Afsuski, *${esc(name)}* obunasi tugadi\nIlova store'dan vaqtincha olib qo'yildi\n\nQayta faollashtirishni istasangiz, bemalol yozing 🙌${appLink(appId)}`);
}

// Transfer yakunlangach ilova "transfer qilingan" holatiga o'tadi (obuna endi amal qilmaydi).
export async function markAppTransferred(appId: string, actor?: Actor): Promise<void> {
  const ref = adminDb.collection(APPS).doc(appId);
  await ref.update({
    status: "transferred" satisfies AppStatus,
    transferredAt: FieldValue.serverTimestamp(),
    statusUpdatedAt: FieldValue.serverTimestamp(),
    "subscription.active": false,
  });
  if (actor) await logActivity(appId, "transferred", "Ilova transfer qilingan deb belgilandi", actor);
  const s = await ref.get();
  const name = s.get("appName") || SERVICE_LABELS[s.get("serviceType") as ServiceType];
  await notifyUser(s.get("ownerUid"), `✅ Bo'ldi\\! *${esc(name)}* endi to'liq sizniki 🎉\n\nTransfer muvaffaqiyatli yakunlandi${appLink(appId)}`);
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
  finalReceiptSent: boolean;
  finalPaid: boolean;
  publishedPrice: number | null; // store'ga chiqarilgan paytdagi to'liq narx ($)
  servicePrice: number | null; // akkaunt ochish kabi xizmatlar uchun saqlangan narx ($)
  accountPlatform: string | null; // "google" | "apple"
  accountType: string | null; // "personal" | "corporate"
  taxPhone: string | null; // yakuniy to'lovda soliq cheki uchun berilgan telefon
  ownerUid: string;
  ownerEmail: string | null;
  contact: { fullName: string; phone: string; email: string } | null;
  createdAt: string | null;
  transferredAt: string | null;
  publication: { published: boolean; publishedAt: string | null; storeUrl: string | null };
  subscription: null | {
    durationDays: number;
    startDate: string | null;
    endDate: string | null;
    active: boolean;
    renewedCount: number;
  };
  payment: PaymentState | null;
  // Oylik update paketi (obuna) — kvotali
  updatePackage: null | {
    active: boolean;
    startDate: string | null;
    endDate: string | null;
    quota: number;
    used: number;
    priceUsd: number;
    reminded: boolean; // tugash eslatmasi yuborilganmi
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
    finalReceiptSent: Boolean(x.finalReceiptSent),
    finalPaid: Boolean(x.finalPaid),
    publishedPrice: typeof x.publishedPrice === "number" ? x.publishedPrice : null,
    servicePrice: typeof x.servicePrice === "number" ? x.servicePrice : null,
    accountPlatform: x.accountPlatform ?? null,
    accountType: x.accountType ?? null,
    taxPhone: x.taxPhone ?? null,
    ownerUid: x.ownerUid ?? "",
    ownerEmail: x.ownerEmail ?? null,
    contact: x.contact ?? null,
    createdAt: tsToIso(x.createdAt),
    transferredAt: tsToIso(x.transferredAt),
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
    payment: (x.payment as PaymentState) ?? null,
    updatePackage: x.updatePackage
      ? {
          active: Boolean(x.updatePackage.active),
          startDate: tsToIso(x.updatePackage.startDate),
          endDate: tsToIso(x.updatePackage.endDate),
          quota: x.updatePackage.quota ?? 0,
          used: x.updatePackage.used ?? 0,
          priceUsd: x.updatePackage.priceUsd ?? 0,
          reminded: Boolean(x.updatePackage.reminded),
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

// Landing karuseli — "showcase" kolleksiyasidan (Play developer akkauntidan olingan).
export interface ShowcaseApp {
  id: string;
  appName: string;
  iconUrl: string;
  storeUrl: string | null;
}

export async function getShowcaseApps(): Promise<ShowcaseApp[]> {
  const snap = await adminDb.collection("showcase").get();
  const out: ShowcaseApp[] = [];
  for (const d of snap.docs) {
    const x = d.data();
    if (!x.iconUrl) continue;
    out.push({
      id: d.id,
      appName: (x.name as string) || "",
      iconUrl: x.iconUrl as string,
      storeUrl: (x.storeUrl as string) ?? null,
    });
  }
  out.sort((a, b) => a.appName.localeCompare(b.appName));
  return out;
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
  storeUrl?: string,
  actor?: Actor
): Promise<void> {
  const ref = adminDb.collection(APPS).doc(appId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Ariza topilmadi");

  const serviceType = snap.get("serviceType") as ServiceType;
  const publishedTs = Timestamp.fromDate(publishedAt);

  // Chiqarilgan paytdagi to'liq narxni saqlaymiz (keyingi uzaytirish 50% shundan).
  // Bir marta chiqarilgan bo'lsa (qayta chiqarishda) o'zgartirmaymiz.
  const existingPublishedPrice = snap.get("publishedPrice");
  const publishedPrice =
    typeof existingPublishedPrice === "number"
      ? existingPublishedPrice
      : fullUsd(serviceType, await getPricing());

  const update: Record<string, unknown> = {
    publication: {
      published: true,
      publishedAt: publishedTs,
      storeUrl: storeUrl ?? snap.get("publication")?.storeUrl ?? null,
    } satisfies Publication,
    publishedPrice,
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

  // Yakuniy to'lov qismini "ochamiz" (locked -> due), agar hali qulflangan bo'lsa.
  if (appInstallmentKeys(serviceType).includes("final")) {
    const finalState = snap.get("payment")?.installments?.final?.state;
    if (finalState === "locked" || finalState === undefined) {
      update["payment.installments.final.state"] = "due";
    }
  }

  await ref.update(update);
  if (actor) {
    const extra = hasSubscription(serviceType) ? " (obuna 9 oy boshlandi)" : "";
    await logActivity(appId, "published", `Ilova store'ga chiqarildi${extra}`, actor);
  }

  const name = snap.get("appName") || SERVICE_LABELS[serviceType];
  const pricing = await getPricing();
  let msg = `🎉 Tabriklaymiz\\! *${esc(name)}* ${esc(storeName(serviceType))}'da chiqdi 🚀\n\nEndi u store'da hammaga ochiq`;
  if (hasSubscription(serviceType)) {
    const endStr = new Date(publishedAt.getTime() + SUBSCRIPTION_DURATION_DAYS * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    msg += `\n🗓 Obuna ${esc(endStr)} gacha amal qiladi \\(9 oy\\)`;
  }
  const finalAmt = Math.round(finalUsd(serviceType, pricing));
  const finalPaid = snap.get("payment")?.installments?.final?.state === "confirmed" || snap.get("finalPaid");
  if (finalAmt > 0 && !finalPaid) {
    msg += `\n\n💳 Eslatma: qolgan to'lovingiz $${finalAmt} — iltimos, kechiktirmasdan yakunlang`;
  }
  msg += appLink(appId);
  await notifyUser(snap.get("ownerUid"), msg);
}

// Admin/tizim: obunani 270 kunga uzaytirish.
// from="end"  — joriy tugash sanasidan boshlab (davomiylik; standart).
// from="today" — uzaytirilgan kundan (hozirdan) boshlab.
export async function renewSubscription(
  appId: string,
  opts: { from?: "end" | "today"; renewedAt?: Date; actor?: Actor } = {}
): Promise<void> {
  const { from = "end", renewedAt = new Date(), actor } = opts;
  const ref = adminDb.collection(APPS).doc(appId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Ariza topilmadi");

  const sub = snap.get("subscription") as Subscription | null;
  if (!sub) throw new Error("Bu xizmatda obuna yo'q");

  const currentEnd = sub.endDate ? sub.endDate.toDate() : renewedAt;
  const base = from === "today" ? renewedAt : currentEnd;
  const newEnd = new Date(base.getTime() + SUBSCRIPTION_DURATION_DAYS * 24 * 60 * 60 * 1000);

  await ref.update({
    "subscription.endDate": Timestamp.fromDate(newEnd),
    "subscription.active": true,
    "subscription.renewedCount": (sub.renewedCount ?? 0) + 1,
    "subscription.lastRenewedAt": Timestamp.fromDate(renewedAt),
    "subscription.reminded": false, // eski (ishlatilmaydi)
    "subscription.remindedOn": null, // yangi muddat — eslatmalar qayta boshlanadi
  });
  if (actor) {
    const fromLabel = from === "today" ? "bugundan" : "tugagan kundan";
    await logActivity(
      appId,
      "subscription_renewed",
      `Obuna 9 oyga uzaytirildi (${fromLabel}) — yangi tugash: ${newEnd.toISOString().slice(0, 10)}`,
      actor
    );
  }
  const name = snap.get("appName") || SERVICE_LABELS[snap.get("serviceType") as ServiceType];
  await notifyUser(
    snap.get("ownerUid"),
    `🔄 *${esc(name)}* obunasi yana 9 oyga uzaytirildi ✅\n\n🗓 Keyingi tugash sanasi: ${esc(newEnd.toISOString().slice(0, 10))}${appLink(appId)}`
  );
}

// Update paketini faollashtirish (to'lov tasdiqlangach). Yangi paket — kvota 0 dan.
export async function activateUpdatePackage(
  appId: string,
  opts: { days: number; quota: number; priceUsd: number; actor?: Actor; startedAt?: Date }
): Promise<void> {
  const { days, quota, priceUsd, actor, startedAt = new Date() } = opts;
  const end = new Date(startedAt.getTime() + days * 24 * 60 * 60 * 1000);
  const ref = adminDb.collection(APPS).doc(appId);
  await ref.update({
    updatePackage: {
      active: true,
      startDate: Timestamp.fromDate(startedAt),
      endDate: Timestamp.fromDate(end),
      quota,
      used: 0,
      priceUsd,
      reminded: false,
    },
  });
  if (actor) {
    await logActivity(
      appId,
      "update_package_activated",
      `Update paketi faollashtirildi (${quota} ta update · ${days} kun) — tugash: ${end.toISOString().slice(0, 10)}`,
      actor
    );
  }
  const s = await ref.get();
  const name = s.get("appName") || SERVICE_LABELS[s.get("serviceType") as ServiceType];
  await notifyUser(
    s.get("ownerUid"),
    `📦 Zo'r\\! *${esc(name)}* uchun update paketi ishga tushdi 🎉\n\n🔄 ${esc(String(quota))} ta bepul update, ${esc(String(days))} kun\n🗓 ${esc(end.toISOString().slice(0, 10))} gacha amal qiladi${appLink(appId)}`
  );
}

// Update paketidan bitta update ishlatilganda (so'rov yakunlanganda) chaqiriladi.
export async function consumeUpdatePackage(appId: string, actor?: Actor): Promise<void> {
  const ref = adminDb.collection(APPS).doc(appId);
  const snap = await ref.get();
  const pkg = snap.get("updatePackage") as { used?: number; quota?: number } | null;
  if (!pkg) return;
  const used = (pkg.used ?? 0) + 1;
  const quota = pkg.quota ?? 0;
  await ref.update({ "updatePackage.used": used });
  if (actor) {
    await logActivity(appId, "update_package_used", `Update paketidan foydalanildi (${used}/${quota})`, actor);
  }
  const name = snap.get("appName") || SERVICE_LABELS[snap.get("serviceType") as ServiceType];
  const left = Math.max(0, quota - used);
  await notifyUser(
    snap.get("ownerUid"),
    `🔄 *${esc(name)}* uchun yangi update chiqdi ✅\n\nPaketda yana ${esc(String(left))} ta update qoldi · ${esc(String(used))}/${esc(String(quota))}${appLink(appId)}`
  );
}
