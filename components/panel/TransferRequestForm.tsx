"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { ServiceType } from "@/types";
import { useT } from "@/components/i18n/LanguageProvider";
import { Rich } from "@/components/i18n/Rich";

export function TransferRequestForm({
  appId,
  serviceType,
  appName,
  usd,
  uzs,
  rate,
  discountPercent = 0,
}: {
  appId: string;
  serviceType: ServiceType;
  appName: string;
  usd: number;
  uzs: number | null;
  rate: number | null;
  discountPercent?: number;
}) {
  const t = useT();
  const router = useRouter();
  const isGoogle = serviceType === "play-market";
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string) => setFields((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (isGoogle) {
      if (!fields.developerAccountId?.trim() || !fields.transactionId?.trim())
        return setError(t.requestPage.transferErrGoogle);
    } else if (!fields.appStoreConnectTeamId?.trim()) {
      return setError(t.requestPage.transferErrRequired);
    }
    setLoading(true);
    try {
      const res = await fetch("/api/requests/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId, data: fields }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || t.common.error);
      router.push("/panel");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-blue-800">{t.requestPage.transferHeading(appName)}</p>
        <p className="text-xs text-blue-700 mt-1">
          {t.requestPage.transferSub(isGoogle ? "Google Play" : "App Store")}
        </p>
        <p className="text-sm font-bold text-slate-900 mt-2">
          {t.requestPage.priceLabel(usd)}
          {uzs ? <span className="font-normal text-slate-500">{t.requestPage.priceUzs(uzs.toLocaleString("en-US"), rate ? rate.toLocaleString("en-US") : null)}</span> : null}
        </p>
        {discountPercent > 0 && (
          <p className="text-xs font-semibold text-emerald-600 mt-1">{t.requestPage.discountApplied(discountPercent)}</p>
        )}
      </div>

      {isGoogle ? (
        <>
          <Input label={t.requestPage.devAccountId} required placeholder="1234567890123456789" value={fields.developerAccountId || ""} onChange={(e) => set("developerAccountId", e.target.value)} hint={t.requestPage.devAccountIdHint} />
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 leading-relaxed">
            <Rich text={t.requestPage.txInfo} />
          </div>
          <Input label={t.requestPage.transactionId} required placeholder="0.G.1234-5678-9012-3456" value={fields.transactionId || ""} onChange={(e) => set("transactionId", e.target.value)} hint={t.requestPage.transactionIdHint} />
        </>
      ) : (
        <>
          <Input label={t.requestPage.teamId} required placeholder="ABCDE12345" value={fields.appStoreConnectTeamId || ""} onChange={(e) => set("appStoreConnectTeamId", e.target.value)} />
          <Input label={t.requestPage.appleEmail} type="email" placeholder="email@example.com" value={fields.appleDevAccountEmail || ""} onChange={(e) => set("appleDevAccountEmail", e.target.value)} />
        </>
      )}
      <Textarea label={t.requestPage.noteOptional} rows={3} placeholder={t.form.notePlaceholder} value={fields.note || ""} onChange={(e) => set("note", e.target.value)} />

      {error && <p className="text-sm text-red-600">❌ {error}</p>}

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" size="lg" onClick={() => router.push("/panel")}>{t.common.cancelShort}</Button>
        <Button type="submit" size="lg" loading={loading}>{t.requestPage.submit}</Button>
      </div>
    </form>
  );
}
