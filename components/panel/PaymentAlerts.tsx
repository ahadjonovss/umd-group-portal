"use client";

import { useState } from "react";
import Link from "next/link";

export interface PaymentAlertItem {
  appId: string;
  title: string;
  label: string; // Avans to'lovi / Yakuniy to'lov / Update to'lovi ...
  usd: number;
}

// Kabinet: to'lovi kutilayotgan barcha to'lovlar — yig'ilgan holda (jami son + summa),
// bosilganda har bir to'lov alohida qatorlar sifatida ochiladi.
export function PaymentAlerts({ items }: { items: PaymentAlertItem[] }) {
  const [open, setOpen] = useState(false);
  if (!items.length) return null;

  const total = items.reduce((s, i) => s + i.usd, 0);

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 rounded-2xl ring-1 ring-amber-200/70 bg-gradient-to-r from-amber-50 to-orange-50 shadow-sm shadow-amber-100/60 px-4 py-3.5 hover:ring-amber-300 transition-colors"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <span className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </span>
          <div className="min-w-0 text-left">
            <p className="text-sm font-bold text-slate-900">To&apos;lov kutilmoqda</p>
            <p className="text-xs text-amber-700">{items.length} ta to&apos;lov</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <span className="text-base font-bold text-slate-900">${total}</span>
          <svg
            className={`w-4 h-4 text-amber-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="flex flex-col gap-2 mt-2">
          {items.map((it, i) => (
            <Link
              key={`${it.appId}:${it.label}:${i}`}
              href={`/panel/app/${it.appId}`}
              className="group relative flex items-center gap-3.5 rounded-xl ring-1 ring-amber-200/60 bg-white px-4 py-3 hover:ring-amber-300 hover:bg-amber-50/40 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{it.title}</p>
                <p className="text-xs text-amber-700">{it.label} · to&apos;lash uchun bosing</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-sm font-bold text-slate-900">${it.usd}</span>
                <svg className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
