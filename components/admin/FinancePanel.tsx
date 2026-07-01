"use client";

import { useMemo } from "react";
import type { PaymentView } from "@/lib/firestore/payments";
import { SERVICE_LABELS, PLATFORM_LABEL, platformOf, type Platform } from "@/lib/labels";
import type { ServiceType } from "@/types";

const KIND_LABEL: Record<PaymentView["kind"], string> = {
  advance: "Avans",
  final: "Yakuniy",
  transfer: "Transfer",
  update: "Update",
  renewal: "Obuna uzaytirish",
};

const KIND_COLOR: Record<PaymentView["kind"], string> = {
  advance: "bg-amber-400",
  final: "bg-emerald-400",
  transfer: "bg-violet-400",
  update: "bg-blue-400",
  renewal: "bg-teal-400",
};

const UZ_MONTHS = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];

function usd(n: number) {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

function StatCard({ label, value, sub, tone = "slate" }: { label: string; value: string; sub?: string; tone?: "slate" | "emerald" | "amber" }) {
  const toneCls =
    tone === "emerald" ? "text-emerald-600" : tone === "amber" ? "text-amber-600" : "text-slate-900";
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${toneCls}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function BarRow({ label, value, total, count, color }: { label: string; value: number; total: number; count: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-slate-700">{label} <span className="text-slate-400 text-xs">· {count} ta</span></span>
        <span className="font-semibold text-slate-900">{usd(value)} <span className="text-slate-400 font-normal text-xs">{pct}%</span></span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function FinancePanel({ payments }: { payments: PaymentView[] }) {
  const stats = useMemo(() => {
    const confirmed = payments.filter((p) => p.status === "confirmed");
    const pending = payments.filter((p) => p.status === "pending");

    const totalUsd = confirmed.reduce((s, p) => s + p.amountUsd, 0);
    const totalUzs = confirmed.reduce((s, p) => s + (p.amountUzs ?? 0), 0);
    const pendingUsd = pending.reduce((s, p) => s + p.amountUsd, 0);

    // Servislar bo'yicha
    const svcMap = new Map<ServiceType, { usd: number; count: number }>();
    for (const p of confirmed) {
      const cur = svcMap.get(p.serviceType) ?? { usd: 0, count: 0 };
      cur.usd += p.amountUsd;
      cur.count += 1;
      svcMap.set(p.serviceType, cur);
    }
    const byService = Array.from(svcMap.entries())
      .map(([svc, v]) => ({ key: svc, label: SERVICE_LABELS[svc], ...v }))
      .sort((a, b) => b.usd - a.usd);

    // Platforma bo'yicha (Android / iOS)
    const platMap = new Map<Platform, { usd: number; count: number }>();
    for (const p of confirmed) {
      const plat = platformOf(p.serviceType);
      const cur = platMap.get(plat) ?? { usd: 0, count: 0 };
      cur.usd += p.amountUsd;
      cur.count += 1;
      platMap.set(plat, cur);
    }
    const byPlatform = (["android", "ios"] as Platform[])
      .map((plat) => ({ key: plat, label: PLATFORM_LABEL[plat], ...(platMap.get(plat) ?? { usd: 0, count: 0 }) }))
      .filter((x) => x.count > 0);

    // To'lov turlari bo'yicha
    const kindMap = new Map<PaymentView["kind"], { usd: number; count: number }>();
    for (const p of confirmed) {
      const cur = kindMap.get(p.kind) ?? { usd: 0, count: 0 };
      cur.usd += p.amountUsd;
      cur.count += 1;
      kindMap.set(p.kind, cur);
    }
    const byKind = Array.from(kindMap.entries())
      .map(([kind, v]) => ({ key: kind, ...v }))
      .sort((a, b) => b.usd - a.usd);

    // Oylar bo'yicha (yangi -> eski)
    const monthMap = new Map<string, { usd: number; count: number }>();
    for (const p of confirmed) {
      if (!p.createdAt) continue;
      const key = p.createdAt.slice(0, 7); // YYYY-MM
      const cur = monthMap.get(key) ?? { usd: 0, count: 0 };
      cur.usd += p.amountUsd;
      cur.count += 1;
      monthMap.set(key, cur);
    }
    const byMonth = Array.from(monthMap.entries())
      .map(([key, v]) => {
        const [y, m] = key.split("-");
        return { key, label: `${UZ_MONTHS[parseInt(m, 10) - 1]} ${y}`, ...v };
      })
      .sort((a, b) => b.key.localeCompare(a.key));

    return { totalUsd, totalUzs, pendingUsd, confirmedCount: confirmed.length, pendingCount: pending.length, byService, byPlatform, byKind, byMonth };
  }, [payments]);

  const maxMonth = Math.max(1, ...stats.byMonth.map((m) => m.usd));

  if (!payments.length) {
    return <p className="text-sm text-slate-400 py-10 text-center">Hali to&apos;lovlar yo&apos;q.</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Umumiy ko'rsatkichlar */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard
          label="Jami daromad (tasdiqlangan)"
          value={usd(stats.totalUsd)}
          sub={stats.totalUzs ? `~${stats.totalUzs.toLocaleString("en-US")} so'm` : undefined}
          tone="emerald"
        />
        <StatCard label="Kutilayotgan to'lov" value={usd(stats.pendingUsd)} sub={`${stats.pendingCount} ta to'lov`} tone="amber" />
        <StatCard label="Tasdiqlangan to'lovlar" value={`${stats.confirmedCount} ta`} sub={`Jami ${payments.length} ta yozuv`} />
      </div>

      {/* Servislar bo'yicha */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
        <h3 className="font-semibold text-slate-900 text-sm mb-4">Servislar bo&apos;yicha daromad</h3>
        {stats.byService.length ? (
          <div className="flex flex-col gap-3">
            {stats.byService.map((s) => (
              <BarRow key={s.key} label={s.label} value={s.usd} total={stats.totalUsd} count={s.count} color="bg-blue-500" />
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">Ma&apos;lumot yo&apos;q.</p>
        )}
      </div>

      {/* Platforma bo'yicha (Android / iOS) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
        <h3 className="font-semibold text-slate-900 text-sm mb-4">Platforma bo&apos;yicha daromad</h3>
        {stats.byPlatform.length ? (
          <div className="flex flex-col gap-3">
            {stats.byPlatform.map((p) => (
              <BarRow
                key={p.key}
                label={p.label}
                value={p.usd}
                total={stats.totalUsd}
                count={p.count}
                color={p.key === "ios" ? "bg-slate-700" : "bg-green-500"}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">Ma&apos;lumot yo&apos;q.</p>
        )}
      </div>

      {/* To'lov turlari bo'yicha */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
        <h3 className="font-semibold text-slate-900 text-sm mb-4">To&apos;lov turlari bo&apos;yicha</h3>
        {stats.byKind.length ? (
          <div className="flex flex-col gap-3">
            {stats.byKind.map((k) => (
              <BarRow key={k.key} label={KIND_LABEL[k.key]} value={k.usd} total={stats.totalUsd} count={k.count} color={KIND_COLOR[k.key]} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">Ma&apos;lumot yo&apos;q.</p>
        )}
      </div>

      {/* Oylar bo'yicha */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
        <h3 className="font-semibold text-slate-900 text-sm mb-4">Oylar bo&apos;yicha daromad</h3>
        {stats.byMonth.length ? (
          <div className="flex flex-col gap-3">
            {stats.byMonth.map((m) => {
              const pct = Math.round((m.usd / maxMonth) * 100);
              return (
                <div key={m.key}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-700">{m.label} <span className="text-slate-400 text-xs">· {m.count} ta</span></span>
                    <span className="font-semibold text-slate-900">{usd(m.usd)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-400">Ma&apos;lumot yo&apos;q.</p>
        )}
      </div>
    </div>
  );
}
