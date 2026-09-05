"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AppView } from "@/lib/firestore/apps";
import { appShort, formatDate } from "@/lib/labels";
import { daysUntil, periodName, RECURRING_STATUS_BADGE, RECURRING_STATUS_LABEL, type RecurringStatus } from "@/lib/billing";
import {
  actCancelRecurring,
  actResumeRecurring,
  actCreateRecurringInvoiceNow,
  actUpdateRecurringPlan,
} from "@/app/admin/actions";

type FilterKey = "all" | "active" | "past_due" | "pending" | "cancelled";

const FILTER_LABEL: Record<FilterKey, string> = {
  all: "Barchasi",
  active: "Faol",
  past_due: "Qarzdor",
  pending: "Kutilmoqda",
  cancelled: "Bekor qilingan",
};

const field = "h-9 w-full rounded-lg border border-slate-200 px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30";

function PlanEditor({ app, onDone }: { app: AppView; onDone: () => void }) {
  const rec = app.billing!.recurring!;
  const router = useRouter();
  const [pending, start] = useTransition();
  const [amount, setAmount] = useState(String(rec.amountUsd));
  const [months, setMonths] = useState(String(rec.periodMonths));
  const [grace, setGrace] = useState(String(rec.graceDays));
  const [next, setNext] = useState(rec.nextChargeAt ? rec.nextChargeAt.slice(0, 10) : "");
  const [err, setErr] = useState("");

  function save() {
    setErr("");
    start(async () => {
      const r = await actUpdateRecurringPlan(app.id, {
        amountUsd: parseFloat(amount) || 0,
        periodMonths: parseInt(months) || 1,
        graceDays: parseInt(grace) || 0,
        nextChargeAt: next || undefined,
      });
      if (r.ok) {
        onDone();
        router.refresh();
      } else setErr(r.error || "Xatolik");
    });
  }

  return (
    <div className="mt-3 rounded-lg bg-slate-50 p-3 grid sm:grid-cols-4 gap-2 items-end">
      <label className="flex flex-col gap-1">
        <span className="text-[11px] text-slate-500">Summa ($)</span>
        <input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} className={field} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[11px] text-slate-500">Davr (oy)</span>
        <input type="number" min={1} value={months} onChange={(e) => setMonths(e.target.value)} className={field} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[11px] text-slate-500">Muhlat (kun)</span>
        <input type="number" min={0} value={grace} onChange={(e) => setGrace(e.target.value)} className={field} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[11px] text-slate-500">Keyingi hisob</span>
        <input type="date" value={next} onChange={(e) => setNext(e.target.value)} className={field} />
      </label>
      <div className="sm:col-span-4 flex items-center gap-2">
        <button onClick={save} disabled={pending} className="h-8 px-3 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50">
          {pending ? "Saqlanmoqda…" : "Saqlash"}
        </button>
        <button onClick={onDone} className="h-8 px-3 rounded-lg bg-white ring-1 ring-slate-200 text-xs font-medium text-slate-600">
          Yopish
        </button>
        {err && <span className="text-xs text-red-600">{err}</span>}
      </div>
    </div>
  );
}

