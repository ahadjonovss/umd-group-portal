"use client";

import { useState, useTransition } from "react";
import { actCreateDraft } from "@/app/panel/actions";
import { SERVICE_SHORT } from "@/lib/labels";
import type { ServiceType } from "@/types";

const TYPES: ServiceType[] = ["play-market", "app-store", "google-transfer", "apple-transfer"];

export function DraftButton() {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={pending}
        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50"
      >
        {pending ? "Qo'shilmoqda…" : "+ Draft ariza"}
      </button>

      {open && !pending && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl border border-slate-200 shadow-lg z-20 p-1">
            {TYPES.map((t) => (
              <button
                key={t}
                onClick={() => {
                  setOpen(false);
                  start(() => actCreateDraft(t));
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {SERVICE_SHORT[t]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
