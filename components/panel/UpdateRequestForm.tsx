"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { ServiceType } from "@/types";
import { useT } from "@/components/i18n/LanguageProvider";
import { Rich } from "@/components/i18n/Rich";

export function UpdateRequestForm({
  appId,
  serviceType,
  appName,
  usd,
  uzs,
  rate,
  discountPercent = 0,
  freeByPackage = false,
}: {
  appId: string;
  serviceType: ServiceType;
  appName: string;
  usd: number;
  uzs: number | null;
  rate: number | null;
  discountPercent?: number;
  freeByPackage?: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const isAndroid = serviceType !== "app-store";
  const [releaseNotes, setReleaseNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!releaseNotes.trim()) return setError(t.requestPage.releaseNotesErr);
    setLoading(true);
    try {
      const res = await fetch("/api/requests/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId, releaseNotes }),
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
        {isAndroid ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-left">
            <p className="text-sm font-semibold text-emerald-800 mb-1">{t.requestPage.updateDoneAndroidTitle}</p>
            <p className="text-sm text-emerald-700"><Rich text={t.requestPage.updateDoneAndroidBody} /></p>
            <div className="mt-2 inline-block bg-white rounded-lg px-3 py-1.5 text-sm font-mono font-bold text-emerald-700 border border-emerald-200">
              @umdgroupadmin
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left">
            <p className="text-sm font-semibold text-blue-800 mb-1">{t.requestPage.updateDoneIosTitle}</p>
            <p className="text-sm text-blue-700"><Rich text={t.requestPage.updateDoneIosBody} /></p>
          </div>
        )}
        <Link
          href="/panel"
          className="inline-flex items-center justify-center gap-1.5 h-11 px-5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          {t.requestPage.backToPanel}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className={`${freeByPackage ? "bg-cyan-50 border-cyan-200" : "bg-blue-50 border-blue-200"} border rounded-xl p-4`}>
        <p className={`text-sm font-semibold ${freeByPackage ? "text-cyan-800" : "text-blue-800"}`}>{t.requestPage.updateHeading(appName)}</p>
        {freeByPackage ? (
          <p className="text-sm font-bold text-cyan-800 mt-2">{t.requestPage.updateFree}</p>
        ) : (
          <p className="text-sm font-bold text-slate-900 mt-2">
            {t.requestPage.priceLabel(usd)}
            {uzs ? (
              <span className="font-normal text-slate-500">
                {t.requestPage.priceUzs(uzs.toLocaleString("en-US"), rate ? rate.toLocaleString("en-US") : null)}
              </span>
            ) : null}
          </p>
        )}
        {!freeByPackage && discountPercent > 0 && (
          <p className="text-xs font-semibold text-emerald-600 mt-1">{t.requestPage.discountApplied(discountPercent)}</p>
        )}
      </div>

      <Textarea
        label={t.requestPage.releaseNotes}
        required
        rows={5}
        placeholder={t.requestPage.releaseNotesPlaceholder}
        value={releaseNotes}
        onChange={(e) => setReleaseNotes(e.target.value)}
      />

      {error && <p className="text-sm text-red-600">❌ {error}</p>}

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" size="lg" onClick={() => router.push("/panel")}>{t.common.cancelShort}</Button>
        <Button type="submit" size="lg" loading={loading}>{t.requestPage.submit}</Button>
      </div>
    </form>
  );
}
