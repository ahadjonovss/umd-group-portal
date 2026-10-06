"use client";

import Link from "next/link";
import type { AppView } from "@/lib/firestore/apps";
import type { RequestView } from "@/lib/firestore/requests";
import { statusFlowFor, isTerminalError, isTerminalSuccess } from "@/lib/app-status";
import { isRequestTerminalError, REQUEST_STATUS_META, requestFlow } from "@/lib/request-status";
import { STATUS_META, formatDate, platformOf, statusMetaFor } from "@/lib/labels";
import { daysUntil, periodLabel, RECURRING_STATUS_BADGE } from "@/lib/billing";
import { PaymentView } from "@/components/panel/PaymentView";
import { PrepayButton } from "@/components/panel/PrepayButton";
import { requestAwaitingPayment } from "@/lib/panel-status";
import { pkgActive, pkgDaysLeft, getInstallment, isPayable, type PayState } from "@/lib/payment-state";
import { useT } from "@/components/i18n/LanguageProvider";
import { Rich } from "@/components/i18n/Rich";
import { requestStatusLabelOf } from "@/lib/i18n/format";
import { TELEGRAM_MANAGER_AT } from "@/lib/site";

export function ClockIcon() {
  return (
    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export function RenewalSection({
  app,
  req,
  cardNumber,
  cardHolder,
  paymentDone,
  walletUzs = 0,
}: {
  app: AppView;
  req: RequestView | null;
  cardNumber: string;
  cardHolder: string;
  paymentDone: boolean;
  walletUzs?: number;
}) {
  const t = useT();
  // Chiqarilgan (yoki obunasi tugab, store'dan olib tashlangan) + obunasi boshlangan + qolgan to'lovi yakunlangan ilovada
  if ((app.status !== "published" && app.status !== "subscription_ended") || !app.subscription?.startDate || !paymentDone) return null;

  const active = req ? !isRequestTerminalError(req.status) && req.status !== "completed" : false;

  // Faol so'rov yo'q — (qayta) uzaytirish mumkin
  if (!req || (!active && !requestAwaitingPayment(req))) {
    return (
      <Link
        href={`/panel/request/renewal/${app.id}`}
        className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 active:scale-[0.99] transition-all"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        {t.sections.renewalCta}
      </Link>
    );
  }

  const meta = REQUEST_STATUS_META[req.status];
  const flow = requestFlow(req.type);
  const idx = flow.indexOf(req.status);
  return (
    <div className="rounded-xl bg-slate-50 ring-1 ring-slate-100 p-3.5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">{t.sections.renewalTitle}</span>
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 ${meta.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
          {requestStatusLabelOf(t, req.type, req.status)}
        </span>
      </div>
      {idx >= 0 && (
        <div className="flex gap-1">
          {flow.map((s, i) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= idx ? meta.dot : "bg-slate-200"}`} />
          ))}
        </div>
      )}
      {requestAwaitingPayment(req) && (
        <PaymentView
          endpoint="/api/requests/receipt"
          idPayload={{ requestId: req.id }}
          usd={req.amountUsd}
          rate={req.rate}
          uzs={req.amountUzs}
          cardNumber={cardNumber}
          cardHolder={cardHolder}
          walletUzs={walletUzs}
          amountLabel={t.panel.requestPayLabel(t.requestType[req.type])}
          receiptSent={req.receiptSent}
          askTaxPhone
        />
      )}
      {req.status === "in_progress" && req.receiptSent && (
        <p className="text-xs text-slate-500 leading-snug">{t.sections.renewalDone}</p>
      )}
    </div>
  );
}

// Apple push notification sertifikati — faqat Apple (iOS) ilovalarda.
export function PushCertSection({
  app,
  req,
  cardNumber,
  cardHolder,
  paymentDone,
  walletUzs = 0,
}: {
  app: AppView;
  req: RequestView | null;
  cardNumber: string;
  cardHolder: string;
  paymentDone: boolean;
  walletUzs?: number;
}) {
  const t = useT();
  if (platformOf(app.serviceType) !== "ios" || !isTerminalSuccess(app.status) || !paymentDone) return null;

  const active = req ? !isRequestTerminalError(req.status) && req.status !== "completed" : false;

  if (!req || (!active && !requestAwaitingPayment(req))) {
    return (
      <Link
        href={`/panel/request/push-certificate/${app.id}`}
        className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 active:scale-[0.99] transition-all"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {t.sections.pushCta}
      </Link>
    );
  }

  const meta = REQUEST_STATUS_META[req.status];
  const flow = requestFlow(req.type);
  const idx = flow.indexOf(req.status);
  return (
    <div className="rounded-xl bg-slate-50 ring-1 ring-slate-100 p-3.5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">{t.sections.pushTitle}</span>
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 ${meta.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
          {requestStatusLabelOf(t, req.type, req.status)}
        </span>
      </div>
      {idx >= 0 && (
        <div className="flex gap-1">
          {flow.map((s, i) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= idx ? meta.dot : "bg-slate-200"}`} />
          ))}
        </div>
      )}
      {requestAwaitingPayment(req) && (
        <PaymentView
          endpoint="/api/requests/receipt"
          idPayload={{ requestId: req.id }}
          usd={req.amountUsd}
          rate={req.rate}
          uzs={req.amountUzs}
          cardNumber={cardNumber}
          cardHolder={cardHolder}
          walletUzs={walletUzs}
          amountLabel={t.panel.requestPayLabel(t.requestType[req.type])}
          receiptSent={req.receiptSent}
          askTaxPhone
        />
      )}
      {req.status === "in_progress" && req.receiptSent && (
        <p className="text-xs text-slate-500 leading-snug">{t.sections.pushDone}</p>
      )}
    </div>
  );
}

