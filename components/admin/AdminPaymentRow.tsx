"use client";

import { useTransition } from "react";
import type { PaymentView } from "@/lib/firestore/payments";
import { SERVICE_SHORT, formatDate } from "@/lib/labels";
import { actConfirmPayment } from "@/app/admin/actions";

export function AdminPaymentRow({ payment }: { payment: PaymentView }) {
  const [pending, start] = useTransition();
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

      {!confirmed && (
        <button
          disabled={pending}
          onClick={() => start(() => actConfirmPayment(payment.id))}
          className="h-9 px-4 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 self-start"
        >
          {pending ? "Tasdiqlanmoqda…" : "Tasdiqlash → keyingi bosqich"}
        </button>
      )}
    </div>
  );
}
