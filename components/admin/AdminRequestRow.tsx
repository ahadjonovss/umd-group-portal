"use client";

import { useState, useTransition } from "react";
import type { RequestView } from "@/lib/firestore/requests";
import {
  REQUEST_STATUS_META,
  REQUEST_TYPE_LABEL,
  requestStatusLabel,
  requestNextStatus,
  isRequestActive,
} from "@/lib/request-status";
import { SERVICE_SHORT, formatDate } from "@/lib/labels";
import { actSetRequestStatus, actSetRequestNote, actDeleteRequest } from "@/app/admin/actions";

const DATA_LABELS: Record<string, string> = {
  developerAccountId: "Developer Account ID",
  googlePaymentsProfileId: "Payments Profile ID",
  appStoreConnectTeamId: "App Store Connect Team ID",
  appleDevAccountEmail: "Apple Dev email",
  releaseNotes: "Relizdagi o'zgarishlar",
  months: "Muddat (oy)",
  note: "Izoh (mijoz)",
};

export function AdminRequestRow({ request }: { request: RequestView }) {
  const [pending, start] = useTransition();
  const [note, setNote] = useState(request.note);
  const [saved, setSaved] = useState(false);

  const meta = REQUEST_STATUS_META[request.status];
  const next = requestNextStatus(request.status);
  const active = isRequestActive(request.status);
  const title = request.appName || SERVICE_SHORT[request.serviceType];
  const entries = Object.entries(request.data).filter(([, v]) => v && String(v).trim() !== "");

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 truncate">
            <span className="text-indigo-600">{REQUEST_TYPE_LABEL[request.type]}</span> · {title}
          </p>
          <p className="text-xs text-slate-500 truncate">
            {SERVICE_SHORT[request.serviceType]} · {request.ownerName} · {request.ownerPhone}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 flex-shrink-0 ${meta.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
          {requestStatusLabel(request.type, request.status)}
        </span>
      </div>

      {/* Ma'lumotlar */}
      {entries.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1.5 bg-slate-50 rounded-lg p-3">
          {entries.map(([k, v]) => (
            <div key={k} className="min-w-0">
              <p className="text-[10px] text-slate-400">{DATA_LABELS[k] ?? k}</p>
              <p className="text-sm text-slate-800 break-words">{v}</p>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-400">
        Summa: <strong className="text-slate-600">${request.amountUsd}</strong>
        {request.amountUzs ? ` (~${request.amountUzs.toLocaleString("en-US")} so'm)` : ""}
        {" · "}
        {request.status === "payment_pending" && (request.receiptSent ? "Chek: ✓ yuborilgan" : "Chek: kutilmoqda")}
        {" · "}Yuborilgan: {formatDate(request.createdAt)}
      </p>

      {/* Status boshqaruvi */}
      {(next || active) && (
        <div className="flex flex-wrap items-center gap-2">
          {next && (
            <button
              disabled={pending}
              onClick={() => start(() => actSetRequestStatus(request.id, next))}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white ${meta.dot} hover:opacity-90 disabled:opacity-50`}
            >
              {requestStatusLabel(request.type, next)} ga o&apos;tkazish →
            </button>
          )}
          {active && (
            <>
              <button
                disabled={pending}
                onClick={() => start(() => actSetRequestStatus(request.id, "rejected"))}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
              >
                Rad etish
              </button>
              <button
                disabled={pending}
                onClick={() => start(() => actSetRequestStatus(request.id, "cancelled"))}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:opacity-50"
              >
                Bekor qilish
              </button>
            </>
          )}
        </div>
      )}

      {/* Izoh + o'chirish */}
      <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-100">
        <textarea
          value={note}
          onChange={(e) => { setNote(e.target.value); setSaved(false); }}
          placeholder="Izoh (admin uchun)…"
          rows={2}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        />
        <div className="flex items-center gap-2">
          <button
            disabled={pending}
            onClick={() => start(async () => { await actSetRequestNote(request.id, note); setSaved(true); })}
            className="h-8 px-3 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 disabled:opacity-50"
          >
            Izohni saqlash
          </button>
          {saved && !pending && <span className="text-xs text-emerald-600">✓</span>}
          <div className="flex-1" />
          <button
            disabled={pending}
            onClick={() => { if (confirm("Bu so'rovni o'chirasizmi?")) start(() => actDeleteRequest(request.id)); }}
            className="h-8 px-3 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 disabled:opacity-50"
          >
            O&apos;chirish
          </button>
        </div>
      </div>
    </div>
  );
}
