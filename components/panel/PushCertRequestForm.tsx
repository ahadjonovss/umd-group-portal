"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/i18n/LanguageProvider";

export function PushCertRequestForm({
  appId,
  appName,
  usd,
  uzs,
  rate,
  discountPercent = 0,
}: {
  appId: string;
  appName: string;
  usd: number;
  uzs: number | null;
  rate: number | null;
  discountPercent?: number;
}) {
  const t = useT();
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/requests/push-certificate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || t.common.error);
      router.push(`/panel/app/${appId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-sky-800">{t.requestPage.pushHeading(appName)}</p>
        <p className="text-xs text-sky-700 mt-1 leading-relaxed">{t.requestPage.pushSub}</p>
        <p className="text-sm font-bold text-slate-900 mt-2">
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
