import type { AppView } from "@/lib/firestore/apps";
import type { RequestView } from "@/lib/firestore/requests";
import type { Pricing } from "@/lib/firestore/settings";
import { isPreWork, isTerminalError, isTerminalSuccess } from "@/lib/app-status";
import { isRequestPreWork, isRequestTerminalError } from "@/lib/request-status";
import { advanceUsdApp, finalUsdApp } from "@/lib/payment";

export type AppCategory = "active" | "progress" | "closed";

// Kabinet kartochkalari uchun ilova toifasi.
export function appCategory(app: AppView): AppCategory {
  if (app.status === "transferred" || app.status === "subscription_ended" || isTerminalError(app.status)) {
    return "closed";
  }
  if (isTerminalSuccess(app.status)) return "active";
  return "progress";
}

// Avans to'lovi ko'rsatiladimi. Avans > 0 va ilova hali yakunlanmagan/rad etilmagan
// bo'lsa: to'lov TO'LANMAGUNCHA (chek yuborilmaguncha) har qanday bosqichda ko'rsatiladi —
// admin holatni "tayyorlanmoqda"ga o'tkazsa ham yo'qolmaydi. Chek yuborilgach faqat
// ish-oldi bosqichda (tasdiq kutilmoqda holati) ko'rsatiladi. PaymentView holatni o'zi boshqaradi.
export function appAdvanceStage(app: AppView, pricing?: Pricing): boolean {
  if (!pricing) return false;
  if (Math.round(advanceUsdApp(app, pricing)) <= 0) return false;
  if (isTerminalError(app.status) || isTerminalSuccess(app.status)) return false;
  return !app.receiptSent || isPreWork(app.serviceType, app.status);
}

// So'rov to'lovi ko'rsatiladimi. Faol so'rovda: to'lanmaguncha (chek yuborilmaguncha)
// har qanday bosqichda; chek yuborilgach faqat ish-oldi bosqichda (tasdiq kutilmoqda).
export function requestAwaitingPayment(req?: RequestView | null): boolean {
  if (!req) return false;
  const active = !isRequestTerminalError(req.status) && req.status !== "completed";
  if (!active) return false;
  return !req.receiptSent || isRequestPreWork(req.status);
}

// Ilova to'lov (avans / yakuniy / so'rov) kutyaptimi (amal kerak belgisi uchun).
export function appNeedsPayment(
  app: AppView,
  pricing?: Pricing,
  transferReq?: RequestView | null,
  updateReq?: RequestView | null,
  renewalReq?: RequestView | null
): boolean {
  const finalStage = app.serviceType === "account" ? "completed" : "published";
  const finalAmount = pricing ? Math.round(finalUsdApp(app, pricing)) : 0;
  const needsAdvance = appAdvanceStage(app, pricing) && !app.receiptSent;
  const needsFinal = app.status === finalStage && !app.finalPaid && finalAmount > 0 && !app.finalReceiptSent;
  const needsRequestPay =
    (requestAwaitingPayment(transferReq) && !transferReq!.receiptSent) ||
    (requestAwaitingPayment(updateReq) && !updateReq!.receiptSent) ||
    (requestAwaitingPayment(renewalReq) && !renewalReq!.receiptSent);
  return Boolean(needsAdvance || needsFinal || needsRequestPay);
}
