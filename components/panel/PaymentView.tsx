"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/i18n/LanguageProvider";

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
  allowPartial?: boolean; // qisman to'lash imkoni (avans/yakuniy qismlarida)
  paidUzs?: number; // shu qism bo'yicha allaqachon to'langan summa (so'm)
}

// "1234567" -> "1 234 567"
function groupUzs(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
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
  amountLabel,
  askTaxPhone = false,
  discountPercent = 0,
  walletUzs = 0,
  allowPartial = false,
  paidUzs = 0,
}: PaymentViewProps) {
  const t = useT();
  const label = amountLabel ?? t.panel.payDefaultLabel;
  const router = useRouter();

  // Qisman to'lov: mijoz shu safar qancha to'layotganini o'zi kiritadi
  const [partialOn, setPartialOn] = useState(false);
  const [partialRaw, setPartialRaw] = useState("");
  const partialUzs = partialRaw ? parseInt(partialRaw, 10) : 0;
  const partialActive = allowPartial && partialOn;

  // Shu to'lov qoplaydigan summa (qisman bo'lsa — kiritilgan summa)
  const coverUzs = partialActive && partialUzs > 0 && uzs != null ? Math.min(partialUzs, uzs) : uzs;
  const leftAfterUzs = uzs != null && coverUzs != null ? Math.max(0, uzs - coverUzs) : 0;

  // Tartib: xizmat narxi -> chegirma -> hamyon (chegirma hamyondan OLDIN)
  const grossUzs = discountPercent > 0 && uzs != null ? Math.round(uzs / (1 - Math.min(discountPercent, 100) / 100)) : uzs;
  const discountUzs = grossUzs != null && uzs != null ? grossUzs - uzs : 0;
  const walletApplied = walletUzs > 0 && coverUzs ? Math.min(walletUzs, coverUzs) : 0;
  const netUzs = coverUzs !== null ? coverUzs - walletApplied : null;
  const showBreakdown = (!partialActive && discountUzs > 0) || walletApplied > 0;
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
    if (partialActive && (!partialUzs || partialUzs <= 0)) {
      setError(t.panel.payErrNoAmount);
      return;
    }
    if (!file) { setError(t.panel.payErrNoReceipt); return; }
    if (askTaxPhone && !UZ_PHONE_RE.test(fullPhone)) {
      setError(t.panel.payErrPhone);
      return;
    }
    setStatus("loading");
    setError("");
    try {
      const fd = new FormData();
      Object.entries(idPayload).forEach(([k, v]) => fd.append(k, v));
      if (partialActive && partialUzs > 0) fd.append("partialUzs", String(partialUzs));
      if (askTaxPhone) fd.append("taxPhone", fullPhone);
      fd.append("receipt", file);
      const res = await fetch(endpoint, { method: "POST", body: fd });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || t.common.error);
      setStatus("done");
      router.refresh();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : t.common.error);
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
          <p className="text-sm font-semibold text-emerald-800">{t.panel.paySent}</p>
          <p className="text-xs text-emerald-600">{t.panel.paySentSub}</p>
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
        <p className="text-xs text-slate-300">{label}</p>

        {/* Hisob-kitob: narx → chegirma → hamyon → to'lash */}
        {showBreakdown && (
          <div className="mt-2 mb-2.5 rounded-xl bg-white/10 p-2.5 text-xs flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">{t.panel.payServicePrice}</span>
              <span className="font-medium text-slate-100">{(grossUzs ?? 0).toLocaleString("en-US")} {t.common.sum}</span>
            </div>
            {discountUzs > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-emerald-300">{t.panel.payDiscount(discountPercent)}</span>
                <span className="font-semibold text-emerald-300">−{discountUzs.toLocaleString("en-US")} {t.common.sum}</span>
              </div>
            )}
            {walletApplied > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-emerald-300">{t.panel.payFromWallet}</span>
                <span className="font-semibold text-emerald-300">−{walletApplied.toLocaleString("en-US")} {t.common.sum}</span>
              </div>
            )}
          </div>
        )}

        {/* Avval to'langan qism (qisman to'lovlardan) */}
        {paidUzs > 0 && (
          <div className="mb-2 flex items-center justify-between rounded-xl bg-emerald-500/15 px-2.5 py-1.5 text-xs">
            <span className="text-emerald-200">✓ {t.panel.payAlreadyPaid}</span>
            <span className="font-semibold text-emerald-200">{paidUzs.toLocaleString("en-US")} {t.common.sum}</span>
          </div>
        )}

        <p className="text-[11px] text-slate-400">{t.panel.payToPay}</p>
        <p className="text-3xl font-bold tracking-tight">
          {payAmount != null ? `${payAmount.toLocaleString("en-US")} ${t.common.sum}` : `$${usd}`}
        </p>
        <p className="text-xs text-slate-300 mt-0.5">
          {partialActive && rate && payAmount != null ? (
            t.panel.payPartialSummary(Math.round((coverUzs ?? 0) / rate), usd)
          ) : (
            <>
              ${usd}
              {rate ? t.panel.payRate(rate.toLocaleString("en-US")) : ""}
            </>
          )}
        </p>

        {/* Qisman to'lash */}
        {allowPartial && uzs != null && (
          <div className="mt-3 pt-3 border-t border-white/10">
            {!partialOn ? (
              <button
                onClick={() => { setPartialOn(true); setError(""); }}
                className="text-xs font-medium text-slate-300 hover:text-white underline underline-offset-2"
              >
                {t.panel.payPartialLink}
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-white">{t.panel.payPartialTitle}</p>
                  <button
                    onClick={() => { setPartialOn(false); setPartialRaw(""); setError(""); }}
                    className="text-[11px] text-slate-400 hover:text-white"
                  >
                    {t.common.cancel}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    value={groupUzs(partialRaw)}
                    onChange={(e) => {
                      const d = e.target.value.replace(/\D/g, "").slice(0, 12);
                      setPartialRaw(d);
                      setError("");
                    }}
                    placeholder="0"
                    className="w-full h-11 rounded-xl bg-white/10 border border-white/20 pl-3 pr-16 text-lg font-bold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-white/40"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{t.common.sum}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">{t.panel.payPartialRemaining(uzs.toLocaleString("en-US"))}</span>
                  {partialUzs > 0 && (
                    <span className={leftAfterUzs > 0 ? "text-amber-300 font-medium" : "text-emerald-300 font-medium"}>
                      {leftAfterUzs > 0
                        ? t.panel.payPartialLeftAfter(leftAfterUzs.toLocaleString("en-US"))
                        : t.panel.payPartialCovers}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* 1. Kartaga o'tkazing */}
        <div className="flex gap-2.5">
          {step(1)}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 mb-1.5">{t.panel.payStep1}</p>
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
                  {copied ? "✓" : t.panel.payCopy}
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-500">{t.panel.payNoCard}</p>
            )}
          </div>
        </div>

        {/* 2. Telefon (soliq cheki) */}
        {askTaxPhone && (
          <div className="flex gap-2.5">
            {step(2)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800">{t.panel.payPhone}</p>
              <p className="text-[11px] text-slate-400 mb-1.5">{t.panel.payPhoneHint}</p>
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
            <p className="text-sm font-medium text-slate-800 mb-1.5">{t.panel.payUploadReceipt}</p>
            {preview ? (
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 ring-1 ring-slate-200 p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="chek" className="w-16 h-16 rounded-lg object-cover ring-1 ring-slate-200" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-emerald-600">{t.panel.payImageSelected}</p>
                  <button onClick={() => onPick(null)} className="text-xs text-red-600 hover:underline mt-0.5">
                    {t.panel.payRemove}
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-1.5 h-24 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 text-slate-500 cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs font-medium">{t.panel.payPickImage}</span>
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
          {status === "loading" ? t.panel.paySending : t.panel.paySubmit}
        </button>
      </div>
    </div>
  );
}
