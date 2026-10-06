"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

// Keyingi davrni muddatidan oldin to'lash — hisob-faktura shu yerda chiqariladi,
// so'ng to'lov oynasi darhol ochiladi.
export function PrepayButton({
  appId,
  label,
  loadingLabel,
  errorLabel,
}: {
  appId: string;
  label: string;
  loadingLabel: string;
  errorLabel: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function go() {
    setError("");
    setBusy(true);
    start(async () => {
      try {
        const res = await fetch("/api/requests/recurring", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appId }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || errorLabel);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : errorLabel);
      } finally {
        setBusy(false);
      }
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        onClick={go}
        disabled={busy || pending}
        className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 active:scale-[0.99] transition-all disabled:opacity-50"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        {busy || pending ? loadingLabel : label}
      </button>
      {error && <p className="text-xs text-red-600">❌ {error}</p>}
    </div>
  );
}
