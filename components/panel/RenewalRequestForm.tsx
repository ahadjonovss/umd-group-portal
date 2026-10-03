"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/i18n/LanguageProvider";
import { Rich } from "@/components/i18n/Rich";

export function RenewalRequestForm({
  appId,
  appName,
  usd,
  uzs,
  rate,
  currentEnd,
  discountPercent = 0,
}: {
  appId: string;
  appName: string;
  usd: number;
  uzs: number | null;
  rate: number | null;
  currentEnd: string;
  discountPercent?: number;
}) {
  const t = useT();
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/requests/renewal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || t.common.error);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <div className="text-4xl">✅</div>
        <h2 className="text-lg font-bold text-slate-900">{t.requestPage.accepted}</h2>
        <p className="text-sm text-slate-500"><Rich text={t.requestPage.renewalDoneText} /></p>
        <Link
          href={`/panel/app/${appId}`}
          className="inline-flex items-center justify-center gap-1.5 h-11 px-5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          {t.requestPage.backToAppCta}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-emerald-800">{t.requestPage.renewalHeading(appName)}</p>
        <p className="text-sm text-emerald-700 mt-1"><Rich text={t.requestPage.renewalSub} /></p>
        <p className="text-xs text-emerald-600 mt-1">{t.requestPage.renewalCurrentEnd(currentEnd)}</p>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <p className="text-sm font-bold text-slate-900">
          {t.requestPage.priceLabel(usd)}
          {uzs ? (
            <span className="font-normal text-slate-500">
              {t.requestPage.priceUzs(uzs.toLocaleString("en-US"), rate ? rate.toLocaleString("en-US") : null)}
            </span>
          ) : null}
        </p>
        {discountPercent > 0 && (
          <p className="text-xs font-semibold text-emerald-600 mt-1">{t.requestPage.discountApplied(discountPercent)}</p>
        )}
      </div>

      {error && <p className="text-sm text-red-600">❌ {error}</p>}

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" size="lg" onClick={() => router.push(`/panel/app/${appId}`)}>
          {t.common.cancelShort}
        </Button>
        <Button type="button" size="lg" loading={loading} onClick={submit}>
          {t.requestPage.submit}
        </Button>
      </div>
    </div>
  );
}
