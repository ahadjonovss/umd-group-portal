"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/dal";
import type { Actor } from "@/lib/firestore/activity";
import { setAppStatus, markPublished, markAppTransferred, endSubscription, renewSubscription, deleteApp } from "@/lib/firestore/apps";
import { setReviewApproved, deleteReview } from "@/lib/firestore/reviews";
import { setUserRole, setUserPassword, setUserEmail, setUserProfile, deleteUser, getUserTelegram } from "@/lib/firestore/users";
import { adminDb } from "@/lib/firebase/admin";
import { notifyUser, esc, appLink } from "@/lib/notify";
import { urlButton } from "@/lib/telegram";
import { SERVICE_SHORT } from "@/lib/labels";
import { SITE_URL } from "@/lib/site";
import type { ServiceType } from "@/types";
import { confirmPayment, setPaymentNote, deletePayment, getPendingPaymentIdByRequest, createPayment, voidRequestPayments } from "@/lib/firestore/payments";
import { confirmPaymentBatch, rejectPaymentBatch } from "@/lib/firestore/paymentBatches";
import { setRequestStatus, setRequestNote, deleteRequest, createCustomInvoice } from "@/lib/firestore/requests";
import type { RequestStatus } from "@/lib/request-status";
import { setPricing, setPaymentInfo, getPricing, type Pricing, type PaymentInfo } from "@/lib/firestore/settings";
import { createDiscount, deleteDiscount, getActiveDiscount } from "@/lib/firestore/discounts";
import { categoryForServiceType, applyDiscount, type DiscountService } from "@/lib/discount";
import { advanceUsdApp, finalUsdApp, serviceBaseUsd, advancePercentForApp } from "@/lib/payment";
import type { AppStatus } from "@/lib/app-status";
import { getUsdRate } from "@/lib/cbu";

// Joriy admin sessiyasidan "kim" (actor) ma'lumotini quradi.
async function adminActor(): Promise<Actor> {
  const u = await requireAdmin();
  return { type: "admin", name: u.name || u.email || "Admin", uid: u.uid };
}

// Obuna eslatma xabarini foydalanuvchining Telegramiga yuboradi (obunalar bo'limi).
function dmy(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}

export async function actSendSubscriptionMessage(appId: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const snap = await adminDb.collection("apps").doc(appId).get();
  if (!snap.exists) return { ok: false, error: "Ariza topilmadi" };
  const a = snap.data()!;
  const ownerUid = a.ownerUid as string;

  const tg = await getUserTelegram(ownerUid);
  if (tg.chatIds.length === 0) return { ok: false, error: "Telegramga ulanmagan" };
  if (!tg.notify) return { ok: false, error: "Xabarnoma o'chirilgan" };

  const endIso = a.subscription?.endDate?.toDate?.().toISOString?.();
  if (!endIso) return { ok: false, error: "Obuna sanasi yo'q" };

  const appName = esc((a.appName as string) || SERVICE_SHORT[a.serviceType as ServiceType]);
  const date = esc(dmy(endIso));
  const url = `${SITE_URL}/panel/app/${appId}`;

  // Muddatga qarab: kelajakda bo'lsa "N kundan keyin yetadi", o'tgan bo'lsa "N kun oldin yetgan"
  const DAY = 24 * 60 * 60 * 1000;
  const daysLeft = Math.floor(new Date(endIso).getTime() / DAY) - Math.floor(Date.now() / DAY);
  let head: string;
  if (daysLeft > 0) {
    head = `⏳ *${appName}* obunangiz *${daysLeft} kun*dan keyin yakuniga yetadi \\(${date}\\)`;
  } else if (daysLeft === 0) {
    head = `📅 Bugun *${appName}* obunangiz yakuniga yetadi \\(${date}\\)`;
  } else {
    head = `⚠️ *${appName}* obunangiz *${Math.abs(daysLeft)} kun* oldin yakuniga yetgan \\(${date}\\)`;
  }
  const msg =
    `${head}\n\n` +
    `Foydalanish shartlarimizga ko'ra obunani yangilashingiz kerak\\. Aks holda ilova ogohlantirishsiz store'lardan olib tashlanishi mumkin\\.`;

  await notifyUser(ownerUid, msg, urlButton("🔄 Obunani yangilash", url));
  return { ok: true };
}

export async function actSetStatus(appId: string, status: AppStatus) {
  const actor = await adminActor();
  await setAppStatus(appId, status, actor);
  revalidatePath("/admin");
}

export async function actPublish(appId: string, publishedAt: string, storeUrl: string) {
  const actor = await adminActor();
  const date = publishedAt ? new Date(publishedAt) : new Date();
  await markPublished(appId, date, storeUrl.trim() || undefined, actor);
  revalidatePath("/admin");
}

