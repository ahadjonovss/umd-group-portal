"use client";

import { useState } from "react";
import Link from "next/link";

const SERVICES = [
  { href: "/submit/play-market", label: "Play Market", sub: "Joylashtirish", color: "bg-emerald-500" },
  { href: "/submit/app-store", label: "App Store", sub: "Joylashtirish", color: "bg-blue-500" },
  { href: "/submit/google-transfer", label: "Google Play", sub: "Transfer", color: "bg-orange-500" },
  { href: "/submit/apple-transfer", label: "Apple App Store", sub: "Transfer", color: "bg-purple-500" },
  { href: "/submit/account", label: "Developer akkaunt", sub: "Ochish", color: "bg-teal-500" },
];

export function NewRequestButton() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition-colors shadow-sm"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4v16m8-8H4" />
        </svg>
        Yangi ariza
        <svg className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-30 w-64 rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 p-1.5 animate-slide-down origin-top-right">
            <p className="px-3 pt-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Xizmatni tanlang</p>
            {SERVICES.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
              >
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${s.color}`} />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-slate-800 truncate">{s.label}</span>
                  <span className="block text-xs text-slate-400">{s.sub}</span>
                </span>
                <svg className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
