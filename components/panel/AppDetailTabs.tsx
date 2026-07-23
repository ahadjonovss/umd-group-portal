"use client";

import { useState, type ReactNode } from "react";

type TabKey = "info" | "payment" | "activity";

export function AppDetailTabs({
  info,
  payment,
  activity,
  paymentCount,
  activityCount,
  defaultPayment = false,
}: {
  info: ReactNode;
  payment: ReactNode;
  activity: ReactNode;
  paymentCount: number;
  activityCount: number;
  defaultPayment?: boolean;
}) {
  const [tab, setTab] = useState<TabKey>(defaultPayment ? "payment" : "info");

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: "info", label: "Ma'lumot" },
    { key: "payment", label: "To'lov", count: paymentCount },
    { key: "activity", label: "Amaliyotlar tarixi", count: activityCount },
  ];

  return (
    <div>
      <div className="flex gap-1 border-b border-slate-200 mb-4 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
              tab === t.key ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.label}
            {typeof t.count === "number" && t.count > 0 && (
              <span className="text-xs text-slate-400">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {tab === "info" && info}
        {tab === "payment" && payment}
        {tab === "activity" && activity}
      </div>
    </div>
  );
}
