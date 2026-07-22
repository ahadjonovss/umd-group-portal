"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import type { RequestView } from "@/lib/firestore/requests";
import {
  REQUEST_STATUS_META,
  REQUEST_TYPE_LABEL,
  requestStatusLabel,
  requestNextStatus,
  isRequestActive,
  isRequestPreWork,
} from "@/lib/request-status";
import { SERVICE_SHORT, formatDate } from "@/lib/labels";
import { actSetRequestStatus, actSetRequestNote, actDeleteRequest, actConfirmRequestPayment } from "@/app/admin/actions";

const IS_DEV = process.env.NODE_ENV === "development";

const DATA_LABELS: Record<string, string> = {
  developerAccountId: "Developer Account ID",
  googlePaymentsProfileId: "Payments Profile ID",
  appStoreConnectTeamId: "App Store Connect Team ID",
  appleDevAccountEmail: "Apple Dev email",
  releaseNotes: "Relizdagi o'zgarishlar",
  months: "Muddat (oy)",
  note: "Izoh (mijoz)",
};

const TYPE_COLOR: Record<string, string> = {
  transfer: "bg-violet-100 text-violet-700",
  update: "bg-blue-100 text-blue-700",
  subscription_renewal: "bg-teal-100 text-teal-700",
};

function NoteDialog({
  initial,
  saving,
  onSave,
  onClose,
}: {
  initial: string;
  saving: boolean;
  onSave: (v: string) => void;
  onClose: () => void;
}) {
  const [val, setVal] = useState(initial);
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-bold text-slate-900 mb-3">Izoh (admin uchun)</h3>
        <textarea
          autoFocus
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="Izoh yozing…"
          rows={4}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
        />
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="h-9 px-4 rounded-lg bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200">
            Bekor
          </button>
          <button
            disabled={saving}
            onClick={() => onSave(val)}
            className="h-9 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saqlanmoqda…" : "Saqlash"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function ReceiptUrlDialog({
  usd,
  uzs,
  saving,
  onConfirm,
  onClose,
}: {
  usd: number;
  uzs: number | null;
  saving: boolean;
  onConfirm: (url: string) => void;
  onClose: () => void;
}) {
  const [url, setUrl] = useState("");
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-bold text-slate-900 mb-1">To&apos;lovni tasdiqlash</h3>
        <p className="text-xs text-slate-500 mb-3">
          Mijozga <span className="font-semibold text-slate-800">${usd}</span>
          {uzs ? <span className="text-slate-500"> (~{uzs.toLocaleString("en-US")} so&apos;m)</span> : null} summaga soliq cheki beriladi.
        </p>
        <label className="block text-xs font-medium text-slate-600 mb-1">Soliq cheki havolasi (URL)</label>
        <input
          autoFocus
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
        />
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="h-9 px-4 rounded-lg bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200">
            Bekor
          </button>
          <button
            disabled={saving}
            onClick={() => onConfirm(url)}
            className="h-9 px-4 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? "Tasdiqlanmoqda…" : "Tasdiqlash"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function AdminRequestRow({ request }: { request: RequestView }) {
  const [pending, start] = useTransition();
  const [note, setNote] = useState(request.note);
  const [noteOpen, setNoteOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);

  // To'lov-oldi bosqich + chek yuborilgan bo'lsa: keyingi bosqich = to'lovni tasdiqlash (soliq URL bilan)
  const isPaymentConfirm = isRequestPreWork(request.status) && request.receiptSent;

  const meta = REQUEST_STATUS_META[request.status];
  const next = requestNextStatus(request.status);
  const active = isRequestActive(request.status);
  const title = request.appName || SERVICE_SHORT[request.serviceType];
  const entries = Object.entries(request.data).filter(([, v]) => v && String(v).trim() !== "");
  const typeColor = TYPE_COLOR[request.type] ?? "bg-slate-100 text-slate-700";

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 flex flex-col gap-2">
      {/* Yuqori: tur + ilova | status */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`inline-flex flex-shrink-0 items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${typeColor}`}>
              {REQUEST_TYPE_LABEL[request.type]}
            </span>
            <p className="font-semibold text-slate-900 text-sm truncate">{title}</p>
          </div>
          <p className="text-xs text-slate-500 truncate mt-1">
            {request.ownerName} · {request.ownerPhone}
          </p>
        </div>
        <div className="flex flex-col items-end flex-shrink-0">
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 ${meta.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
            {requestStatusLabel(request.type, request.status)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1">{formatDate(request.createdAt)}</span>
        </div>
      </div>

      {/* Summa */}
      <div className="flex items-center gap-2 text-xs">
        <span className="font-semibold text-slate-900">${request.amountUsd}</span>
        {request.amountUzs ? <span className="text-slate-400">~{request.amountUzs.toLocaleString("en-US")} so&apos;m</span> : null}
        {isRequestPreWork(request.status) && (
          <span className={request.receiptSent ? "text-emerald-600" : "text-amber-600"}>
            · Chek: {request.receiptSent ? "✓" : "kutilmoqda"}
          </span>
        )}
      </div>

      {/* Ma'lumotlar (doim ko'rinadi) */}
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

      {/* Izoh (mavjud bo'lsa) */}
      {note && (
        <p className="text-xs text-slate-600 bg-slate-50 rounded-lg px-2.5 py-1.5">
          <span className="text-slate-400">Izoh: </span>{note}
        </p>
      )}

      {/* Amallar */}
      <div className="flex items-center gap-2 flex-wrap">
        {next && isPaymentConfirm && (
          <button
            disabled={pending}
            onClick={() => setPayOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
          >
            To&apos;lovni tasdiqlash → soliq cheki
          </button>
        )}
        {next && !isPaymentConfirm && (
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
        <button
          onClick={() => setNoteOpen(true)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200"
        >
          {note ? "Izohni tahrirlash" : "Izoh qo'shish"}
        </button>
        <div className="flex-1" />
        {IS_DEV && (
          <button
            disabled={pending}
            onClick={() => { if (confirm("Bu so'rovni o'chirasizmi?")) start(() => actDeleteRequest(request.id)); }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
          >
            O&apos;chirish
          </button>
        )}
      </div>

      {payOpen && (
        <ReceiptUrlDialog
          usd={request.amountUsd}
          uzs={request.amountUzs}
          saving={pending}
          onClose={() => setPayOpen(false)}
          onConfirm={(url) =>
            start(async () => {
              await actConfirmRequestPayment(request.id, url);
              setPayOpen(false);
            })
          }
        />
      )}

      {noteOpen && (
        <NoteDialog
          initial={note}
          saving={pending}
          onClose={() => setNoteOpen(false)}
          onSave={(v) =>
            start(async () => {
              await actSetRequestNote(request.id, v);
              setNote(v);
              setNoteOpen(false);
            })
          }
        />
      )}
    </div>
  );
}
