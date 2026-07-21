import type { AppView } from "@/lib/firestore/apps";
import type { RequestView } from "@/lib/firestore/requests";
import type { Pricing } from "@/lib/firestore/settings";
import { isTerminalError, isTerminalSuccess } from "@/lib/app-status";
import { finalUsdApp } from "@/lib/payment";

export type AppCategory = "active" | "progress" | "closed";

// Kabinet kartochkalari uchun ilova toifasi.
export function appCategory(app: AppView): AppCategory {
  if (app.status === "transferred" || app.status === "subscription_ended" || isTerminalError(app.status)) {
    return "closed";
  }
  if (isTerminalSuccess(app.status)) return "active";
  return "progress";
}

// Ilova to'lov (avans / yakuniy / so'rov) kutyaptimi.
export function appNeedsPayment(
  app: AppView,
  pricing?: Pricing,
  transferReq?: RequestView | null,
  updateReq?: RequestView | null,
  renewalReq?: RequestView | null
): boolean {
  const finalStage = app.serviceType === "account" ? "completed" : "published";
  const finalAmount = pricing ? Math.round(finalUsdApp(app, pricing)) : 0;
  const needsAdvance = app.status === "payment_pending" && !app.receiptSent;
  const needsFinal = app.status === finalStage && !app.finalPaid && finalAmount > 0 && !app.finalReceiptSent;
  const needsRequestPay =
    (transferReq?.status === "payment_pending" && !transferReq.receiptSent) ||
    (updateReq?.status === "payment_pending" && !updateReq.receiptSent) ||
    (renewalReq?.status === "payment_pending" && !renewalReq.receiptSent);
  return Boolean(needsAdvance || needsFinal || needsRequestPay);
}
