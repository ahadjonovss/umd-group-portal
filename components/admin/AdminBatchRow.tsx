"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { PaymentView } from "@/lib/firestore/payments";
import { SERVICE_SHORT } from "@/lib/labels";
import { actConfirmPaymentBatch, actRejectPaymentBatch } from "@/app/admin/actions";

function kindLabel(p: PaymentView): string {
  switch (p.kind) {
    case "advance": return `Avans (${p.advancePercent}%)`;
    case "final": return "Yakuniy";
    case "full": return "To'liq";
    case "transfer": return "Transfer";
    case "update": return "Update";
    case "renewal": return "Obuna uzaytirish";
    case "push_certificate": return "Push sertifikat";
    case "update_package": return "Update paketi";
    case "custom": return "Qo'shimcha";
    default: return p.kind;
  }
}

function formatUzPhone(p: string): string {
  const d = p.replace(/\D/g, "");
  const m = d.match(/^998(\d{2})(\d{3})(\d{2})(\d{2})$/);
  return m ? `+998 ${m[1]} ${m[2]} ${m[3]} ${m[4]}` : p;
}

function BatchConfirmModal({
  netDueUzs,
  taxPhone,
  saving,
  onConfirm,
  onClose,
}: {
  netDueUzs: number;
  taxPhone: string | null;
  saving: boolean;
  onConfirm: (url: string, actualPaidUzs: number) => void;
  onClose: () => void;
}) {
  const [url, setUrl] = useState("");
  const [paid, setPaid] = useState(String(netDueUzs));
  const paidNum = Math.round(Number(paid) || 0);
  const overpay = paidNum - netDueUzs;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-bold text-slate-900 mb-3">Guruh to&apos;lovini tasdiqlash</h3>

        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 mb-3">
          <p className="text-xs text-slate-500">Mijoz o&apos;tkazishi kerak edi (jami):</p>
          <p className="text-lg font-bold text-slate-900">{netDueUzs.toLocaleString("en-US")} so&apos;m</p>
        </div>

        <label className="text-xs text-slate-500">Mijoz aslida qancha to&apos;ladi? (so&apos;m)</label>
        <input
          autoFocus type="number" inputMode="numeric" value={paid}
          onChange={(e) => setPaid(e.target.value)}
          className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
        />
        {overpay > 0 && <p className="text-xs font-semibold text-emerald-600 mt-1.5">🪙 Ortiqcha +{overpay.toLocaleString("en-US")} so&apos;m hamyonga tushadi</p>}
        {overpay < 0 && <p className="text-xs font-semibold text-amber-600 mt-1.5">⚠️ Kam to&apos;langan ({overpay.toLocaleString("en-US")} so&apos;m)</p>}

        {taxPhone && (
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 my-3 flex items-center gap-2">
            <div>
              <p className="text-[11px] text-slate-400">Soliq cheki uchun telefon</p>
              <p className="text-sm font-semibold text-slate-900 tracking-wide">{formatUzPhone(taxPhone)}</p>
            </div>
          </div>
        )}
        <label className="text-xs text-slate-500">Soliq cheki havolasi (URL) — guruh uchun bitta</label>
        <input
          value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://ofd.soliq.uz/..."
          className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
        />

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="h-9 px-4 rounded-lg bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200">Bekor</button>
          <button
            disabled={saving || paidNum <= 0}
            onClick={() => onConfirm(url.trim(), paidNum)}
            className="h-9 px-4 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? "Tasdiqlanmoqda…" : "Hammasini tasdiqlash"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function AdminBatchRow({ payments }: { payments: PaymentView[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const batchId = payments[0]?.batchId ?? "";
  const first = payments[0];
  const totalUsd = payments.reduce((s, p) => s + (p.amountUsd || 0), 0);
  const totalUzs = payments.reduce((s, p) => s + (p.amountUzs || 0), 0);
  const netDueTotal = payments.reduce((s, p) => s + ((p.netDueUzs ?? p.amountUzs ?? 0)), 0);
  const allPending = payments.every((p) => p.status === "pending");
  const anyPending = payments.some((p) => p.status === "pending");
  const taxPhone = payments.find((p) => p.taxPhone)?.taxPhone ?? null;

  const statusBadge = allPending
    ? { text: "Kutilmoqda", cls: "bg-amber-50 text-amber-700 ring-amber-200" }
    : anyPending
      ? { text: "Qisman", cls: "bg-blue-50 text-blue-700 ring-blue-200" }
      : { text: "Tasdiqlangan", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" };

  // Ilovalar ro'yxati (takrorsiz)
  const appNames = Array.from(new Set(payments.map((p) => p.appName || SERVICE_SHORT[p.serviceType]))).join(", ");

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
      {/* Sarlavha */}
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-[11px] font-semibold">
                🔗 Guruh · {payments.length} ta
              </span>
              <p className="text-lg font-bold text-slate-900">${totalUsd}</p>
              {totalUzs > 0 && <span className="text-xs text-slate-400">~{totalUzs.toLocaleString("en-US")} so&apos;m</span>}
            </div>
            <p className="text-xs text-slate-500 truncate mt-1">{first?.ownerName} · {first?.ownerPhone}</p>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">{appNames}</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 flex-shrink-0 ${statusBadge.cls}`}>
            {statusBadge.text}
          </span>
        </div>

        {/* Expansion — qaysi to'lov qaysiga */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
        >
          <svg className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Tafsilotlar ({payments.length} ta to&apos;lov)
        </button>

        {open && (
          <div className="mt-2 flex flex-col gap-1.5 rounded-lg bg-slate-50 ring-1 ring-slate-100 p-2.5">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <Link href={`/admin/app/${p.appId}`} className="font-medium text-slate-800 hover:text-blue-600 hover:underline truncate">
                    {p.appName || SERVICE_SHORT[p.serviceType]}
                  </Link>
                  <span className="text-slate-400"> · {kindLabel(p)}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="font-semibold text-slate-900">${p.amountUsd}</span>
                  {p.amountUzs ? <span className="text-[11px] text-slate-400">{p.amountUzs.toLocaleString("en-US")}</span> : null}
                  <span className={`w-1.5 h-1.5 rounded-full ${p.status === "confirmed" ? "bg-emerald-500" : p.status === "rejected" ? "bg-red-500" : "bg-amber-500"}`} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Amallar */}
      {anyPending && (
        <div className="flex items-center gap-2 px-3.5 pb-3.5">
          <button
            disabled={pending}
            onClick={() => setConfirmOpen(true)}
            className="h-8 px-3 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50"
          >
            {pending ? "…" : "🚀 Hammasini tasdiqlash (chek bilan)"}
          </button>
          <button
            disabled={pending}
            onClick={() => {
              if (!confirm("Guruhdagi BARCHA to'lovlarni rad etasizmi?")) return;
              start(async () => { await actRejectPaymentBatch(batchId); router.refresh(); });
            }}
            className="h-8 px-3 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 disabled:opacity-50"
          >
            Rad etish
          </button>
        </div>
      )}

      {confirmOpen && (
        <BatchConfirmModal
          netDueUzs={netDueTotal}
          taxPhone={taxPhone}
          saving={pending}
          onClose={() => setConfirmOpen(false)}
          onConfirm={(url, actualPaidUzs) =>
            start(async () => {
              await actConfirmPaymentBatch(batchId, url || undefined, actualPaidUzs);
              setConfirmOpen(false);
              router.refresh();
            })
          }
        />
      )}
    </div>
  );
}