export function StatusProgress({ app }: { app: AppView }) {
  const t = useT();
  if (isTerminalError(app.status)) {
    const meta = STATUS_META[app.status];
    return (
      <div className="flex items-center gap-2 rounded-lg bg-red-50 ring-1 ring-red-100 px-2.5 py-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
        <span className="text-xs font-medium text-red-600">
          {app.status === "rejected" ? t.sections.rejectedApp : t.sections.cancelledApp}
        </span>
      </div>
    );
  }

  const flow = statusFlowFor(app);
  const currentIndex = flow.indexOf(app.status);
  const meta = statusMetaFor(app, app.status);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-medium text-slate-500">
          {t.sections.stage(Math.max(currentIndex + 1, 1), flow.length)}
        </span>
        <span className={`text-[11px] font-semibold ${meta.text}`}>{t.status[app.status].label}</span>
      </div>
      <div className="flex gap-1">
        {flow.map((s, i) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= currentIndex ? meta.dot : "bg-slate-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

type SubData = NonNullable<AppView["subscription"]>;

// Ilova chiqarilgandan keyin: bosqich bari o'rnida obuna muddati foizda.
export function SubscriptionProgress({ sub }: { sub: SubData }) {
  const t = useT();
  const start = sub.startDate ? new Date(sub.startDate).getTime() : 0;
  const end = sub.endDate ? new Date(sub.endDate).getTime() : 0;
  const now = Date.now();

  const total = Math.max(end - start, 1);
  const remainingMs = end - now;
  const dLeft = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
  const expired = remainingMs <= 0;
  const pctLeft = Math.max(0, Math.min(100, Math.round((remainingMs / total) * 100)));
  const low = !expired && dLeft <= 30;

  const barColor = expired ? "bg-red-500" : low ? "bg-amber-500" : "bg-emerald-500";
  const textColor = expired ? "text-red-600" : low ? "text-amber-600" : "text-emerald-600";

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
          <ClockIcon />
          {t.sections.subPeriod}
        </span>
        <span className={`text-[11px] font-semibold ${textColor}`}>
          {expired ? t.sections.subExpired : t.sections.subLeft(pctLeft, dLeft)}
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-500`}
          style={{ width: `${expired ? 100 : pctLeft}%` }}
        />
      </div>
      <p className="text-[11px] text-slate-400 mt-1">
        {formatDate(sub.startDate)} → {formatDate(sub.endDate)}
        {sub.renewedCount > 0 ? t.sections.subRenewed(sub.renewedCount) : ""}
      </p>
    </div>
  );
}

export function TransferSection({
  app,
  req,
  cardNumber,
  cardHolder,
  paymentDone,
  walletUzs = 0,
}: {
  app: AppView;
  req: RequestView | null;
  cardNumber: string;
  cardHolder: string;
  paymentDone: boolean;
  walletUzs?: number;
}) {
  const t = useT();
  if (app.status !== "published") return null;
  // Qolgan to'lov yakunlanmaguncha transfer so'rovi ochilmaydi
  // (faol/yakunlangan so'rov bo'lsa holatini ko'rsatishda davom etamiz).
  if (!paymentDone && (!req || isRequestTerminalError(req.status))) return null;

  // Transfer yakunlangan — jarayon tugadi
  if (req && req.status === "completed") {
    return (
      <div className="inline-flex items-center gap-1.5 self-start rounded-lg bg-emerald-50 ring-1 ring-emerald-200 px-2.5 py-1.5 text-xs font-medium text-emerald-700">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
        {t.sections.transferDone}
      </div>
    );
  }

  // So'rov yo'q yoki rad etilgan/bekor qilingan — (qayta) so'rov qilish mumkin
  if (!req || isRequestTerminalError(req.status)) {
    return (
      <Link
        href={`/panel/request/transfer/${app.id}`}
        className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 active:scale-[0.99] transition-all"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        {t.sections.transferCta}
      </Link>
    );
  }

  const meta = REQUEST_STATUS_META[req.status];
  const flow = requestFlow(req.type);
  const idx = flow.indexOf(req.status);
  return (
    <div className="rounded-xl bg-slate-50 ring-1 ring-slate-100 p-3.5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">{t.sections.transferTitle}</span>
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 ${meta.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
          {requestStatusLabelOf(t, req.type, req.status)}
        </span>
      </div>
      {idx >= 0 && (
        <div className="flex gap-1">
          {flow.map((s, i) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= idx ? meta.dot : "bg-slate-200"}`} />
          ))}
        </div>
      )}
      {requestAwaitingPayment(req) && (
        <PaymentView
          endpoint="/api/requests/receipt"
          idPayload={{ requestId: req.id }}
          usd={req.amountUsd}
          rate={req.rate}
          uzs={req.amountUzs}
          cardNumber={cardNumber}
          cardHolder={cardHolder}
          walletUzs={walletUzs}
          amountLabel={t.panel.requestPayLabel(t.requestType[req.type])}
          receiptSent={req.receiptSent}
          askTaxPhone
        />
      )}
    </div>
  );
}

