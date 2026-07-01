"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface PaymentViewProps {
  usd: number;
  rate: number | null;
  uzs: number | null;
  cardNumber: string;
  cardHolder: string;
  receiptSent: boolean;
  endpoint?: string;
  idPayload?: Record<string, string>;
  amountLabel?: string;
}

export function PaymentView({
  usd,
  rate,
  uzs,
  cardNumber,
  cardHolder,
  receiptSent,
  endpoint = "/api/payment/receipt",
  idPayload = {},
  amountLabel = "Avans (oldindan)",
}: PaymentViewProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "done">(receiptSent ? "done" : "idle");
  const [error, setError] = useState("");

  function onPick(f: File | null) {
    setFile(f);
    setError("");
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : "");
  }

  async function copyCard() {
    try {
      await navigator.clipboard.writeText(cardNumber.replace(/\s/g, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  async function send() {
    if (!file) { setError("Chek rasmini yuklang"); return; }
    setStatus("loading");
    setError("");
    try {
      const fd = new FormData();
      Object.entries(idPayload).forEach(([k, v]) => fd.append(k, v));
      fd.append("receipt", file);
      const res = await fetch(endpoint, { method: "POST", body: fd });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Xato yuz berdi");
      setStatus("done");
      router.refresh();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Xato yuz berdi");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-xl bg-emerald-50 ring-1 ring-emerald-100 p-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-xs font-medium text-emerald-700">Chek yuborildi. Admin tasdiqlashini kuting.</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-amber-50/70 ring-1 ring-amber-200 p-3.5 flex flex-col gap-3">
      <p className="text-xs font-semibold text-amber-800">To&apos;lov uchun ma&apos;lumotlar</p>

      {/* Summa */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white rounded-lg px-3 py-2 ring-1 ring-amber-100">
          <p className="text-[10px] text-slate-400">{amountLabel}</p>
          <p className="text-lg font-bold text-slate-900">${usd}</p>
        </div>
        <div className="bg-white rounded-lg px-3 py-2 ring-1 ring-amber-100">
          <p className="text-[10px] text-slate-400">So&apos;mda {rate ? `(1$=${rate.toLocaleString("en-US")})` : ""}</p>
          <p className="text-lg font-bold text-slate-900">
            {uzs ? `${uzs.toLocaleString("en-US")} so'm` : "—"}
          </p>
        </div>
      </div>

      {/* Karta raqami */}
      {cardNumber ? (
        <div className="bg-white rounded-lg px-3 py-2 ring-1 ring-amber-100 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] text-slate-400">Karta raqami</p>
            <p className="text-sm font-mono font-semibold text-slate-900 truncate">{cardNumber}</p>
            {cardHolder && <p className="text-[11px] text-slate-500 truncate">{cardHolder}</p>}
          </div>
          <button
            onClick={copyCard}
            className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 transition-colors"
          >
            {copied ? "✓ Nusxalandi" : "Nusxalash"}
          </button>
        </div>
      ) : (
        <p className="text-xs text-slate-500">Karta raqami hali sozlanmagan. Admin bilan bog&apos;laning.</p>
      )}

      {/* Chek yuklash */}
      <div>
        <p className="text-xs text-slate-600 mb-1.5">To&apos;lov qilib, chek (skrinshot) ni yuklang:</p>
        {preview ? (
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="chek" className="w-14 h-14 rounded-lg object-cover border border-slate-200" />
            <button onClick={() => onPick(null)} className="text-xs text-red-600 hover:underline">
              O&apos;chirish
            </button>
          </div>
        ) : (
          <label className="flex items-center justify-center gap-2 h-10 rounded-lg border border-dashed border-slate-300 bg-white text-xs text-slate-500 cursor-pointer hover:border-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Rasm tanlash
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onPick(e.target.files?.[0] ?? null)}
            />
          </label>
        )}
      </div>

      {error && <p className="text-xs text-red-600">❌ {error}</p>}

      <button
        onClick={send}
        disabled={status === "loading"}
        className="h-10 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 active:scale-[0.99] transition-all disabled:opacity-50"
      >
        {status === "loading" ? "Yuborilmoqda…" : "Jo'natish"}
      </button>
    </div>
  );
}
