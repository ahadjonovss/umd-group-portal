"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/dal";
import { setAppStatus, markPublished, deleteApp } from "@/lib/firestore/apps";
import { setReviewApproved, deleteReview } from "@/lib/firestore/reviews";
import { setUserRole, setUserPassword, setUserEmail, deleteUser } from "@/lib/firestore/users";
import { confirmPayment, setPaymentNote, deletePayment } from "@/lib/firestore/payments";
import { setRequestStatus, setRequestNote, deleteRequest } from "@/lib/firestore/requests";
import type { RequestStatus } from "@/lib/request-status";
import { setPricing, setPaymentInfo, type Pricing, type PaymentInfo } from "@/lib/firestore/settings";
import type { AppStatus } from "@/lib/app-status";

export async function actSetStatus(appId: string, status: AppStatus) {
  await requireAdmin();
  await setAppStatus(appId, status);
  revalidatePath("/admin");
}

export async function actPublish(appId: string, publishedAt: string, storeUrl: string) {
  await requireAdmin();
  const date = publishedAt ? new Date(publishedAt) : new Date();
  await markPublished(appId, date, storeUrl.trim() || undefined);
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

export async function actConfirmPayment(paymentId: string) {
  await requireAdmin();
  await confirmPayment(paymentId);
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
  await requireAdmin();
  await setRequestStatus(id, status);
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
