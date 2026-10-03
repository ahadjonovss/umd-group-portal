"use client";

import { useState } from "react";
import type { Pricing } from "@/lib/firestore/settings";
import { TermsContent, type TermsService } from "@/components/TermsContent";
import { useT } from "@/components/i18n/LanguageProvider";

export function TermsTabs({ pricing }: { pricing: Pricing }) {
  const t = useT();
  const [tab, setTab] = useState<TermsService>("publish");

  const tabs: { key: TermsService; label: string }[] = [
    { key: "publish", label: t.termsPage.tabs.publish },
    { key: "transfer", label: t.termsPage.tabs.transfer },
    { key: "update", label: t.termsPage.tabs.update },
    { key: "renewal", label: t.termsPage.tabs.renewal },
    { key: "account", label: t.termsPage.tabs.account },
    { key: "push_certificate", label: t.termsPage.tabs.push_certificate },
    { key: "duns", label: t.termsPage.tabs.duns },
  ];

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto mb-4 -mx-1 px-1">
        {tabs.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              tab === item.key ? "bg-blue-600 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
        <TermsContent service={tab} pricing={pricing} />
      </div>
    </div>
  );
}
