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
  askTaxPhone?: boolean; // yakuniy/to'liq to'lovda soliq cheki uchun telefon so'ralsin
  discountPercent?: number; // qo'llangan chegirma (%) — belgisi ko'rsatiladi
  walletUzs?: number; // foydalanuvchi hamyon balansi (so'm)
}

const UZ_PHONE_RE = /^\+998\d{9}$/;

// +998 dan keyingi raqamlarni "90 123 45 67" ko'rinishida formatlaydi
function formatUzTail(digits: string): string {
  const d = digits.slice(0, 9);
  const g = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean);
  return "+998" + (g.length ? " " + g.join(" ") : " ");
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
  askTaxPhone = false,
  discountPercent = 0,
  walletUzs = 0,
}: PaymentViewProps) {
  const router = useRouter();
  // Tartib: xizmat narxi -> chegirma -> hamyon (chegirma hamyondan OLDIN)
  const grossUzs = discountPercent > 0 && uzs != null ? Math.round(uzs / (1 - Math.min(discountPercent, 100) / 100)) : uzs;
  const discountUzs = grossUzs != null && uzs != null ? grossUzs - uzs : 0;
  const walletApplied = walletUzs > 0 && uzs ? Math.min(walletUzs, uzs) : 0;
  const netUzs = uzs !== null ? uzs - walletApplied : null;
  const showBreakdown = discountUzs > 0 || walletApplied > 0;
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [phoneDigits, setPhoneDigits] = useState(""); // +998 dan keyingi 9 raqam
  const fullPhone = "+998" + phoneDigits;
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
    if (askTaxPhone && !UZ_PHONE_RE.test(fullPhone)) {
      setError("Telefon raqamini to'liq kiriting: +998 va 9 ta raqam");
      return;
    }
    setStatus("loading");
    setError("");
    try {
      const fd = new FormData();
      Object.entries(idPayload).forEach(([k, v]) => fd.append(k, v));
      if (askTaxPhone) fd.append("taxPhone", fullPhone);
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
      <div className="rounded-xl bg-emerald-50 ring-1 ring-emerald-100 p-4 flex items-center gap-3">
        <span className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </span>
        <div>
          <p className="text-sm font-semibold text-emerald-800">Chek yuborildi</p>
          <p className="text-xs text-emerald-600">Admin tasdiqlashini kuting.</p>
        </div>
      </div>
    );
  }

  const payAmount = netUzs ?? uzs;
  const step = (n: number) => (
    <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">{n}</span>
  );

  return (
    <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden">
      {/* To'lanadigan summa + breakdown */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-700 p-4 text-white">
        <p className="text-xs text-slate-300">{amountLabel}</p>

        {/* Hisob-kitob: narx → chegirma → hamyon → to'lash */}
        {showBreakdown && (
          <div className="mt-2 mb-2.5 rounded-xl bg-white/10 p-2.5 text-xs flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Xizmat narxi</span>
              <span className="font-medium text-slate-100">{(grossUzs ?? 0).toLocaleString("en-US")} so&apos;m</span>
            </div>
            {discountUzs > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-emerald-300">Chegirma (−{discountPercent}%)</span>
                <span className="font-semibold text-emerald-300">−{discountUzs.toLocaleString("en-US")} so&apos;m</span>
              </div>
            )}
            {walletApplied > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-emerald-300">🪙 Hamyondan</span>
                <span className="font-semibold text-emerald-300">−{walletApplied.toLocaleString("en-US")} so&apos;m</span>
              </div>
            )}
          </div>
        )}

        <p className="text-[11px] text-slate-400">To&apos;lash kerak</p>
        <p className="text-3xl font-bold tracking-tight">
          {payAmount != null ? `${payAmount.toLocaleString("en-US")} so'm` : `$${usd}`}
        </p>
        <p className="text-xs text-slate-300 mt-0.5">
          ${usd}{rate ? ` · 1$=${rate.toLocaleString("en-US")} so'm` : ""}
        </p>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* 1. Kartaga o'tkazing */}
        <div className="flex gap-2.5">
          {step(1)}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 mb-1.5">Ushbu kartaga o&apos;tkazing</p>
            {cardNumber ? (
              <div className="rounded-xl bg-slate-50 ring-1 ring-slate-200 px-3 py-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-base font-mono font-semibold text-slate-900 truncate tracking-wide">{cardNumber}</p>
                  {cardHolder && <p className="text-xs text-slate-500 truncate">{cardHolder}</p>}
                </div>
                <button
                  onClick={copyCard}
                  className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
                >
                  {copied ? "✓" : "Nusxa"}
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Karta raqami hali sozlanmagan. Admin bilan bog&apos;laning.</p>
            )}
          </div>
        </div>

        {/* 2. Telefon (soliq cheki) */}
        {askTaxPhone && (
          <div className="flex gap-2.5">
            {step(2)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800">Telefon raqami</p>
              <p className="text-[11px] text-slate-400 mb-1.5">Soliqdan elektron chekni SMS orqali yuborish uchun</p>
              <input
                type="tel"
                inputMode="numeric"
                value={formatUzTail(phoneDigits)}
                onChange={(e) => {
                  let d = e.target.value.replace(/\D/g, "");
                  if (d.startsWith("998")) d = d.slice(3);
                  setPhoneDigits(d.slice(0, 9));
                  setError("");
                }}
                className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm font-mono tracking-wide focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {/* Chek yuklash */}
        <div className="flex gap-2.5">
          {step(askTaxPhone ? 3 : 2)}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 mb-1.5">To&apos;lov chekini (skrinshot) yuklang</p>
            {preview ? (
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 ring-1 ring-slate-200 p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="chek" className="w-16 h-16 rounded-lg object-cover ring-1 ring-slate-200" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-emerald-600">✓ Rasm tanlandi</p>
                  <button onClick={() => onPick(null)} className="text-xs text-red-600 hover:underline mt-0.5">
                    O&apos;chirish
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-1.5 h-24 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 text-slate-500 cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs font-medium">Rasm tanlash</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => onPick(e.target.files?.[0] ?? null)} />
              </label>
            )}
          </div>
        </div>

        {error && <p className="text-xs text-red-600 pl-7">❌ {error}</p>}

        <button
          onClick={send}
          disabled={status === "loading"}
          className="h-11 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 active:scale-[0.99] transition-all disabled:opacity-50 shadow-sm shadow-emerald-600/20"
        >
          {status === "loading" ? "Yuborilmoqda…" : "Chekni jo'natish"}
        </button>
      </div>
    </div>
  );
}
