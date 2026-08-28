"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AppView } from "@/lib/firestore/apps";
import { getInstallment, appInstallmentKeys, isPayable } from "@/lib/payment-state";
import { actMarkInstallmentPaidManually } from "@/app/admin/actions";

const LABEL: Record<"advance" | "final", string> = { advance: "Avans", final: "Yakuniy" };

// Mijoz boshqa yo'l bilan (naqd va h.k.) to'lagan, lekin tizimga chek yuklamagan hollarda —
// admin to'lovni chek talab qilmasdan qo'lda yopadi.
export function ManualCloseInstallment({ app }: { app: AppView }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const keys = appInstallmentKeys(app.serviceType).filter(
    (k): k is "advance" | "final" => k === "advance" || k === "final"
  );
  const due = keys.filter((k) => isPayable(getInstallment(app.payment, k)));

  if (!due.length) return null;

  function close(kind: "advance" | "final") {
    if (!confirm(`${LABEL[kind]} to'lovni chek talab qilmasdan qo'lda yopasizmi? Bu qaytarib bo'lmaydi.`)) return;
    setMsg(null);
    start(async () => {
      const r = await actMarkInstallmentPaidManually(app.id, kind);
      if (r.ok) {
        setMsg({ ok: true, text: `${LABEL[kind]} yopildi` });
        router.refresh();
      } else {
        setMsg({ ok: false, text: r.error || "Xatolik" });
      }
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
      <h3 className="font-semibold text-slate-900 text-sm mb-1">To&apos;lovni qo&apos;lda yopish</h3>
      <p className="text-xs text-slate-500 mb-3">Mijoz boshqa yo&apos;l bilan (naqd va h.k.) to&apos;lagan bo&apos;lsa, chek talab qilmasdan shu yerdan yopish mumkin.</p>
      <div className="flex flex-wrap items-center gap-2">
        {due.map((kind) => (
          <button
            key={kind}
            disabled={pending}
            onClick={() => close(kind)}
            className="h-9 px-4 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-50"
          >
            {pending ? "Yopilmoqda…" : `${LABEL[kind]}ni qo'lda yopish`}
          </button>
        ))}
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