// Davriy (oylik) to'lovli xizmatlar — admin boshqaruvi.
// MUHIM: xizmat holati avtomatik o'zgarmaydi; to'xtatish qarori har doim adminda.
export function RecurringPanel({ apps }: { apps: AppView[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [editing, setEditing] = useState("");
  const [msg, setMsg] = useState<{ id: string; ok: boolean; text: string } | null>(null);

  const items = useMemo(() => apps.filter((a) => a.billing?.recurring), [apps]);

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = { all: items.length, active: 0, past_due: 0, pending: 0, cancelled: 0 };
    for (const a of items) {
      const s = a.billing!.recurring!.status as RecurringStatus;
      if (s in c) c[s as FilterKey]++;
    }
    return c;
  }, [items]);

  const visible = filter === "all" ? items : items.filter((a) => a.billing!.recurring!.status === filter);

  // MRR — faol obunalardan oylik daromad
  const mrr = items
    .filter((a) => a.billing!.recurring!.active && a.billing!.recurring!.status !== "cancelled")
    .reduce((s, a) => s + a.billing!.recurring!.amountUsd / a.billing!.recurring!.periodMonths, 0);

  function run(id: string, fn: () => Promise<{ ok: boolean; error?: string }>, okText: string) {
    setMsg(null);
    start(async () => {
      const r = await fn();
      setMsg({ id, ok: r.ok, text: r.ok ? okText : r.error || "Xatolik" });
      if (r.ok) router.refresh();
      setTimeout(() => setMsg(null), 3000);
    });
  }

  if (!items.length) {
    return (
      <p className="text-sm text-slate-400 py-10 text-center">
        Davriy to&apos;lovli xizmat yo&apos;q. Foydalanuvchi sahifasidan maxsus xizmat biriktiring.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 overflow-x-auto">
          {(Object.keys(FILTER_LABEL) as FilterKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filter === k ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {k === "past_due" && counts.past_due > 0 && filter !== k && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
              {FILTER_LABEL[k]}
              <span className={filter === k ? "text-white/70" : "text-slate-400"}>{counts[k]}</span>
            </button>
          ))}
        </div>
        <div className="rounded-lg bg-purple-50 ring-1 ring-purple-100 px-3 py-1.5">
          <span className="text-[11px] text-purple-600">Oylik takrorlanuvchi daromad (MRR)</span>
          <p className="text-sm font-bold text-purple-800">${Math.round(mrr).toLocaleString("en-US")}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {visible.map((a) => {
          const rec = a.billing!.recurring!;
          const left = daysUntil(rec.nextChargeAt);
          const overdue = typeof left === "number" && left < 0;
          return (
            <div key={a.id} className="rounded-xl border border-slate-200 bg-white p-3.5">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/admin/app/${a.id}`} className="font-semibold text-slate-900 text-sm hover:text-blue-600 truncate">
                      {a.appName || appShort(a)}
                    </Link>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ring-1 ${RECURRING_STATUS_BADGE[rec.status]}`}>
                      {RECURRING_STATUS_LABEL[rec.status]}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {a.contact?.fullName || a.ownerEmail || "—"} · ${rec.amountUsd}/{periodName(rec.periodMonths)}
                    {rec.paidCount > 0 && ` · to'langan: ${rec.paidCount}`}
                  </p>
                  <p className={`text-xs mt-0.5 ${overdue ? "text-red-600 font-medium" : "text-slate-400"}`}>
                    {rec.status === "pending"
                      ? "Ish topshirilgach boshlanadi"
                      : rec.nextChargeAt
                        ? overdue
                          ? `${Math.abs(left as number)} kun kechikdi (${formatDate(rec.nextChargeAt)})`
                          : `Keyingi hisob: ${formatDate(rec.nextChargeAt)}`
                        : "—"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 justify-end flex-shrink-0">
                  <button
                    onClick={() => run(a.id, () => actCreateRecurringInvoiceNow(a.id), "Hisob-faktura yaratildi")}
                    disabled={pending || rec.status === "cancelled"}
                    className="h-8 px-2.5 rounded-lg bg-slate-100 text-xs font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-40"
                  >
                    Hisob chiqarish
                  </button>
                  <button
                    onClick={() => setEditing(editing === a.id ? "" : a.id)}
                    className="h-8 px-2.5 rounded-lg bg-slate-100 text-xs font-medium text-slate-700 hover:bg-slate-200"
                  >
                    Shartlar
                  </button>
                  {rec.status === "cancelled" || !rec.active ? (
                    <button
                      onClick={() => run(a.id, () => actResumeRecurring(a.id), "Faollashtirildi")}
                      disabled={pending}
                      className="h-8 px-2.5 rounded-lg bg-emerald-50 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-40"
                    >
                      Faollashtirish
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (confirm("Davriy to'lovni bekor qilasizmi? Yangi hisob-fakturalar chiqmaydi.")) {
                          run(a.id, () => actCancelRecurring(a.id), "Bekor qilindi");
                        }
                      }}
                      disabled={pending}
                      className="h-8 px-2.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 disabled:opacity-40"
                    >
                      To&apos;xtatish
                    </button>
                  )}
                </div>
              </div>
              {msg?.id === a.id && (
                <p className={`text-xs mt-2 ${msg.ok ? "text-emerald-600" : "text-red-600"}`}>{msg.ok ? "✓ " : "❌ "}{msg.text}</p>
              )}
              {editing === a.id && <PlanEditor app={a} onDone={() => setEditing("")} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
