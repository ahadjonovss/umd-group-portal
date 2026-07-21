"use client";

import { useMemo, useState } from "react";
import type { AppView } from "@/lib/firestore/apps";
import type { RequestView } from "@/lib/firestore/requests";
import type { Pricing } from "@/lib/firestore/settings";
import { AppCard } from "@/components/panel/AppCard";
import { appCategory, appNeedsPayment, type AppCategory } from "@/lib/panel-status";

type Reqs = Record<string, RequestView>;
type FilterKey = "all" | "action" | AppCategory;

const FILTER_LABEL: Record<FilterKey, string> = {
  all: "Barchasi",
  action: "Amal kerak",
  active: "Faol",
  progress: "Jarayonda",
  closed: "Yopilgan",
};

function StatCard({ label, value, tone, icon }: { label: string; value: number; tone: "slate" | "emerald" | "blue" | "amber"; icon: React.ReactNode }) {
  const tones = {
    slate: "bg-slate-100 text-slate-600",
    emerald: "bg-emerald-100 text-emerald-600",
    blue: "bg-blue-100 text-blue-600",
    amber: "bg-amber-100 text-amber-600",
  } as const;
  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl border border-slate-200/80 shadow-sm shadow-slate-200/40 p-4">
      <span className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tones[tone]}`}>{icon}</span>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-slate-900 leading-none">{value}</p>
        <p className="text-xs text-slate-400 mt-1 truncate">{label}</p>
      </div>
    </div>
  );
}

export function PanelApps({
  apps,
  pricing,
  transfer,
  update,
  renewal,
}: {
  apps: AppView[];
  pricing?: Pricing;
  transfer: Reqs;
  update: Reqs;
  renewal: Reqs;
}) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const meta = useMemo(() => {
    return apps.map((app) => ({
      app,
      category: appCategory(app),
      needsAction: appNeedsPayment(app, pricing, transfer[app.id], update[app.id], renewal[app.id]),
    }));
  }, [apps, pricing, transfer, update, renewal]);

  const counts = useMemo(() => {
    const c = { all: meta.length, action: 0, active: 0, progress: 0, closed: 0 } as Record<FilterKey, number>;
    for (const m of meta) {
      c[m.category] += 1;
      if (m.needsAction) c.action += 1;
    }
    return c;
  }, [meta]);

  const visible = useMemo(() => {
    const list = meta.filter((m) => {
      if (filter === "all") return true;
      if (filter === "action") return m.needsAction;
      return m.category === filter;
    });
    // Amal kerak bo'lganlar tepada, keyin eng yangi (createdAt) tepada
    return list.sort((a, b) => {
      if (a.needsAction !== b.needsAction) return a.needsAction ? -1 : 1;
      return (b.app.createdAt ?? "").localeCompare(a.app.createdAt ?? "");
    });
  }, [meta, filter]);

  const filterKeys: FilterKey[] = ["all", "action", "active", "progress", "closed"];

  return (
    <div className="flex flex-col gap-5">
      {/* Statistika */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Jami ilovalar"
          value={counts.all}
          tone="slate"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          }
        />
        <StatCard
          label="Faol"
          value={counts.active}
          tone="emerald"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 13l4 4L19 7" />
            </svg>
          }
        />
        <StatCard
          label="Jarayonda"
          value={counts.progress}
          tone="blue"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Amal kerak"
          value={counts.action}
          tone="amber"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
            </svg>
          }
        />
      </div>

      {/* Filtr chiplari */}
      <div className="flex flex-wrap items-center gap-2">
        {filterKeys.map((k) => {
          if (k !== "all" && counts[k] === 0) return null;
          const active = filter === k;
          const isAction = k === "action";
          return (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                active
                  ? isAction
                    ? "bg-amber-500 text-white"
                    : "bg-slate-900 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {isAction && !active && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
              {FILTER_LABEL[k]}
              <span className={`text-xs ${active ? "text-white/70" : "text-slate-400"}`}>{counts[k]}</span>
            </button>
          );
        })}
      </div>

      {/* Ro'yxat */}
      {visible.length ? (
        <div className="flex flex-col gap-3">
          {visible.map((m) => (
            <AppCard
              key={m.app.id}
              app={m.app}
              pricing={pricing}
              transferRequest={transfer[m.app.id] ?? null}
              updateRequest={update[m.app.id] ?? null}
              renewalRequest={renewal[m.app.id] ?? null}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/50 p-10 text-center">
          <p className="text-slate-500 text-sm">Bu bo&apos;limda ilova yo&apos;q.</p>
          <button onClick={() => setFilter("all")} className="mt-3 text-sm font-semibold text-blue-600 hover:underline">
            Barchasini ko&apos;rsatish
          </button>
        </div>
      )}
    </div>
  );
}
