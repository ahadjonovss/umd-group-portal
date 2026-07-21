"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PaymentView } from "@/lib/firestore/payments";
import { SERVICE_SHORT, formatDate } from "@/lib/labels";
import { actConfirmPayment, actDeletePayment } from "@/app/admin/actions";

const IS_DEV = process.env.NODE_ENV === "development";

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

// +998901234567 -> +998 90 123 45 67
function formatUzPhone(p: string): string {
  const d = p.replace(/\D/g, "");
  const m = d.match(/^998(\d{2})(\d{3})(\d{2})(\d{2})$/);
  return m ? `+998 ${m[1]} ${m[2]} ${m[3]} ${m[4]}` : p;
}

function ReceiptConfirmModal({
  totalUsd,
  totalUzs,
  taxPhone,
  saving,
  onConfirm,
  onClose,
}: {
  totalUsd: number;
  totalUzs: number | null;
  taxPhone: string | null;
  saving: boolean;
  onConfirm: (url: string) => void;
  onClose: () => void;
}) {
  const [url, setUrl] = useState("");
  const valid = url.trim().length > 5;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-bold text-slate-900 mb-3">To&apos;lovni tasdiqlash</h3>

        {/* Chek summasi */}
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 mb-4">
          <p className="text-xs text-emerald-700">Ushbu soliq cheki quyidagi umumiy summaga beriladi:</p>
          <p className="text-2xl font-bold text-emerald-700 mt-0.5">${totalUsd}</p>
          {totalUzs ? <p className="text-xs text-emerald-600">~{totalUzs.toLocaleString("en-US")} so&apos;m</p> : null}
        </div>

        {/* Soliq cheki uchun mijoz telefoni */}
        {taxPhone && (
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <div>
              <p className="text-[11px] text-slate-400">Soliq cheki uchun telefon (SMS)</p>
              <p className="text-sm font-semibold text-slate-900 tracking-wide">{formatUzPhone(taxPhone)}</p>
            </div>
          </div>
        )}

        <label className="text-xs text-slate-500">Soliq cheki havolasi (URL)</label>
        <input
          autoFocus
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://soliq.uz/..."
          className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
        />

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="h-9 px-4 rounded-lg bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200">
            Bekor
          </button>
          <button
            disabled={!valid || saving}
            onClick={() => onConfirm(url.trim())}
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

export function AdminPaymentRow({ payment }: { payment: PaymentView }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const confirmed = payment.status === "confirmed";
  const rejected = payment.status === "rejected";
  const title = payment.appName || SERVICE_SHORT[payment.serviceType];
  const style = KIND_STYLE[payment.kind] ?? KIND_STYLE.advance;

  // Soliq cheki URL: yakuniy yoki to'liq (100%) to'lovlarda so'raladi (avansda emas)
  const needsReceipt = payment.kind !== "advance" || payment.advancePercent >= 100;
  const totalUsd = payment.totalUsd || payment.amountUsd;
  const totalUzs = payment.rate ? Math.round(totalUsd * payment.rate) : null;

  function onConfirmClick() {
    if (needsReceipt) setConfirmOpen(true);
    else start(() => actConfirmPayment(payment.id));
  }

  return (
    <div className="relative overflow-hidden bg-white rounded-xl border border-slate-200/80 p-3 pl-3.5 flex flex-col gap-1.5">
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
                : rejected
                  ? "bg-red-50 text-red-700 ring-red-200"
                  : "bg-amber-50 text-amber-700 ring-amber-200"
            }`}
          >
            {confirmed ? "Tasdiqlangan" : rejected ? "Rad etilgan" : "Kutilmoqda"}
          </span>
          {IS_DEV && (
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
          )}
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
        {payment.taxReceiptUrl && (
          <>
            <span className="text-slate-300">·</span>
            <a href={payment.taxReceiptUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
              Soliq cheki ↗
            </a>
          </>
        )}
      </div>

      {/* Tasdiqlash (faqat kutilayotgan) */}
      {payment.status === "pending" && (
        <button
          disabled={pending}
          onClick={onConfirmClick}
          className="self-start h-8 px-3 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50"
        >
          {pending ? "Tasdiqlanmoqda…" : "Tasdiqlash → keyingi bosqich"}
        </button>
      )}

      {confirmOpen && (
        <ReceiptConfirmModal
          totalUsd={totalUsd}
          totalUzs={totalUzs}
          taxPhone={payment.taxPhone}
          saving={pending}
          onClose={() => setConfirmOpen(false)}
          onConfirm={(url) =>
            start(async () => {
              await actConfirmPayment(payment.id, url);
              setConfirmOpen(false);
            })
          }
        />
      )}
    </div>
  );
}
