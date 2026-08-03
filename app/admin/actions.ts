"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/dal";
import type { Actor } from "@/lib/firestore/activity";
import { setAppStatus, markPublished, markAppTransferred, endSubscription, renewSubscription, deleteApp } from "@/lib/firestore/apps";
import { setReviewApproved, deleteReview } from "@/lib/firestore/reviews";
import { setUserRole, setUserPassword, setUserEmail, setUserProfile, deleteUser, getUserTelegram } from "@/lib/firestore/users";
import { adminDb } from "@/lib/firebase/admin";
import { notifyUser, esc } from "@/lib/notify";
import { SERVICE_SHORT } from "@/lib/labels";
import { SITE_URL } from "@/lib/site";
import type { ServiceType } from "@/types";
import { confirmPayment, setPaymentNote, deletePayment, getPendingPaymentIdByRequest } from "@/lib/firestore/payments";
import { setRequestStatus, setRequestNote, deleteRequest } from "@/lib/firestore/requests";
import type { RequestStatus } from "@/lib/request-status";
import { setPricing, setPaymentInfo, type Pricing, type PaymentInfo } from "@/lib/firestore/settings";
import { createDiscount, deleteDiscount } from "@/lib/firestore/discounts";
import type { DiscountService } from "@/lib/discount";
import type { AppStatus } from "@/lib/app-status";

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
  const msg =
    `Assalomu alaykum, salomatmisiz? Sizning ${appName} ilovangizning UMD GROUP bilan shartnoma muddati ${date} da o'z yakuniga yetgan\\.\n\n` +
    `Foydalanish shartlarimizga ko'ra obunani yangilashingiz kerak\\. Aks holatda ilova ogohlantirishsiz storelardan olib tashlanadi\\.\n\n` +
    `Quyidagi havola orqali to'lovni amalga oshiring:\n[Kabinetda ochish](${url})`;

  await notifyUser(ownerUid, msg);
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