export async function actMarkTransferred(appId: string) {
  const actor = await adminActor();
  await markAppTransferred(appId, actor);
  revalidatePath("/admin");
}

export async function actEndSubscription(appId: string) {
  const actor = await adminActor();
  await endSubscription(appId, actor);
  revalidatePath("/admin");
}

// Admin: obunani qo'lda 9 oyga uzaytirish (to'lovsiz).
// from="end" — tugagan kundan, from="today" — bugundan.
export async function actRenewSubscription(appId: string, from: "end" | "today" = "end") {
  const actor = await adminActor();
  await renewSubscription(appId, { from, actor });
  revalidatePath("/admin");
}

export async function actSetReviewApproved(reviewId: string, approved: boolean) {
  await requireAdmin();
  await setReviewApproved(reviewId, approved);
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function actDeleteReview(reviewId: string) {
  await requireAdmin();
  await deleteReview(reviewId);
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function actSetUserRole(uid: string, makeAdmin: boolean) {
  await requireAdmin();
  await setUserRole(uid, makeAdmin);
  revalidatePath("/admin");
}

export async function actSetUserPassword(uid: string, password: string) {
  await requireAdmin();
  if (!password || password.length < 6) {
    return { ok: false, error: "Parol kamida 6 belgi bo'lishi kerak" };
  }
  try {
    await setUserPassword(uid, password);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Xatolik" };
  }
}

export async function actSetUserEmail(uid: string, email: string) {
  await requireAdmin();
  const e = (email || "").trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) {
    return { ok: false, error: "Email format noto'g'ri" };
  }
  try {
    await setUserEmail(uid, e);
    revalidatePath("/admin");
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Xatolik";
    return { ok: false, error: msg.includes("already") ? "Bu email band" : msg };
  }
}

export async function actSetUserProfile(
  uid: string,
  data: { fullName: string; phone: string; telegram: string }
) {
  await requireAdmin();
  if (!data.fullName || data.fullName.trim().length < 2) {
    return { ok: false, error: "To'liq ismni kiriting" };
  }
  try {
    await setUserProfile(uid, data);
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Xatolik" };
  }
}

export async function actCreateDiscount(input: {
  ownerUid: string;
  ownerEmail: string | null;
  ownerName: string | null;
  service: DiscountService;
  percent: number;
  daysValid: number;
}) {
  await requireAdmin();
  if (!input.ownerUid) return { ok: false, error: "Foydalanuvchi tanlanmagan" };
  if (!input.percent || input.percent < 1 || input.percent > 100) return { ok: false, error: "Foiz 1–100 orasida bo'lsin" };
  if (!input.daysValid || input.daysValid < 1) return { ok: false, error: "Amal muddati (kun) noto'g'ri" };
  try {
    await createDiscount(input);
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Xatolik" };
  }
}

export async function actDeleteDiscount(id: string) {
  await requireAdmin();
  await deleteDiscount(id);
  revalidatePath("/admin");
}

export async function actSavePricing(pricing: Pricing) {
  await requireAdmin();
  await setPricing(pricing);
  revalidatePath("/admin");
  revalidatePath("/xizmat-narxlari");
  revalidatePath("/foydalanish-shartlari");
}

export async function actSavePayment(info: PaymentInfo) {
  await requireAdmin();
  await setPaymentInfo(info);
  revalidatePath("/admin");
}

export async function actConfirmPayment(paymentId: string, taxReceiptUrl?: string, actualPaidUzs?: number) {
  const actor = await adminActor();
  await confirmPayment(paymentId, taxReceiptUrl?.trim() || undefined, actor, actualPaidUzs);
  revalidatePath("/admin");
}

export async function actDeleteApp(appId: string) {
  await requireAdmin();
  await deleteApp(appId);
  revalidatePath("/admin");
}

export async function actDeletePayment(paymentId: string) {
  await requireAdmin();
  await deletePayment(paymentId);
  revalidatePath("/admin");
}

export async function actDeleteUser(uid: string) {
  await requireAdmin();
  await deleteUser(uid);
  revalidatePath("/admin");
}

export async function actSetRequestStatus(id: string, status: RequestStatus) {
  const actor = await adminActor();
  await setRequestStatus(id, status, actor);
  revalidatePath("/admin");
}

// So'rovni rad etadi va to'lovlarini teskari qaytaradi (kompensatsiya bilan).
// keptUsd — ushlab qolinadigan summa ($); qolgani mijoz hamyoniga qaytadi.
export async function actRejectRequest(id: string, keptUsd: number = 0, status: "rejected" | "cancelled" = "rejected") {
  const actor = await adminActor();
  const res = await voidRequestPayments(id, keptUsd, actor);
  await setRequestStatus(id, status, actor);
  await adminDb.collection("requests").doc(id).update({
    "payment.installments.full.state": "rejected",
    receiptSent: false,
  });
  revalidatePath("/admin");
  return { ok: true, refundedUzs: res.refundedUzs, keptUsd: res.keptUsd };
}

// So'rovning kutilayotgan to'lovini tasdiqlaydi (soliq cheki URL bilan) va
// so'rovni keyingi bosqichga o'tkazadi. To'lov yozuvi topilmasa — oddiy o'tkazish.
export async function actConfirmRequestPayment(requestId: string, taxReceiptUrl?: string, actualPaidUzs?: number) {
  const actor = await adminActor();
  const paymentId = await getPendingPaymentIdByRequest(requestId);
  if (paymentId) {
    await confirmPayment(paymentId, taxReceiptUrl?.trim() || undefined, actor, actualPaidUzs);
  } else {
    await setRequestStatus(requestId, "in_progress", actor);
  }
  revalidatePath("/admin");
}

export async function actSetRequestNote(id: string, note: string) {
  await requireAdmin();
  await setRequestNote(id, note);
  revalidatePath("/admin");
}

export async function actDeleteRequest(id: string) {
  await requireAdmin();
  await deleteRequest(id);
  revalidatePath("/admin");
}

export async function actSetPaymentNote(paymentId: string, note: string) {
  await requireAdmin();
  await setPaymentNote(paymentId, note);
  revalidatePath("/admin");
}

// Admin: ariza ustiga qo'shimcha (custom) hisob-faktura biriktiradi — nom + narx ($).
export async function actCreateCustomInvoice(input: {
  appId: string;
  ownerUid: string;
  ownerName: string;
  ownerPhone: string;
  title: string;
  amountUsd: number;
}) {
  const actor = await adminActor();
  const title = input.title.trim();
  if (!title) return { ok: false, error: "Nomni kiriting" };
  if (!input.amountUsd || input.amountUsd <= 0) return { ok: false, error: "Narxni to'g'ri kiriting" };
  try {
    const rate = await getUsdRate();
    const amountUzs = rate ? Math.round(input.amountUsd * rate) : null;
    await createCustomInvoice({
      appId: input.appId,
      ownerUid: input.ownerUid,
      ownerName: input.ownerName,
      ownerPhone: input.ownerPhone,
      title,
      amountUsd: input.amountUsd,
      rate,
      amountUzs,
      actor,
    });
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Xatolik" };
  }
}

// Admin: to'lanmagan (custom) hisob-faktura bo'yicha foydalanuvchiga Telegramга qarz eslatmasi yuboradi.
// Ilova store'ga chiqarilgan bo'lsa — qo'shimcha ogohlantirish (store'dan olib tashlanishi mumkinligi) qo'shiladi.
// Umumiy: har qanday to'lanmagan to'lov (avans/yakuniy/so'rov/custom) uchun eslatma.
export async function actSendPaymentReminder(input: {
  appId: string;
  requestId?: string;
  title: string;
  amountUsd: number;
}): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  let ownerUid = "";
  if (input.requestId) {
    const rs = await adminDb.collection("requests").doc(input.requestId).get();
    ownerUid = (rs.get("ownerUid") as string) || "";
  } else if (input.appId) {
    const as = await adminDb.collection("apps").doc(input.appId).get();
    ownerUid = (as.get("ownerUid") as string) || "";
  }
  if (!ownerUid) return { ok: false, error: "Foydalanuvchi topilmadi" };

  const tg = await getUserTelegram(ownerUid);
  if (tg.chatIds.length === 0) return { ok: false, error: "Telegramga ulanmagan" };
  if (!tg.notify) return { ok: false, error: "Xabarnoma o'chirilgan" };

  const appSnap = input.appId ? await adminDb.collection("apps").doc(input.appId).get() : null;
  const published = Boolean(appSnap?.get("publication.published"));
  const title = esc(input.title || "To'lov");
  const amount = esc(String(Math.round(input.amountUsd)));
  const warning = published ? `⚠️ Vaqtida to'lamasangiz, ilovangiz store'dan olib tashlanishi mumkin\\.\n\n` : "";
  const msg =
    `⏰ Eslatma: to'lanmagan to'lovingiz bor\n\n📌 ${title}\n💵 $${amount}\n\n` +
    warning +
    `Iltimos, to'lovni "To'lov" bo'limida amalga oshiring 🙏`;

  await notifyUser(ownerUid, msg, urlButton("💳 To'lovni ochish", `${SITE_URL}/panel/app/${input.appId}`));
  return { ok: true };
}

