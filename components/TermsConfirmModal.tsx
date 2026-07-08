"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import type { Pricing } from "@/lib/firestore/settings";
import { TermsContent, type TermsService } from "@/components/TermsContent";

// So'rov yuborishdan oldin shartlarni ko'rsatib, tasdiqlatuvchi modal.
export function TermsConfirmModal({
  service,
  pricing,
  submitting,
  onConfirm,
  onClose,
}: {
  service: TermsService;
  pricing: Pricing;
  submitting?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [agreed, setAgreed] = useState(false);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-xl flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Foydalanish shartlari</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Shartlar (scroll) */}
        <div className="overflow-y-auto px-5 py-4 space-y-6">
          <TermsContent service={service} pricing={pricing} />
        </div>

        {/* Tasdiq */}
        <div className="border-t border-slate-100 px-5 py-4 flex flex-col gap-3">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/40"
            />
            <span className="text-sm text-slate-700">
              Yuqoridagi foydalanish shartlarini <strong>to&apos;liq o&apos;qib chiqdim</strong> va roziman.
            </span>
          </label>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="h-11 px-4 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200"
            >
              Bekor
            </button>
            <button
              disabled={!agreed || submitting}
              onClick={onConfirm}
              className="flex-1 h-11 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Yuborilmoqda…" : "O'qidim, so'rovni yuborish"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
