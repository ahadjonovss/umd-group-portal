"use client";

import { useMemo, useState } from "react";
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
  final: "bg-emerald-500",
  transfer: "bg-violet-500",
  update: "bg-blue-500",
  renewal: "bg-teal-500",
};

const SERVICE_COLOR: Record<ServiceType, string> = {
  "play-market": "bg-emerald-500",
  "app-store": "bg-blue-500",
  "google-transfer": "bg-orange-500",
  "apple-transfer": "bg-purple-500",
  account: "bg-rose-500",
};

const PLATFORM_COLOR: Record<Platform, string> = {
  android: "bg-green-500",
  ios: "bg-slate-700",
};

const UZ_MONTHS = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];
const UZ_MONTHS_SHORT = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"];

type Period = "month" | "lastMonth" | "year" | "all";
const PERIOD_LABEL: Record<Period, string> = {
  month: "Bu oy",
  lastMonth: "O'tgan oy",
  year: "Bu yil",
  all: "Barchasi",
};

function usd(n: number) {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}
function uzs(n: number) {
  return `${Math.round(n).toLocaleString("en-US")} so'm`;
}
function monthKeyOf(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

interface Seg {
  key: string;
  label: string;
  usd: number;
  uzs: number;
  count: number;
  color: string;
}

function aggregate<T extends string>(
  rows: PaymentView[],
  keyOf: (p: PaymentView) => T,
  labelOf: (k: T) => string,
  colorOf: (k: T) => string
): Seg[] {
  const map = new Map<T, { usd: number; uzs: number; count: number }>();
  for (const p of rows) {
    const k = keyOf(p);
    const cur = map.get(k) ?? { usd: 0, uzs: 0, count: 0 };
    cur.usd += p.amountUsd;
    cur.uzs += p.amountUzs ?? 0;
    cur.count += 1;
    map.set(k, cur);
  }
  return Array.from(map.entries())
    .map(([k, v]) => ({ key: k, label: labelOf(k), color: colorOf(k), ...v }))
    .sort((a, b) => b.usd - a.usd);
}

function Trend({ cur, prev }: { cur: number; prev: number }) {
  if (prev <= 0 && cur <= 0) return <span className="text-xs text-slate-400">— o&apos;zgarishsiz</span>;
  const pct = prev > 0 ? Math.round(((cur - prev) / prev) * 100) : 100;
  const up = pct >= 0;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${up ? "text-emerald-600" : "text-red-600"}`}>
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
          d={up ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}
        />
      </svg>
      {up ? "+" : ""}
      {pct}%
      <span className="text-slate-400 font-normal">o&apos;tgan davrga nisbatan</span>
    </span>
  );
}

function Distribution({ title, segs, total }: { title: string; segs: Seg[]; total: number }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
      <h3 className="font-semibold text-slate-900 text-sm mb-4">{title}</h3>
      {segs.length ? (
        <>
          <div className="flex h-3 rounded-full overflow-hidden bg-slate-100 mb-4">
            {segs.map((s) => {
              const pct = total > 0 ? (s.usd / total) * 100 : 0;
              return <div key={s.key} className={s.color} style={{ width: `${pct}%` }} title={`${s.label}: ${usd(s.usd)}`} />;
            })}
          </div>
          <div className="flex flex-col gap-2.5">
            {segs.map((s) => {
              const pct = total > 0 ? Math.round((s.usd / total) * 100) : 0;
              return (
                <div key={s.key} className="flex items-center gap-2.5 text-sm">
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${s.color}`} />
                  <span className="text-slate-700 flex-1 min-w-0 truncate">
                    {s.label} <span className="text-slate-400 text-xs">· {s.count} ta</span>
                  </span>
                  <span className="text-right">
                    <span className="font-semibold text-slate-900">{usd(s.usd)}</span>
                    <span className="text-slate-400 font-normal text-xs ml-1.5">{pct}%</span>
                    {s.uzs > 0 && <span className="block text-[11px] text-slate-400">{uzs(s.uzs)}</span>}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <p className="text-sm text-slate-400">Bu davrda ma&apos;lumot yo&apos;q.</p>
      )}
    </div>
  );
}