export async function actSendCustomInvoiceReminder(requestId: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const snap = await adminDb.collection("requests").doc(requestId).get();
  if (!snap.exists) return { ok: false, error: "Hisob-faktura topilmadi" };
  const r = snap.data()!;
  const ownerUid = r.ownerUid as string;

  const tg = await getUserTelegram(ownerUid);
  if (tg.chatIds.length === 0) return { ok: false, error: "Telegramga ulanmagan" };
  if (!tg.notify) return { ok: false, error: "Xabarnoma o'chirilgan" };

  const appId = r.appId as string;
  const appSnap = appId ? await adminDb.collection("apps").doc(appId).get() : null;
  const published = Boolean(appSnap?.get("publication.published"));

  const title = esc((r.appName as string) || "Qo'shimcha to'lov");
  const amount = esc(String(r.amountUsd ?? 0));
  const warning = published ? `⚠️ Vaqtida to'lamasangiz, ilovangiz store'dan olib tashlanishi mumkin\\.\n\n` : "";
  const msg =
    `⏰ Eslatma: to'lanmagan hisob\\-faktura mavjud\n\n` +
    `📌 ${title}\n💵 $${amount}\n\n` +
    warning +
    `Iltimos, to'lovni "To'lov" bo'limida amalga oshiring 🙏${appLink(appId)}`;

  await notifyUser(ownerUid, msg);
  return { ok: true };
}

