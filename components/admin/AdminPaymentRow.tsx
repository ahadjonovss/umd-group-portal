"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PaymentView } from "@/lib/firestore/payments";
import { SERVICE_SHORT, formatDate } from "@/lib/labels";
import { actConfirmPayment, actDeletePayment } from "@/app/admin/actions";

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

export function AdminPaymentRow({ payment }: { payment: PaymentView }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const confirmed = payment.status === "confirmed";
  const title = payment.appName || SERVICE_SHORT[payment.serviceType];
  const style = KIND_STYLE[payment.kind] ?? KIND_STYLE.advance;

  return (
    <div className="relative overflow-hidden bg-white rounded-xl border border-slate-200/80 p-3 pl-3.5 flex flex-col gap-1.5">
      {/* Rangli chap aksent (to'lov turiga qarab) */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${style.accent}`} />

      {/* Yuqori: summa + tur | status + sana + o'chirish */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <p className="text-lg font-bold text-slate-900 leading-none">${payment.amountUsd}</p>
          <span className={`inline-flex flex-shrink-0 items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${style.badge}`}>
            {kindLabel(payment)}
          </span>
          {payment.amountUzs ? (
            <span className="text-xs text-slate-400 truncate">~{payment.amountUzs.toLocaleString("en-US")} so&apos;m</span>
          ) : null}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 ${
              confirmed
                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                : "bg-amber-50 text-amber-700 ring-amber-200"
            }`}
          >
            {confirmed ? "Tasdiqlangan" : "Kutilmoqda"}
          </span>
          <button
            disabled={pending}
            title="O'chirish"
            onClick={() => {
              if (confirm("Bu to'lovni o'chirasizmi?"))
                start(async () => { await actDeletePayment(payment.id); router.refresh(); });
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Ilova + mijoz — bosiladigan */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
        {payment.appId ? (
          <Link href={`/admin/app/${payment.appId}`} className="font-medium text-slate-800 hover:text-blue-600 hover:underline truncate">
            {title}
          </Link>
        ) : (
          <span className="font-medium text-slate-800 truncate">{title}</span>
        )}
        <span className="text-slate-300">·</span>
        {payment.ownerUid ? (
          <Link href={`/admin/user/${payment.ownerUid}`} className="text-slate-600 hover:text-blue-600 hover:underline">
            {payment.ownerName}
          </Link>
        ) : (
          <span className="text-slate-600">{payment.ownerName}</span>
        )}
        <span className="text-slate-400">{payment.ownerPhone}</span>
        <span className="text-slate-300">·</span>
        <span className="text-slate-400">{formatDate(payment.createdAt)}</span>
      </div>

      {/* Tasdiqlash (faqat kutilayotgan) */}
      {!confirmed && (
        <button
          disabled={pending}
          onClick={() => start(() => actConfirmPayment(payment.id))}
          className="self-start h-8 px-3 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50"
        >
          {pending ? "Tasdiqlanmoqda…" : "Tasdiqlash → keyingi bosqich"}
        </button>
      )}
    </div>
  );
}