export function FinancePanel({ payments }: { payments: PaymentView[] }) {
  const [period, setPeriod] = useState<Period>("month");

  const data = useMemo(() => {
    const now = new Date();
    const curMonth = monthKeyOf(now);
    const prevMonth = monthKeyOf(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const prevPrevMonth = monthKeyOf(new Date(now.getFullYear(), now.getMonth() - 2, 1));
    const curYear = String(now.getFullYear());
    const prevYear = String(now.getFullYear() - 1);

    const confirmed = payments.filter((p) => p.status === "confirmed" && p.createdAt);
    const pending = payments.filter((p) => p.status === "pending");

    // Tanlangan davr + oldingi (taqqoslash uchun) predikatlari
    const inPeriod = (p: PaymentView, per: Period): boolean => {
      const mk = p.createdAt!.slice(0, 7);
      if (per === "month") return mk === curMonth;
      if (per === "lastMonth") return mk === prevMonth;
      if (per === "year") return p.createdAt!.slice(0, 4) === curYear;
      return true;
    };
    const inPrev = (p: PaymentView, per: Period): boolean => {
      const mk = p.createdAt!.slice(0, 7);
      if (per === "month") return mk === prevMonth;
      if (per === "lastMonth") return mk === prevPrevMonth;
      if (per === "year") return p.createdAt!.slice(0, 4) === prevYear;
      return false;
    };

    const rows = confirmed.filter((p) => inPeriod(p, period));
    const prevRows = confirmed.filter((p) => inPrev(p, period));

    const sumUsd = (arr: PaymentView[]) => arr.reduce((s, p) => s + p.amountUsd, 0);
    const sumUzs = (arr: PaymentView[]) => arr.reduce((s, p) => s + (p.amountUzs ?? 0), 0);

    const totalUsd = sumUsd(rows);
    const totalUzs = sumUzs(rows);
    const prevUsd = sumUsd(prevRows);
    const avgUsd = rows.length ? totalUsd / rows.length : 0;

    const byService = aggregate(rows, (p) => p.serviceType, (k) => SERVICE_LABELS[k], (k) => SERVICE_COLOR[k]);
    const byPlatform = aggregate(rows, (p) => platformOf(p.serviceType), (k) => PLATFORM_LABEL[k], (k) => PLATFORM_COLOR[k]);
    const byKind = aggregate(rows, (p) => p.kind, (k) => KIND_LABEL[k], (k) => KIND_COLOR[k]);
    const topService = byService[0] ?? null;

    // Oxirgi 12 oy timeline (davrdan mustaqil)
    const months12: { key: string; label: string; usd: number; count: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = monthKeyOf(dt);
      months12.push({ key, label: UZ_MONTHS_SHORT[dt.getMonth()], usd: 0, count: 0 });
    }
    const idx = new Map(months12.map((m, i) => [m.key, i]));
    for (const p of confirmed) {
      const i = idx.get(p.createdAt!.slice(0, 7));
      if (i !== undefined) {
        months12[i].usd += p.amountUsd;
        months12[i].count += 1;
      }
    }
    const maxMonth = Math.max(1, ...months12.map((m) => m.usd));

    return {
      totalUsd,
      totalUzs,
      prevUsd,
      avgUsd,
      count: rows.length,
      pendingUsd: sumUsd(pending),
      pendingCount: pending.length,
      byService,
      byPlatform,
      byKind,
      topService,
      months12,
      maxMonth,
      curMonthKey: curMonth,
    };
  }, [payments, period]);

  if (!payments.length) {
    return <p className="text-sm text-slate-400 py-10 text-center">Hali to&apos;lovlar yo&apos;q.</p>;
  }

  const showTrend = period !== "all";

  return (
    <div className="flex flex-col gap-5">
      {/* Davr tanlagich */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {(Object.keys(PERIOD_LABEL) as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              period === p ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {PERIOD_LABEL[p]}
          </button>
        ))}
      </div>

      {/* Hero daromad */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-700 rounded-2xl p-6 text-white">
        <p className="text-sm text-slate-300">{PERIOD_LABEL[period]} daromadi</p>
        <p className="text-4xl font-bold mt-1 tracking-tight">{usd(data.totalUsd)}</p>
        {data.totalUzs > 0 && <p className="text-sm text-slate-300 mt-1">~{uzs(data.totalUzs)}</p>}
        <div className="mt-3 flex items-center gap-3">
          {showTrend ? <Trend cur={data.totalUsd} prev={data.prevUsd} /> : <span className="text-xs text-slate-400">{data.count} ta to&apos;lov</span>}
        </div>
      </div>

      {/* KPI kartochkalar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4">
          <p className="text-xs text-slate-400">To&apos;lovlar soni</p>
          <p className="text-2xl font-bold mt-1 text-slate-900">{data.count} ta</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4">
          <p className="text-xs text-slate-400">O&apos;rtacha to&apos;lov</p>
          <p className="text-2xl font-bold mt-1 text-slate-900">{usd(data.avgUsd)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4">
          <p className="text-xs text-slate-400">Kutilayotgan</p>
          <p className="text-2xl font-bold mt-1 text-amber-600">{usd(data.pendingUsd)}</p>
          <p className="text-xs text-slate-400 mt-0.5">{data.pendingCount} ta to&apos;lov</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4">
          <p className="text-xs text-slate-400">Eng daromadli</p>
          <p className="text-base font-bold mt-1 text-slate-900 leading-tight">{data.topService ? data.topService.label : "—"}</p>
          {data.topService && <p className="text-xs text-emerald-600 font-semibold mt-0.5">{usd(data.topService.usd)}</p>}
        </div>
      </div>

      {/* Oylik timeline grafik */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
        <h3 className="font-semibold text-slate-900 text-sm mb-4">Oxirgi 12 oy daromadi</h3>
        <div className="flex items-end justify-between gap-1.5 h-44">
          {data.months12.map((m) => {
            const h = Math.round((m.usd / data.maxMonth) * 100);
            const isCur = m.key === data.curMonthKey;
            return (
              <div key={m.key} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                <div className="text-[10px] font-semibold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {usd(m.usd)}
                </div>
                <div
                  className={`w-full rounded-t-md transition-all ${isCur ? "bg-slate-900" : "bg-slate-300 group-hover:bg-slate-400"}`}
                  style={{ height: `${Math.max(h, m.usd > 0 ? 4 : 0)}%` }}
                  title={`${m.label}: ${usd(m.usd)} · ${m.count} ta`}
                />
                <span className={`text-[10px] ${isCur ? "text-slate-900 font-semibold" : "text-slate-400"}`}>{m.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Taqsimotlar */}
      <Distribution title={`Servislar bo'yicha · ${PERIOD_LABEL[period]}`} segs={data.byService} total={data.totalUsd} />
      <div className="grid lg:grid-cols-2 gap-5">
        <Distribution title="Platforma bo'yicha" segs={data.byPlatform} total={data.totalUsd} />
        <Distribution title="To'lov turlari bo'yicha" segs={data.byKind} total={data.totalUsd} />
      </div>
    </div>
  );
}
