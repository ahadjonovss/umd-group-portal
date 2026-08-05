"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AppView } from "@/lib/firestore/apps";
import { actCreateCustomInvoice } from "@/app/admin/actions";

export function CustomInvoiceForm({ app }: { app: AppView }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const field = "h-10 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500";

  function submit() {
    setMsg(null);
    start(async () => {
      const r = await actCreateCustomInvoice({
        appId: app.id,
        ownerUid: app.ownerUid,
        ownerName: app.contact?.fullName || "",
        ownerPhone: app.contact?.phone || "",
        title,
        amountUsd: parseFloat(amount) || 0,
      });
      if (r.ok) {
        setMsg({ ok: true, text: "Hisob-faktura yaratildi" });
        setTitle("");
        setAmount("");
        router.refresh();
      } else {
        setMsg({ ok: false, text: r.error || "Xatolik" });
      }
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
      <h3 className="font-semibold text-slate-900 text-sm mb-3">Qo&apos;shimcha hisob-faktura yaratish</h3>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Nomi</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="masalan: Domen narxi"
            className={field}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Narx ($)</label>
          <input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="masalan: 50"
            className={field}
          />
        </div>
      </div>
      <div className="flex items-center gap-3 mt-4">
        <button
          disabled={pending || !title.trim() || !amount}
          onClick={submit}
          className="h-9 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "Yaratilmoqda…" : "Hisob-faktura yaratish"}
        </button>
        {msg && (
          <span className={`text-xs ${msg.ok ? "text-emerald-600" : "text-red-600"}`}>
            {msg.ok ? "✓ " : "❌ "}
            {msg.text}
          </span>
        )}
      </div>
    </div>
  );
}
