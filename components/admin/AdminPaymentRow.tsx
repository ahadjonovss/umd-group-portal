"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import type { PaymentView } from "@/lib/firestore/payments";
import { SERVICE_SHORT, formatDate } from "@/lib/labels";
import { actConfirmPayment, actSetPaymentNote, actDeletePayment } from "@/app/admin/actions";

function kindLabel(p: PaymentView): string {
  switch (p.kind) {
    case "transfer": return "Transfer";
    case "update": return "Update";
    case "renewal": return "Obuna uzaytirish";
    case "advance": return `Avans (${p.advancePercent}%)`;
    default: return "Yakuniy";
  }
}

// Har bir to'lov turi uchun rang (chip + chap aksent)
const KIND_STYLE: Record<PaymentView["kind"], { badge: string; accent: string }> = {
  advance: { badge: "bg-amber-100 text-amber-700", accent: "bg-amber-400" },
  final: { badge: "bg-emerald-100 text-emerald-700", accent: "bg-emerald-400" },
  transfer: { badge: "bg-violet-100 text-violet-700", accent: "bg-violet-400" },
  update: { badge: "bg-blue-100 text-blue-700", accent: "bg-blue-400" },
  renewal: { badge: "bg-teal-100 text-teal-700", accent: "bg-teal-400" },
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
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-lg bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200"
          >
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

export function AdminPaymentRow({ payment }: { payment: PaymentView }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [note, setNote] = useState(payment.note);
  const [noteOpen, setNoteOpen] = useState(false);
  const confirmed = payment.status === "confirmed";
  const title = payment.appName || SERVICE_SHORT[payment.serviceType];
  const style = KIND_STYLE[payment.kind] ?? KIND_STYLE.advance;

  return (
    <div className="relative overflow-hidden bg-white rounded-xl border border-slate-200/80 p-3.5 pl-4 flex flex-col gap-2">
      {/* Rangli chap aksent (to'lov turiga qarab) */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${style.accent}`} />

      {/* Sarlavha + status */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 text-sm truncate">{title}</p>
          <p className="text-xs text-slate-500 truncate">
            {SERVICE_SHORT[payment.serviceType]} · {payment.ownerName} · {payment.ownerPhone}
          </p>
        </div>
        <span
          className={`px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 flex-shrink-0 ${
            confirmed
              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
              : "bg-amber-50 text-amber-700 ring-amber-200"
          }`}
        >
          {confirmed ? "Tasdiqlangan" : "Kutilmoqda"}
        </span>
      </div>

      {/* Tafsilotlar — bir qatorda */}
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-600">
        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-semibold ${style.badge}`}>{kindLabel(payment)}</span>
        <span><span className="text-slate-400">To&apos;langan:</span> <strong className="text-slate-900">${payment.amountUsd}</strong></span>
        {payment.amountUzs ? <span className="text-slate-400">~{payment.amountUzs.toLocaleString("en-US")} so&apos;m</span> : null}
        <span className="text-slate-400">Kurs: {payment.rate ? payment.rate.toLocaleString("en-US") : "—"}</span>
        <span className="text-slate-300">·</span>
        <span className="text-slate-400">Jami: ${payment.totalUsd}</span>
        <span className="text-slate-300">·</span>
        <span className="text-slate-400">{formatDate(payment.createdAt)}</span>
      </div>

      {/* Izoh (mavjud bo'lsa) */}
      {note && (
        <p className="text-xs text-slate-600 bg-slate-50 rounded-lg px-2.5 py-1.5">
          <span className="text-slate-400">Izoh: </span>{note}
        </p>
      )}

      {/* Amallar */}
      <div className="flex items-center gap-2 flex-wrap">
        {!confirmed && (
          <button
            disabled={pending}
            onClick={() => start(() => actConfirmPayment(payment.id))}
            className="h-9 px-4 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
          >
            {pending ? "Tasdiqlanmoqda…" : "Tasdiqlash → keyingi bosqich"}
          </button>
        )}
        <button
          onClick={() => setNoteOpen(true)}
          className="h-9 px-3 rounded-lg bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200"
        >
          {note ? "Izohni tahrirlash" : "Izoh qo'shish"}
        </button>
        <div className="flex-1" />
        <button
          disabled={pending}
          onClick={() => {
            if (confirm("Bu to'lovni o'chirasizmi?"))
              start(async () => { await actDeletePayment(payment.id); router.refresh(); });
          }}
          className="h-9 px-3 rounded-lg bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 disabled:opacity-50"
        >
          O&apos;chirish
        </button>
      </div>

      {noteOpen && (
        <NoteDialog
          initial={note}
          saving={pending}
          onClose={() => setNoteOpen(false)}
          onSave={(v) =>
            start(async () => {
              await actSetPaymentNote(payment.id, v);
              setNote(v);
              setNoteOpen(false);
            })
          }
        />
      )}
    </div>
  );
}
