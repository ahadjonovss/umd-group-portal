"use client";

import { useState } from "react";

export function WalletCard({ balanceUzs }: { balanceUzs: number }) {
  const [info, setInfo] = useState(false);

  return (
    <div className="rounded-2xl ring-1 ring-emerald-200/70 bg-gradient-to-r from-emerald-50 to-teal-50 shadow-sm shadow-emerald-100/60 px-4 py-3.5">
      <div className="flex items-center gap-3.5">
        <span className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-xl flex-shrink-0">🪙</span>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-emerald-700">Mening hamyonim</p>
          <p className="text-lg font-bold text-emerald-800 leading-tight">
            {balanceUzs.toLocaleString("en-US")} <span className="text-sm font-semibold">so&apos;m</span>
          </p>
        </div>
        <button
          onClick={() => setInfo((v) => !v)}
          aria-label="Hamyon haqida"
          className="flex-shrink-0 w-8 h-8 rounded-full bg-white/70 ring-1 ring-emerald-200 text-emerald-700 flex items-center justify-center hover:bg-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      {info && (
        <div className="mt-3 pt-3 border-t border-emerald-200/60 text-xs text-emerald-800 leading-relaxed animate-slide-down">
          <p className="font-semibold mb-1">Hamyon qanday to&apos;ladi?</p>
          <p>
            To&apos;lov qilganingizda ba&apos;zan summa dan <span className="font-semibold">ortiqroq</span> o&apos;tkazasiz.
            Masalan to&apos;lov <span className="font-semibold">12,300 so&apos;m</span> bo&apos;lса va siz{" "}
            <span className="font-semibold">13,000 so&apos;m</span> yuborsangiz — ortiqcha{" "}
            <span className="font-semibold">700 so&apos;m</span> hamyoningizga tushadi.
          </p>
          <p className="mt-1.5">
            Hamyondagi pul <span className="font-semibold">keyingi to&apos;lovingizdan avtomatik ayiriladi</span> — ya&apos;ni kamroq
            to&apos;laysiz. Pulingiz yo&apos;qolmaydi.
          </p>
        </div>
      )}
    </div>
  );
}
