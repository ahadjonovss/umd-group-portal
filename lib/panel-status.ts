import type { AppView } from "@/lib/firestore/apps";
import type { RequestView } from "@/lib/firestore/requests";
import type { Pricing } from "@/lib/firestore/settings";
import { isPreWork, isTerminalError, isTerminalSuccess } from "@/lib/app-status";
import { isRequestPreWork } from "@/lib/request-status";
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

// Ilova avans to'lov bosqichida (yaratilgan → to'lov kutilmoqda oralig'ida)
// va avansi > 0 bo'lsa — admin "to'lov kutilmoqda"ga o'tkazishini kutmasdan
// to'lov ko'rsatiladi. receiptSent holatini PaymentView o'zi boshqaradi.
export function appAdvanceStage(app: AppView, pricing?: Pricing): boolean {
  if (!pricing) return false;
  if (Math.round(advanceUsdApp(app, pricing)) <= 0) return false;
  return isPreWork(app.serviceType, app.status);
}

// So'rov (transfer / update / uzaytirish) to'lov-oldi bosqichdami.
export function requestAwaitingPayment(req?: RequestView | null): boolean {
  if (!req) return false;
  return isRequestPreWork(req.status);
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
