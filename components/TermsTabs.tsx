"use client";

import { useState } from "react";
import type { Pricing } from "@/lib/firestore/settings";
import { TermsContent, type TermsService } from "@/components/TermsContent";

export function TermsTabs({ pricing }: { pricing: Pricing }) {
  const [tab, setTab] = useState<TermsService>("publish");

  const tabs: { key: TermsService; label: string }[] = [
    { key: "publish", label: "Store'ga chiqarish" },
    { key: "transfer", label: "Transfer" },
    { key: "update", label: "Update" },
    { key: "renewal", label: "Obunani uzaytirish" },
    { key: "account", label: "Akkaunt ochish" },
  ];

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto mb-4 -mx-1 px-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t.key ? "bg-blue-600 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
        <TermsContent service={tab} pricing={pricing} />
      </div>
    </div>
  );
}
