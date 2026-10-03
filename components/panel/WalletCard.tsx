"use client";

import { useState } from "react";
import { useT } from "@/components/i18n/LanguageProvider";
import { Rich } from "@/components/i18n/Rich";

export function WalletCard({ balanceUzs }: { balanceUzs: number }) {
  const t = useT();
  const [info, setInfo] = useState(false);

  return (
    <div className="rounded-2xl ring-1 ring-emerald-200/70 bg-gradient-to-r from-emerald-50 to-teal-50 shadow-sm shadow-emerald-100/60 px-4 py-3.5">
      <div className="flex items-center gap-3.5">
        <span className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-xl flex-shrink-0">🪙</span>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-emerald-700">{t.panel.walletTitle}</p>
          <p className="text-lg font-bold text-emerald-800 leading-tight">
            {balanceUzs.toLocaleString("en-US")} <span className="text-sm font-semibold">{t.common.sum}</span>
          </p>
        </div>
        <button
          onClick={() => setInfo((v) => !v)}
          aria-label={t.panel.walletAria}
          className="flex-shrink-0 w-8 h-8 rounded-full bg-white/70 ring-1 ring-emerald-200 text-emerald-700 flex items-center justify-center hover:bg-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      {info && (
        <div className="mt-3 pt-3 border-t border-emerald-200/60 text-xs text-emerald-800 leading-relaxed animate-slide-down">
          <p className="font-semibold mb-1">{t.panel.walletHowTitle}</p>
          <p><Rich text={t.panel.walletHow1} /></p>
          <p className="mt-1.5"><Rich text={t.panel.walletHow2} /></p>
        </div>
      )}
    </div>
  );
}