// Admin: "hammasini birga to'lash" orqali yuborilgan guruhdagi barcha to'lovlarni bittada tasdiqlaydi.
export async function actConfirmPaymentBatch(batchId: string, taxReceiptUrl?: string, actualPaidUzs?: number) {
  const actor = await adminActor();
  const r = await confirmPaymentBatch(batchId, { taxReceiptUrl: taxReceiptUrl || undefined, actualPaidUzs }, actor);
  revalidatePath("/admin");
  return r;
}

export async function actRejectPaymentBatch(batchId: string) {
  const actor = await adminActor();
  const r = await rejectPaymentBatch(batchId, actor);
  revalidatePath("/admin");
  return r;
}

// Admin: ariza to'lovini (avans/yakuniy) chek talab qilmasdan qo'lda yopadi —
// mijoz boshqa yo'l bilan (naqd va h.k.) to'lagan bo'lsa. Odatdagi createPayment +
// confirmPayment oqimini ishlatadi (izoh bilan) — status/xabarnoma/activity log bir xil ishlaydi.
export async function actMarkInstallmentPaidManually(appId: string, kind: "advance" | "final") {
  const actor = await adminActor();
  const snap = await adminDb.collection("apps").doc(appId).get();
  if (!snap.exists) return { ok: false, error: "Ariza topilmadi" };
  const app = snap.data()!;
  const installment = app.payment?.installments?.[kind];
  if (installment && installment.state === "confirmed") {
    return { ok: false, error: "Bu qism allaqachon to'langan" };
  }

  const serviceType = app.serviceType as ServiceType;
  const pricedApp = { serviceType, servicePrice: typeof app.servicePrice === "number" ? app.servicePrice : null };
  const pricing = await getPricing();
  const category = categoryForServiceType(serviceType);
  const discount = category ? await getActiveDiscount(app.ownerUid, category, appId) : null;
  const pct = discount?.percent ?? 0;
  const baseAmount = kind === "final" ? finalUsdApp(pricedApp, pricing) : advanceUsdApp(pricedApp, pricing);
  const usd = Math.round(applyDiscount(baseAmount, pct));
  const totalUsd = Math.round(applyDiscount(serviceBaseUsd(pricedApp, pricing), pct));
  const appName = (app.appName as string | null) || SERVICE_SHORT[serviceType];

  try {
    const id = await createPayment({
      appId,
      ownerUid: app.ownerUid,
      ownerName: app.contact?.fullName || "Mijoz",
      ownerPhone: app.contact?.phone || "-",
      serviceType,
      appName,
      kind,
      amountUsd: usd,
      rate: null,
      amountUzs: null,
      totalUsd,
      advancePercent: advancePercentForApp(pricedApp, pricing),
      discountId: discount?.id ?? null,
      discountPercent: pct,
    });
    await setPaymentNote(id, `Qo'lda yopildi (chek yo'q) — admin: ${actor.name}`);
    await confirmPayment(id, undefined, actor);
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Xatolik" };
  }
}
