import type { AppView } from "@/lib/firestore/apps";
import { getStatusFlow, isTerminalError, isTerminalSuccess } from "@/lib/app-status";
import { SERVICE_LABELS, STATUS_META, formatDate } from "@/lib/labels";
import { ReviewButton } from "@/components/panel/ReviewButton";
import { PaymentView } from "@/components/panel/PaymentView";
import { SERVICE_THEME, ServiceLogo } from "@/components/serviceTheme";
import { advanceUsd } from "@/lib/payment";
import type { Pricing, PaymentInfo } from "@/lib/firestore/settings";

function StatusProgress({ app }: { app: AppView }) {
  if (isTerminalError(app.status)) {
    const meta = STATUS_META[app.status];
    return (
      <div className="flex items-center gap-2 rounded-lg bg-red-50 ring-1 ring-red-100 px-2.5 py-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
        <span className="text-xs font-medium text-red-600">
          {app.status === "rejected" ? "Ariza rad etildi" : "Ariza bekor qilindi"}
        </span>
      </div>
    );
  }

  const flow = getStatusFlow(app.serviceType);
  const currentIndex = flow.indexOf(app.status);
  const meta = STATUS_META[app.status];

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-medium text-slate-500">
          Bosqich {Math.max(currentIndex + 1, 1)}/{flow.length}
        </span>
        <span className={`text-[11px] font-semibold ${meta.text}`}>
          {meta.label}
        </span>
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
function SubscriptionProgress({ sub }: { sub: SubData }) {
  const start = sub.startDate ? new Date(sub.startDate).getTime() : 0;
  const end = sub.endDate ? new Date(sub.endDate).getTime() : 0;
  const now = Date.now();

  const total = Math.max(end - start, 1);
  const remainingMs = end - now;
  const dLeft = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
  const expired = remainingMs <= 0;
  // qolgan foiz
  const pctLeft = Math.max(0, Math.min(100, Math.round((remainingMs / total) * 100)));
  const low = !expired && dLeft <= 30;

  const barColor = expired ? "bg-red-500" : low ? "bg-amber-500" : "bg-emerald-500";
  const textColor = expired ? "text-red-600" : low ? "text-amber-600" : "text-emerald-600";

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
          <ClockIcon />
          Obuna muddati
        </span>
        <span className={`text-[11px] font-semibold ${textColor}`}>
          {expired ? "Muddati tugagan" : `${pctLeft}% · ${dLeft} kun qoldi`}
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
        {sub.renewedCount > 0 ? ` · ${sub.renewedCount}× uzaytirilgan` : ""}
      </p>
    </div>
  );
}

function ClockIcon() {
  return (
    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export function AppCard({
  app,
  pricing,
  usdRate,
  paymentInfo,
}: {
  app: AppView;
  pricing?: Pricing;
  usdRate?: number | null;
  paymentInfo?: PaymentInfo;
}) {
  const theme = SERVICE_THEME[app.serviceType];
  const status = STATUS_META[app.status];
  const title = app.appName || SERVICE_LABELS[app.serviceType];
  const subStarted = Boolean(app.subscription?.startDate);
  const canReview = isTerminalSuccess(app.status);

  const showPayment = app.status === "payment_pending" && !!pricing;
  const usd = pricing ? Math.round(advanceUsd(app.serviceType, pricing)) : 0;
  const rate = usdRate ?? null;
  const uzs = rate ? Math.round(usd * rate) : null;

  return (
    <div className="group relative overflow-hidden bg-white rounded-2xl border border-slate-200/80 shadow-sm shadow-slate-200/40 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/60 hover:-translate-y-0.5 animate-slide-up">
      {/* Rangli chap aksent */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${theme.accent}`} />

      <div className="p-4 pl-5 flex gap-4">
        <ServiceLogo serviceType={app.serviceType} iconUrl={app.iconUrl} appName={app.appName} />

        <div className="flex-1 min-w-0 flex flex-col gap-3">
          {/* Sarlavha + status */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 truncate">{title}</p>
              <p className={`text-xs font-medium truncate ${theme.text}`}>
                {SERVICE_LABELS[app.serviceType]}
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 flex-shrink-0 ${status.badge}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
          </div>

          {/* Chiqarilgandan keyin (obuna boshlangan) — bosqich bari o'rnida obuna foizi */}
          {subStarted ? (
            <SubscriptionProgress sub={app.subscription!} />
          ) : (
            <StatusProgress app={app} />
          )}

          {/* Joriy status tushuntirishi — mijoz tushunishi uchun */}
          <p className="flex items-start gap-1.5 text-xs text-slate-500 leading-snug">
            <svg className="w-3.5 h-3.5 flex-shrink-0 mt-px text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{status.desc}</span>
          </p>

          {/* To'lov kutilmoqda — alohida to'lov ko'rinishi */}
          {showPayment && (
            <PaymentView
              appId={app.id}
              usd={usd}
              rate={rate}
              uzs={uzs}
              cardNumber={paymentInfo?.cardNumber ?? ""}
              cardHolder={paymentInfo?.cardHolder ?? ""}
              receiptSent={app.receiptSent}
            />
          )}

          {/* Hali chiqmagan chiqarish xizmatlarida obuna eslatmasi */}
          {!subStarted && app.subscription && !isTerminalError(app.status) && (
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 ring-1 ring-slate-200 px-2.5 py-1.5 text-xs text-slate-500 self-start">
              <ClockIcon />
              Obuna: ilova chiqarilgach boshlanadi (9 oy)
            </div>
          )}

          {/* Footer meta + baholash */}
          <div className="flex items-end justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
              <span>Yuborilgan: {formatDate(app.createdAt)}</span>
              {app.publication.published && (
                <span>· Store&apos;da: {formatDate(app.publication.publishedAt)}</span>
              )}
              {app.publication.storeUrl && (
                <a
                  href={app.publication.storeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`font-medium ${theme.text} hover:underline`}
                >
                  · Store havolasi ↗
                </a>
              )}
            </div>
            {canReview && <ReviewButton appId={app.id} reviewed={app.reviewed} />}
          </div>
        </div>
      </div>
    </div>
  );
}
