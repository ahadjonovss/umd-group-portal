import type { AppView } from "@/lib/firestore/apps";
import { getStatusFlow, isTerminalError } from "@/lib/app-status";
import { SERVICE_LABELS, STATUS_META, formatDate, daysLeft } from "@/lib/labels";

function Logo({ app }: { app: AppView }) {
  if (app.iconUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={app.iconUrl}
        alt={app.appName ?? "Ilova"}
        className="w-12 h-12 rounded-xl object-cover border border-slate-200 flex-shrink-0"
      />
    );
  }
  // Placeholder — ikona yo'q (App Store / transfer)
  return (
    <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
      <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    </div>
  );
}

function StatusProgress({ app }: { app: AppView }) {
  // Rad etilgan / bekor qilingan — progress emas, ogohlantirish.
  if (isTerminalError(app.status)) {
    const meta = STATUS_META[app.status];
    return (
      <div className="flex items-center gap-2 text-xs text-red-600">
        <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
        {app.status === "rejected" ? "Ariza rad etildi" : "Ariza bekor qilindi"}
      </div>
    );
  }

  const flow = getStatusFlow(app.serviceType);
  const currentIndex = flow.indexOf(app.status);
  const meta = STATUS_META[app.status];

  return (
    <div>
      <div className="flex gap-1">
        {flow.map((s, i) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full ${i <= currentIndex ? meta.dot : "bg-slate-200"}`}
          />
        ))}
      </div>
      <p className="text-[11px] text-slate-400 mt-1">
        Bosqich {Math.max(currentIndex + 1, 1)}/{flow.length} · {meta.label}
      </p>
    </div>
  );
}

function SubscriptionRow({ app }: { app: AppView }) {
  if (!app.subscription) return null;
  const sub = app.subscription;

  // Hali chiqarilmagan — obuna boshlanmagan
  if (!sub.startDate) {
    return (
      <p className="text-xs text-slate-500">
        Obuna: ilova store&apos;ga chiqarilgach boshlanadi (9 oy)
      </p>
    );
  }

  const left = daysLeft(sub.endDate);
  const expired = left !== null && left < 0;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
      {expired ? (
        <span className="font-medium text-red-600">Obuna muddati tugagan</span>
      ) : (
        <span className="font-medium text-emerald-700">
          Obuna faol · {left} kun qoldi
        </span>
      )}
      <span className="text-slate-400">·</span>
      <span className="text-slate-500">Tugaydi: {formatDate(sub.endDate)}</span>
      {sub.renewedCount > 0 && (
        <>
          <span className="text-slate-400">·</span>
          <span className="text-slate-500">{sub.renewedCount}× uzaytirilgan</span>
        </>
      )}
    </div>
  );
}

export function AppCard({ app }: { app: AppView }) {
  const status = STATUS_META[app.status];
  const title = app.appName || SERVICE_LABELS[app.serviceType];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm shadow-slate-200/40 p-4 flex gap-4">
      <Logo app={app} />

      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 truncate">{title}</p>
            <p className="text-xs text-slate-500 truncate">{SERVICE_LABELS[app.serviceType]}</p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 flex-shrink-0 ${status.badge}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        </div>

        <StatusProgress app={app} />

        <SubscriptionRow app={app} />

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
          <span>Yuborilgan: {formatDate(app.createdAt)}</span>
          {app.publication.published && (
            <>
              <span>·</span>
              <span>Store&apos;da: {formatDate(app.publication.publishedAt)}</span>
            </>
          )}
          {app.publication.storeUrl && (
            <>
              <span>·</span>
              <a
                href={app.publication.storeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Store havolasi ↗
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
