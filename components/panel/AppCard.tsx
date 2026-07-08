import Link from "next/link";
import type { AppView } from "@/lib/firestore/apps";
import type { RequestView } from "@/lib/firestore/requests";
import { isTerminalError } from "@/lib/app-status";
import { isRequestActive } from "@/lib/request-status";
import { SERVICE_LABELS, STATUS_META, formatDate } from "@/lib/labels";
import { SERVICE_THEME, ServiceLogo } from "@/components/serviceTheme";
import { StatusProgress, SubscriptionProgress, ClockIcon } from "@/components/panel/AppSections";
import { finalUsdApp } from "@/lib/payment";
import type { Pricing } from "@/lib/firestore/settings";

// Kartochkada ko'rsatiladigan "amal talab qilinadi" belgisi.
function ActionHint({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 self-start rounded-lg bg-amber-50 ring-1 ring-amber-200 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
      {label}
    </span>
  );
}

export function AppCard({
  app,
  pricing,
  transferRequest,
  updateRequest,
  renewalRequest,
}: {
  app: AppView;
  pricing?: Pricing;
  transferRequest?: RequestView | null;
  updateRequest?: RequestView | null;
  renewalRequest?: RequestView | null;
}) {
  const theme = SERVICE_THEME[app.serviceType];
  const status = STATUS_META[app.status];
  const title = app.appName || SERVICE_LABELS[app.serviceType];
  const subStarted = Boolean(app.subscription?.startDate);
  const transferred = app.status === "transferred";

  // Amal talab qiladigan holatlar (kartochkada ogohlantirish uchun)
  // Akkaunt xizmatida "chiqarildi" o'rniga "yakunlandi" bosqichida qolgan to'lov.
  const finalStage = app.serviceType === "account" ? "completed" : "published";
  const finalAmount = pricing ? Math.round(finalUsdApp(app, pricing)) : 0;
  const needsAdvance = app.status === "payment_pending" && !app.receiptSent;
  const needsFinal = app.status === finalStage && !app.finalPaid && finalAmount > 0 && !app.finalReceiptSent;
  const needsRequestPay =
    (transferRequest?.status === "payment_pending" && !transferRequest.receiptSent) ||
    (updateRequest?.status === "payment_pending" && !updateRequest.receiptSent) ||
    (renewalRequest?.status === "payment_pending" && !renewalRequest.receiptSent);
  const actionLabel = needsAdvance || needsFinal || needsRequestPay ? "To'lov kutilmoqda" : null;

  return (
    <Link
      href={`/panel/app/${app.id}`}
      className="group relative block overflow-hidden bg-white rounded-2xl border border-slate-200/80 shadow-sm shadow-slate-200/40 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/60 hover:-translate-y-0.5 animate-slide-up"
    >
      {/* Rangli chap aksent */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${theme.accent}`} />

      <div className="p-4 pl-5 flex gap-4">
        <ServiceLogo serviceType={app.serviceType} iconUrl={app.iconUrl} appName={app.appName} />

        <div className="flex-1 min-w-0 flex flex-col gap-3">
          {/* Sarlavha + status */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 truncate group-hover:text-blue-700 transition-colors">{title}</p>
              <p className={`text-xs font-medium truncate ${theme.text}`}>{SERVICE_LABELS[app.serviceType]}</p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ${status.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                {status.label}
              </span>
              <svg className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {transferred ? (
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 ring-1 ring-violet-200 px-2.5 py-1.5 text-xs font-medium text-violet-700 self-start">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {formatDate(app.transferredAt)} da transfer qilingan
            </div>
          ) : (
            <>
              {subStarted ? <SubscriptionProgress sub={app.subscription!} /> : <StatusProgress app={app} />}

              {actionLabel && <ActionHint label={actionLabel} />}

              {!subStarted && app.subscription && !isTerminalError(app.status) && (
                <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 ring-1 ring-slate-200 px-2.5 py-1.5 text-xs text-slate-500 self-start">
                  <ClockIcon />
                  Obuna: ilova chiqarilgach boshlanadi (9 oy)
                </div>
              )}
            </>
          )}

          {/* Footer meta */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 pt-2 border-t border-slate-100">
            <span>Yuborilgan: {formatDate(app.createdAt)}</span>
            {app.publication.published && <span>· Store&apos;da: {formatDate(app.publication.publishedAt)}</span>}
            <span className="ml-auto font-medium text-blue-600 group-hover:underline">Batafsil →</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
