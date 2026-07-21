"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AdminUser } from "@/lib/firestore/users";
import type { DiscountView } from "@/lib/firestore/discounts";
import { DISCOUNT_SERVICE_LABEL, type DiscountService } from "@/lib/discount";
import { formatDate } from "@/lib/labels";
import { actCreateDiscount, actDeleteDiscount } from "@/app/admin/actions";

const SERVICES: DiscountService[] = ["publish", "account", "transfer", "update", "renewal"];

const STATUS_STYLE: Record<DiscountView["status"], string> = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  used: "bg-slate-100 text-slate-500 ring-slate-200",
  expired: "bg-red-50 text-red-600 ring-red-200",
};
const STATUS_LABEL: Record<DiscountView["status"], string> = {
  active: "Faol",
  used: "Ishlatilgan",
  expired: "Muddati o'tgan",
};

export function DiscountsPanel({ users, discounts }: { users: AdminUser[]; discounts: DiscountView[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [uid, setUid] = useState("");
  const [service, setService] = useState<DiscountService>("publish");
  const [percent, setPercent] = useState("20");
  const [days, setDays] = useState("30");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const field = "h-10 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500";

  function submit() {
    const u = users.find((x) => x.uid === uid);
    setMsg(null);
    start(async () => {
      const r = await actCreateDiscount({
        ownerUid: uid,
        ownerEmail: u?.email ?? null,
        ownerName: u?.fullName ?? null,
        service,
        percent: parseInt(percent, 10) || 0,
        daysValid: parseInt(days, 10) || 0,
      });
      if (r.ok) {
        setMsg({ ok: true, text: "Chegirma berildi" });
        setUid("");
        router.refresh();
      } else {
        setMsg({ ok: false, text: r.error || "Xatolik" });
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Yaratish formasi */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
        <h3 className="font-semibold text-slate-900 text-sm mb-3">Yangi chegirma berish</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Foydalanuvchi</label>
            <select value={uid} onChange={(e) => setUid(e.target.value)} className={field}>
              <option value="">— tanlang —</option>
              {users.map((u) => (
                <option key={u.uid} value={u.uid}>
                  {u.fullName || u.email} {u.email ? `(${u.email})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Servis</label>
            <select value={service} onChange={(e) => setService(e.target.value as DiscountService)} className={field}>
              {SERVICES.map((s) => (
                <option key={s} value={s}>{DISCOUNT_SERVICE_LABEL[s]}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Chegirma (%)</label>
            <input type="number" min={1} max={100} value={percent} onChange={(e) => setPercent(e.target.value)} className={field} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Amal muddati (kun)</label>
            <input type="number" min={1} value={days} onChange={(e) => setDays(e.target.value)} className={field} />
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button
            disabled={pending || !uid}
            onClick={submit}
            className="h-9 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {pending ? "Berilmoqda…" : "Chegirma berish"}
          </button>
          {msg && <span className={`text-xs ${msg.ok ? "text-emerald-600" : "text-red-600"}`}>{msg.ok ? "✓ " : "❌ "}{msg.text}</span>}
        </div>
      </div>

      {/* Ro'yxat */}
      {discounts.length ? (
        <div className="flex flex-col gap-2">
          {discounts.map((d) => (
            <div key={d.id} className="bg-white rounded-xl border border-slate-200/80 p-3.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {d.ownerName || d.ownerEmail || d.ownerUid}
                  <span className="text-slate-400 font-normal"> · {DISCOUNT_SERVICE_LABEL[d.service]}</span>
                </p>
                <p className="text-xs text-slate-500">
                  <strong className="text-blue-600">−{d.percent}%</strong>
                  {" · "}Muddat: {formatDate(d.expiresAt)}
                  {d.boundAppId ? " · biriktirilgan" : ""}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 ${STATUS_STYLE[d.status]}`}>
                  {STATUS_LABEL[d.status]}
                </span>
                <button
                  disabled={pending}
                  onClick={() => { if (confirm("Chegirmani o'chirasizmi?")) start(async () => { await actDeleteDiscount(d.id); router.refresh(); }); }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
                  title="O'chirish"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400 py-6 text-center">Chegirmalar yo&apos;q.</p>
      )}
    </div>
  );
}