export function UpdateSection({
  app,
  req,
  cardNumber,
  cardHolder,
  paymentDone,
  walletUzs = 0,
}: {
  app: AppView;
  req: RequestView | null;
  cardNumber: string;
  cardHolder: string;
  paymentDone: boolean;
  walletUzs?: number;
}) {
  const t = useT();
  if (app.status !== "published" || !paymentDone) return null;

  const active = req ? !isRequestTerminalError(req.status) && req.status !== "completed" : false;

  const freeByPackage = pkgActive(app.updatePackage);

  // Faol so'rov yo'q — (qayta) update so'rovi mumkin
  if (!req || (!active && !requestAwaitingPayment(req))) {
    return (
      <Link
        href={`/panel/request/update/${app.id}`}
        className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:scale-[0.99] transition-all"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
        {freeByPackage ? t.sections.updateCtaFree : t.sections.updateCta}
      </Link>
    );
  }

  const meta = REQUEST_STATUS_META[req.status];
  const flow = requestFlow(req.type);
  const idx = flow.indexOf(req.status);
  return (
    <div className="rounded-xl bg-slate-50 ring-1 ring-slate-100 p-3.5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">{t.sections.updateTitle}</span>
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 ${meta.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
          {requestStatusLabelOf(t, req.type, req.status)}
        </span>
      </div>
      {idx >= 0 && (
        <div className="flex gap-1">
          {flow.map((s, i) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= idx ? meta.dot : "bg-slate-200"}`} />
          ))}
        </div>
      )}
      {requestAwaitingPayment(req) && (
        <PaymentView
          endpoint="/api/requests/receipt"
          idPayload={{ requestId: req.id }}
          usd={req.amountUsd}
          rate={req.rate}
          uzs={req.amountUzs}
          cardNumber={cardNumber}
          cardHolder={cardHolder}
          walletUzs={walletUzs}
          amountLabel={t.panel.requestPayLabel(t.requestType[req.type])}
          receiptSent={req.receiptSent}
          askTaxPhone
        />
      )}
      {req.status === "in_progress" && req.receiptSent && (
        <div className="rounded-lg bg-white ring-1 ring-slate-100 p-3 text-xs text-slate-600 leading-snug">
          <Rich text={app.serviceType === "app-store" ? t.sections.updateHintIos : t.sections.updateHintAndroid(TELEGRAM_MANAGER_AT)} />
        </div>
      )}
    </div>
  );
}

// Update paketi — 1 oylik / N ta update. Faol bo'lsa updatelar bepul.
export function UpdatePackageSection({
  app,
  cardNumber,
  cardHolder,
  paymentDone,
  walletUzs = 0,
  priceUsd,
  quota,
  rate,
  purchasePending = false,
}: {
  app: AppView;
  cardNumber: string;
  cardHolder: string;
  paymentDone: boolean;
  walletUzs?: number;
  priceUsd: number;
  quota: number;
  rate: number | null;
  purchasePending?: boolean;
}) {
  const t = useT();
  if (!paymentDone || isTerminalError(app.status)) return null;

  const pkg = app.updatePackage;
  const active = pkgActive(pkg);
  const daysLeft = pkgDaysLeft(pkg);
  const uzs = rate ? Math.round(priceUsd * rate) : null;

  // Faol paket — holat kartasi (updatelar bepul)
  if (active && pkg) {
    const pct = pkg.quota > 0 ? Math.round((pkg.used / pkg.quota) * 100) : 0;
    return (
      <div className="rounded-xl bg-cyan-50 ring-1 ring-cyan-100 p-3.5 flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-800">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {t.sections.pkgActive}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-white text-cyan-700 ring-1 ring-cyan-200">
            <ClockIcon />
            {t.sections.pkgDaysLeft(daysLeft)}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-cyan-700/90">
          <span>{t.sections.pkgUsed}</span>
          <span className="font-semibold">{pkg.used} / {pkg.quota}</span>
        </div>
        <div className="h-1.5 rounded-full bg-cyan-100 overflow-hidden">
          <div className="h-full rounded-full bg-cyan-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-[11px] text-cyan-700/80 leading-snug">{t.sections.pkgNote}</p>
      </div>
    );
  }

  // Paket yo'q yoki tugagan — sotib olish
  const expired = Boolean(pkg && pkg.active); // bor edi, lekin kvota/muddat tugadi
  return (
    <details className="rounded-xl bg-slate-50 ring-1 ring-slate-100 overflow-hidden">
      <summary className="flex items-center justify-between gap-2 p-3.5 cursor-pointer list-none select-none">
        <span className="flex flex-col">
          <span className="text-sm font-semibold text-slate-700">
            {expired ? t.sections.pkgExpiredTitle : t.sections.pkgTitle}
          </span>
          <span className="text-xs text-slate-500">{t.sections.pkgSub(quota)}</span>
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-600 text-white text-xs font-semibold">
          ${priceUsd}
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </summary>
      <div className="px-3.5 pb-3.5 border-t border-slate-100 pt-3 flex flex-col gap-3">
        <p className="text-xs text-slate-500 leading-snug">
          <Rich text={t.sections.pkgBuyNote(quota, app.serviceType === "app-store" ? "$5" : "$3")} />
        </p>
        <PaymentView
          endpoint="/api/payment/receipt"
          idPayload={{ appId: app.id, kind: "update_package" }}
          usd={priceUsd}
          rate={rate}
          uzs={uzs}
          cardNumber={cardNumber}
          cardHolder={cardHolder}
          walletUzs={walletUzs}
          amountLabel={t.sections.pkgPayLabel}
          receiptSent={purchasePending}
          askTaxPhone
        />
      </div>
    </details>
  );
}

const CUSTOM_INVOICE_BADGE: Record<PayState, { cls: string; dot: string }> = {
  due: { cls: "bg-amber-50 text-amber-700 ring-amber-200", dot: "bg-amber-500" },
  rejected: { cls: "bg-red-50 text-red-700 ring-red-200", dot: "bg-red-500" },
  submitted: { cls: "bg-blue-50 text-blue-700 ring-blue-200", dot: "bg-blue-500" },
  confirmed: { cls: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500" },
  locked: { cls: "bg-slate-100 text-slate-500 ring-slate-200", dot: "bg-slate-400" },
};

// Admin biriktirgan qo'shimcha (custom) hisob-fakturalar — mustaqil to'lov sifatida.
export function CustomInvoiceSection({
  reqs,
  cardNumber,
  cardHolder,
  walletUzs = 0,
}: {
  reqs: RequestView[];
  cardNumber: string;
  cardHolder: string;
  walletUzs?: number;
}) {
  const t = useT();
  const items = reqs.filter((r) => r.type === "custom");
  if (!items.length) return null;

  return (
    <div className="flex flex-col gap-3">
      {items.map((req) => {
        const full = getInstallment(req.payment, "full");
        const state: PayState = (full?.state as PayState) ?? "due";
        const badge = CUSTOM_INVOICE_BADGE[state] ?? CUSTOM_INVOICE_BADGE.due;
        const title = req.appName || t.sections.customDefaultTitle;
        const payable = isPayable(full);
        return (
          <div key={req.id} className="rounded-xl bg-slate-50 ring-1 ring-slate-100 p-3.5 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{title}</p>
                <p className="text-xs text-slate-500">
                  ${req.amountUsd}
                  {req.amountUzs ? <span className="text-slate-400"> · ~{req.amountUzs.toLocaleString("en-US")} {t.common.sum}</span> : null}
                </p>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 flex-shrink-0 ${badge.cls}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                {t.panel.invoiceState[state]}
              </span>
            </div>
            {payable && (
              <PaymentView
                endpoint="/api/requests/receipt"
                idPayload={{ requestId: req.id }}
                usd={req.amountUsd}
                rate={req.rate}
                uzs={req.amountUzs}
                cardNumber={cardNumber}
                cardHolder={cardHolder}
                walletUzs={walletUzs}
                amountLabel={title}
                receiptSent={req.receiptSent}
                askTaxPhone
              />
            )}
          </div>
        );
      })}
    </div>
  );
}


// ── Davriy (oylik) to'lov bo'limi ──────────────────────────
// Reja holati + to'lanmagan hisob-fakturalar + to'langanlar tarixi.
// Matni lug'atdan (t.panel.invoiceState) olinadi — bu yerda faqat ranglar.
const RECURRING_BADGE: Record<string, { cls: string; dot: string }> = {
  due: { cls: "bg-amber-50 text-amber-700 ring-amber-200", dot: "bg-amber-500" },
  rejected: { cls: "bg-red-50 text-red-700 ring-red-200", dot: "bg-red-500" },
  submitted: { cls: "bg-blue-50 text-blue-700 ring-blue-200", dot: "bg-blue-500" },
  confirmed: { cls: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500" },
};

export function RecurringSection({
  app,
  reqs,
  cardNumber,
  cardHolder,
  walletUzs = 0,
}: {
  app: AppView;
  reqs: RequestView[];
  cardNumber: string;
  cardHolder: string;
  walletUzs?: number;
}) {
  const t = useT();
  const rec = app.billing?.recurring ?? null;
  const invoices = reqs.filter((r) => r.type === "recurring");
  if (!rec && !invoices.length) return null;

  const open = invoices.filter((r) => !isRequestTerminalError(r.status) && r.status !== "completed");
  const paid = invoices.filter((r) => r.status === "completed");
  const left = rec ? daysUntil(rec.nextChargeAt) : null;
  const overdue = typeof left === "number" && left < 0;
  // Faol obunada to'lanmagan hisob bo'lmasa — keyingi davrni oldindan yopish mumkin
  const canPrepay = Boolean(rec && rec.active && rec.status !== "cancelled" && rec.amountUsd > 0 && open.length === 0);

  return (
    <div className="flex flex-col gap-3">
      {/* Reja holati */}
      {rec && rec.status !== "cancelled" && (
        <div className={`rounded-xl p-3.5 flex flex-col gap-2 ring-1 ${overdue ? "bg-red-50 ring-red-100" : "bg-purple-50 ring-purple-100"}`}>
          <div className="flex items-center justify-between gap-2">
            <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${overdue ? "text-red-800" : "text-purple-800"}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {t.panel.recurringTitle(t.panel.recurringPeriod(rec.periodMonths))}
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 ${RECURRING_STATUS_BADGE[rec.status]}`}>
              {t.panel.recurringStatus[rec.status]}
            </span>
          </div>
          <div className={`flex items-center justify-between text-xs ${overdue ? "text-red-700/90" : "text-purple-700/90"}`}>
            <span className="font-semibold">${rec.amountUsd} / {t.panel.recurringPeriod(rec.periodMonths)}</span>
            {rec.nextChargeAt && (
              <span className="inline-flex items-center gap-1">
                <ClockIcon />
                {rec.status === "pending"
                  ? t.panel.recurringStartsOnDelivery
                  : overdue
                    ? t.panel.recurringOverdue(Math.abs(left as number))
                    : t.panel.recurringNextCharge(formatDate(rec.nextChargeAt))}
              </span>
            )}
          </div>
          {rec.paidCount > 0 && (
            <p className="text-[11px] text-slate-500">{t.panel.recurringPaidPeriods(rec.paidCount)}</p>
          )}
        </div>
      )}

      {/* Oldindan to'lash — to'lanmagan hisob yo'q bo'lsa, keyingi davrni istalgan
          vaqtda yopish mumkin (muddat kelishini kutish shart emas). */}
      {canPrepay && (
        <div className="rounded-xl bg-white ring-1 ring-slate-200 p-3.5 flex flex-col gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-800">{t.panel.prepayTitle}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {t.panel.prepayHint(rec!.nextChargeAt ? formatDate(rec!.nextChargeAt) : "—")}
            </p>
          </div>
          <PrepayButton
            appId={app.id}
            label={t.panel.prepayButton(t.panel.recurringPeriod(rec!.periodMonths), rec!.amountUsd)}
            loadingLabel={t.panel.prepayLoading}
            errorLabel={t.common.error}
          />
        </div>
      )}

      {/* To'lanmagan hisob-fakturalar */}
      {open.map((req) => {
        const full = getInstallment(req.payment, "full");
        const state: PayState = (full?.state as PayState) ?? "due";
        const badge = RECURRING_BADGE[state] ?? RECURRING_BADGE.due;
        const payable = isPayable(full);
        return (
          <div key={req.id} className="rounded-xl bg-slate-50 ring-1 ring-slate-100 p-3.5 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {t.panel.recurringInvoiceNo(req.periodNo)}
                </p>
                <p className="text-xs text-slate-500">
                  ${req.amountUsd}
                  {req.amountUzs ? <span className="text-slate-400"> · ~{req.amountUzs.toLocaleString("en-US")} so&apos;m</span> : null}
                </p>
                {req.periodStart && (
                  <p className="text-[11px] text-slate-400 mt-0.5">{periodLabel(req.periodStart, req.periodEnd)}</p>
                )}
              </div>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 flex-shrink-0 ${badge.cls}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                {t.panel.invoiceState[state] ?? t.panel.invoiceState.due}
              </span>
            </div>
            {payable && (
              <PaymentView
                endpoint="/api/requests/receipt"
                idPayload={{ requestId: req.id }}
                usd={req.amountUsd}
                rate={req.rate}
                uzs={req.amountUzs}
                cardNumber={cardNumber}
                cardHolder={cardHolder}
                walletUzs={walletUzs}
                amountLabel={t.panel.recurringInvoiceNo(req.periodNo)}
                receiptSent={req.receiptSent}
                askTaxPhone
              />
            )}
          </div>
        );
      })}

      {/* To'langanlar tarixi */}
      {paid.length > 0 && (
        <details className="rounded-xl bg-white ring-1 ring-slate-100 p-3">
          <summary className="text-xs font-semibold text-slate-600 cursor-pointer">
            {t.panel.recurringHistory(paid.length)}
          </summary>
          <ul className="mt-2 flex flex-col gap-1.5">
            {paid.map((r) => (
              <li key={r.id} className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  #{r.periodNo || "—"} · {periodLabel(r.periodStart, r.periodEnd)}
                </span>
                <span className="font-medium text-emerald-600">${r.amountUsd} ✓</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
