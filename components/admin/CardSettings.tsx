"use client";

import { useState, useTransition } from "react";
import type { PaymentInfo } from "@/lib/firestore/settings";
import { actSavePayment } from "@/app/admin/actions";

export function CardSettings({ payment }: { payment: PaymentInfo }) {
  const [cardNumber, setCardNumber] = useState(payment.cardNumber);
  const [cardHolder, setCardHolder] = useState(payment.cardHolder);
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 max-w-xl">
      <h3 className="font-semibold text-slate-900 mb-1">To&apos;lov kartasi</h3>
      <p className="text-xs text-slate-400 mb-4">
        Mijozlar avans to&apos;lovini shu kartaga yuboradi (to&apos;lov ko&apos;rinishida ko&apos;rinadi).
      </p>

      <div className="flex flex-col gap-3">
        <div>
          <label className="text-xs text-slate-500">Karta raqami</label>
          <input
            value={cardNumber}
            onChange={(e) => { setCardNumber(e.target.value); setSaved(false); }}
            placeholder="8600 0000 0000 0000"
            className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500">Karta egasi</label>
          <input
            value={cardHolder}
            onChange={(e) => { setCardHolder(e.target.value); setSaved(false); }}
            placeholder="SARDOR ABDULLAYEV"
            className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 mt-4">
        <button
          disabled={pending}
          onClick={() => start(async () => { await actSavePayment({ cardNumber, cardHolder }); setSaved(true); })}
          className="h-9 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "Saqlanmoqda…" : "Saqlash"}
        </button>
        {saved && !pending && <span className="text-sm text-emerald-600">✓ Saqlandi</span>}
      </div>
    </div>
  );
}
