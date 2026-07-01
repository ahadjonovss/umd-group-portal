"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AppView } from "@/lib/firestore/apps";
import { getStatusFlow, type AppStatus } from "@/lib/app-status";
import { STATUS_META, SERVICE_LABELS, formatDate } from "@/lib/labels";
import { SERVICE_THEME, ServiceLogo } from "@/components/serviceTheme";
import { actSetStatus, actPublish, actDeleteApp } from "@/app/admin/actions";

export function AdminAppRow({ app }: { app: AppView }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const theme = SERVICE_THEME[app.serviceType];
  const status = STATUS_META[app.status];
  const title = app.appName || SERVICE_LABELS[app.serviceType];

  const [date, setDate] = useState("");
  const [url, setUrl] = useState(app.publication.storeUrl ?? "");

  // Faqat keyingi status ko'rsatiladi (barcha statuslar ishlatiladi).
  const flow = getStatusFlow(app.serviceType);
  const idx = flow.indexOf(app.status);
  const nextStatus: AppStatus | null = idx >= 0 && idx < flow.length - 1 ? flow[idx + 1] : null;
  const nextMeta = nextStatus ? STATUS_META[nextStatus] : null;
  const inProgress = !["published", "completed", "rejected", "cancelled"].includes(app.status);
  const nextIsPublish = nextStatus === "published";

  return (
    <div className="group relative overflow-hidden bg-white rounded-2xl border border-slate-200/80 shadow-sm shadow-slate-200/40">
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${theme.accent}`} />

      <div className="p-4 pl-5 flex gap-4">
        <ServiceLogo serviceType={app.serviceType} iconUrl={app.iconUrl} appName={app.appName} />

        <div className="flex-1 min-w-0 flex flex-col gap-3">
          {/* Sarlavha + joriy status */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 truncate">{title}</p>
              <p className={`text-xs font-medium truncate ${theme.text}`}>{SERVICE_LABELS[app.serviceType]}</p>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {app.ownerEmail || "—"}
                {app.contact ? ` · ${app.contact.fullName} · ${app.contact.phone}` : ""}
              </p>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 flex-shrink-0 ${status.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
          </div>

          {/* Keyingi status: chiqarish bosqichi bo'lsa — sana+url forma, aks holda tugma */}
          {nextStatus && nextMeta && nextIsPublish && (
            <div className="flex flex-col gap-2 rounded-xl bg-emerald-50/60 ring-1 ring-emerald-100 p-3">
              <p className="text-xs font-medium text-emerald-700">Store&apos;ga chiqarish (obuna 9 oy boshlanadi)</p>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-9 rounded-lg border border-slate-200 px-2 text-sm"
                />
                <input
                  type="url"
                  placeholder="Store havolasi (ixtiyoriy)"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1 min-w-40 h-9 rounded-lg border border-slate-200 px-2 text-sm"
                />
                <button
                  disabled={pending}
                  onClick={() => start(() => actPublish(app.id, date, url))}
                  className="h-9 px-3 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
                >
                  Chiqarildi →
                </button>
              </div>
            </div>
          )}

          {/* Keyingi status tugmasi (oddiy) + terminal amallar */}
          {((nextStatus && !nextIsPublish) || inProgress) && (
            <div className="flex flex-wrap items-center gap-2">
              {nextStatus && nextMeta && !nextIsPublish && (
                <button
                  disabled={pending}
                  onClick={() => start(() => actSetStatus(app.id, nextStatus))}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white ${nextMeta.dot} hover:opacity-90 disabled:opacity-50 transition-all`}
                >
                  {nextMeta.label} ga o&apos;tkazish →
                </button>
              )}
              {inProgress && (
                <>
                  <button
                    disabled={pending}
                    onClick={() => start(() => actSetStatus(app.id, "rejected"))}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
                  >
                    Rad etish
                  </button>
                  <button
                    disabled={pending}
                    onClick={() => start(() => actSetStatus(app.id, "cancelled"))}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:opacity-50"
                  >
                    Bekor qilish
                  </button>
                </>
              )}
            </div>
          )}

          {/* Obuna ma'lumoti (uzaytirish user so'rovi orqali) */}
          {app.subscription?.startDate && (
            <div className="rounded-xl bg-slate-50 ring-1 ring-slate-100 p-3">
              <span className="text-xs text-slate-600">
                Obuna: {formatDate(app.subscription.startDate)} → {formatDate(app.subscription.endDate)}
                {app.subscription.renewedCount > 0 && ` · ${app.subscription.renewedCount}× uzaytirilgan`}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100">
            <p className="text-[11px] text-slate-400">
              Yuborilgan: {formatDate(app.createdAt)} · {app.telegramSent ? "Telegram ✓" : "Telegram ✗"}
            </p>
            <button
              disabled={pending}
              onClick={() => {
                if (confirm("Bu arizani va unga bog'liq to'lov/sharhlarni butunlay o'chirasizmi?"))
                  start(async () => { await actDeleteApp(app.id); router.push("/admin"); });
              }}
              className="text-xs font-medium text-red-600 hover:text-red-700 hover:underline disabled:opacity-50 flex-shrink-0"
            >
              O&apos;chirish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
