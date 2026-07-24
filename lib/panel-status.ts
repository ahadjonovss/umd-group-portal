import type { AppView } from "@/lib/firestore/apps";
import type { RequestView } from "@/lib/firestore/requests";
import type { Pricing } from "@/lib/firestore/settings";
import { isPreWork, isTerminalError, isTerminalSuccess } from "@/lib/app-status";
import { isRequestPreWork, isRequestTerminalError } from "@/lib/request-status";
import { advanceUsdApp, finalUsdApp } from "@/lib/payment";
import { getInstallment, isPayable, fullyPaid, type Installment } from "@/lib/payment-state";

export type AppCategory = "active" | "progress" | "closed";

// Kabinet kartochkalari uchun ilova toifasi.
export function appCategory(app: AppView): AppCategory {
  if (app.status === "transferred" || app.status === "subscription_ended" || isTerminalError(app.status)) {
    return "closed";
  }
  if (isTerminalSuccess(app.status)) return "active";
  return "progress";
}

// Qism ko'rsatiladimi (forma yoki "yuborildi" holati): due / submitted / rejected.
function isShown(i: Installment | null): boolean {
  return !!i && (i.state === "due" || i.state === "submitted" || i.state === "rejected");
}

// AVANS to'lovi ko'rsatiladimi. To'lov obyekti bo'lsa — installment holatiga qarab
// (statusdan mustaqil). Bo'lmasa (eski, migratsiya qilinmagan) — eski mantiqqa qaytadi.
export function appAdvanceStage(app: AppView, pricing?: Pricing): boolean {
  if (!pricing) return false;
  if (Math.round(advanceUsdApp(app, pricing)) <= 0) return false;
  const adv = getInstallment(app.payment, "advance");
  if (adv) return isShown(adv);
  // fallback
  if (isTerminalError(app.status) || isTerminalSuccess(app.status)) return false;
  return !app.receiptSent || isPreWork(app.serviceType, app.status);
}

// YAKUNIY to'lov ko'rsatiladimi. Avans tasdiqlanmaguncha yakuniy ko'rsatilmaydi.
export function showFinalPayment(app: AppView, pricing?: Pricing): boolean {
  if (!pricing) return false;
  if (Math.round(finalUsdApp(app, pricing)) <= 0) return false;
  const adv = getInstallment(app.payment, "advance");
  if (adv && adv.state !== "confirmed") return false; // avval avans tasdiqlanishi kerak
  const fin = getInstallment(app.payment, "final");
  if (fin) return isShown(fin);
  // fallback
  const finalStage = app.serviceType === "account" ? "completed" : "published";
  return app.status === finalStage && !app.finalPaid;
}

// So'rov to'lovi ko'rsatiladimi.
export function requestAwaitingPayment(req?: RequestView | null): boolean {
  if (!req) return false;
  const full = getInstallment(req.payment, "full");
  if (full) return isShown(full);
  // fallback
  const active = !isRequestTerminalError(req.status) && req.status !== "completed";
  if (!active) return false;
  return !req.receiptSent || isRequestPreWork(req.status);
}

// Ilovaning asosiy to'lovi (avans + yakuniy) to'liq yakunlanganmi.
export function appPaymentDone(app: AppView, pricing?: Pricing): boolean {
  if (!pricing) return false;
  if (Math.round(finalUsdApp(app, pricing)) === 0 && Math.round(advanceUsdApp(app, pricing)) === 0) return true;
  if (app.payment) return fullyPaid(app.payment) || Math.round(finalUsdApp(app, pricing)) === 0;
  return Boolean(app.finalPaid) || Math.round(finalUsdApp(app, pricing)) === 0; // fallback
}

// "Amal kerak" — hozir to'lash mumkin bo'lgan (due/rejected) qism bormi.
export function appNeedsPayment(
  app: AppView,
  pricing?: Pricing,
  transferReq?: RequestView | null,
  updateReq?: RequestView | null,
  renewalReq?: RequestView | null,
  pushReq?: RequestView | null
): boolean {
  const adv = getInstallment(app.payment, "advance");
  const fin = getInstallment(app.payment, "final");
  const advanceAmt = pricing ? Math.round(advanceUsdApp(app, pricing)) : 0;
  const finalAmt = pricing ? Math.round(finalUsdApp(app, pricing)) : 0;

  const needsAdvance = adv
    ? isPayable(adv) && advanceAmt > 0
    : appAdvanceStage(app, pricing) && !app.receiptSent;
  const needsFinal = fin
    ? isPayable(fin) && finalAmt > 0
    : (() => {
        const finalStage = app.serviceType === "account" ? "completed" : "published";
        return app.status === finalStage && !app.finalPaid && finalAmt > 0 && !app.finalReceiptSent;
      })();

  const reqNeeds = (req?: RequestView | null): boolean => {
    if (!req) return false;
    const full = getInstallment(req.payment, "full");
    if (full) return isPayable(full);
    return requestAwaitingPayment(req) && !req.receiptSent; // fallback
  };
  const needsRequestPay = reqNeeds(transferReq) || reqNeeds(updateReq) || reqNeeds(renewalReq) || reqNeeds(pushReq);

  return Boolean(needsAdvance || needsFinal || needsRequestPay);
}
