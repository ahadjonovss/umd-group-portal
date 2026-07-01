"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { PaymentView } from "@/lib/firestore/payments";
import { SERVICE_SHORT, formatDate } from "@/lib/labels";
import { actConfirmPayment, actSetPaymentNote, actDeletePayment } from "@/app/admin/actions";

export function AdminPaymentRow({ payment }: { payment: PaymentView }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [note, setNote] = useState(payment.note);
  const [noteSaved, setNoteSaved] = useState(false);
  const confirmed = payment.status === "confirmed";
  const title = payment.appName || SERVICE_SHORT[payment.serviceType];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 truncate">{title}</p>
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

      {/* To'lov tafsilotlari */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-slate-50 rounded-lg px-3 py-2">
          <p className="text-[10px] text-slate-400">Turi</p>
          <p className="text-sm font-semibold text-slate-900">
            {payment.kind === "advance" ? `Avans (${payment.advancePercent}%)` : "Yakuniy"}
          </p>
        </div>
        <div className="bg-slate-50 rounded-lg px-3 py-2">
          <p className="text-[10px] text-slate-400">To&apos;langan</p>
          <p className="text-sm font-semibold text-slate-900">${payment.amountUsd}</p>
        </div>
        <div className="bg-slate-50 rounded-lg px-3 py-2">
          <p className="text-[10px] text-slate-400">Kurs (to&apos;lov payti)</p>
          <p className="text-sm font-semibold text-slate-900">
            {payment.rate ? payment.rate.toLocaleString("en-US") : "—"}
          </p>
        </div>
        <div className="bg-slate-50 rounded-lg px-3 py-2">
          <p className="text-[10px] text-slate-400">So&apos;mda</p>
          <p className="text-sm font-semibold text-slate-900">
            {payment.amountUzs ? `${payment.amountUzs.toLocaleString("en-US")}` : "—"}
          </p>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Umumiy xizmat narxi: <strong className="text-slate-600">${payment.totalUsd}</strong>
        {" · "}Yuborilgan: {formatDate(payment.createdAt)}
      </p>

      {/* Izoh */}
      <div className="flex flex-col gap-1.5">
        <textarea
          value={note}
          onChange={(e) => { setNote(e.target.value); setNoteSaved(false); }}
          placeholder="Izoh (admin uchun)…"
          rows={2}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
        />
        <div className="flex items-center gap-2">
          <button
            disabled={pending}
            onClick={() => start(async () => { await actSetPaymentNote(payment.id, note); setNoteSaved(true); })}
            className="h-8 px-3 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 disabled:opacity-50"
          >
            Izohni saqlash
          </button>
          {noteSaved && !pending && <span className="text-xs text-emerald-600">✓ Saqlandi</span>}
        </div>
      </div>

      <div className="flex items-center gap-2">
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
    </div>
  );
}
