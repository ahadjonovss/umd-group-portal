import Link from "next/link";
import type { AppView } from "@/lib/firestore/apps";
import { SERVICE_LABELS, STATUS_META } from "@/lib/labels";
import { SERVICE_THEME, ServiceLogo } from "@/components/serviceTheme";

export function AdminAppListItem({ app, spentUsd }: { app: AppView; spentUsd?: number }) {
  const theme = SERVICE_THEME[app.serviceType];
  const status = STATUS_META[app.status];
  const title = app.appName || SERVICE_LABELS[app.serviceType];

  return (
    <Link
      href={`/admin/app/${app.id}`}
      className="group relative overflow-hidden bg-white rounded-2xl border border-slate-200/80 shadow-sm shadow-slate-200/40 hover:shadow-md hover:border-slate-300 transition-all flex items-center gap-4 p-4 pl-5"
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${theme.accent}`} />
      <ServiceLogo serviceType={app.serviceType} iconUrl={app.iconUrl} appName={app.appName} />

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 truncate">{title}</p>
        <p className={`text-xs font-medium truncate ${theme.text}`}>{SERVICE_LABELS[app.serviceType]}</p>
        <p className="text-xs text-slate-400 truncate mt-0.5">{app.ownerEmail || "—"}</p>
        {typeof spentUsd === "number" && (
          <p className="text-xs font-semibold text-emerald-600 mt-0.5">Sarflangan: ${spentUsd}</p>
        )}
      </div>

      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 flex-shrink-0 ${status.badge}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
        {status.label}
      </span>

      <svg className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}
