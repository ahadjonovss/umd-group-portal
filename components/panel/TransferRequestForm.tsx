"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { ServiceType } from "@/types";

export function TransferRequestForm({
  appId,
  serviceType,
  appName,
  usd,
  uzs,
  rate,
}: {
  appId: string;
  serviceType: ServiceType;
  appName: string;
  usd: number;
  uzs: number | null;
  rate: number | null;
}) {
  const router = useRouter();
  const isGoogle = serviceType === "play-market";
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string) => setFields((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const required = isGoogle ? fields.developerAccountId : fields.appStoreConnectTeamId;
    if (!required?.trim()) return setError("Majburiy maydonni to'ldiring");
    setLoading(true);
    try {
      const res = await fetch("/api/requests/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId, data: fields }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Xato yuz berdi");
      router.push("/panel");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xato yuz berdi");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-blue-800">{appName} — Transfer</p>
        <p className="text-xs text-blue-700 mt-1">
          Ilovani {isGoogle ? "Google Play" : "App Store"} akkauntingizdan UMD GROUP akkauntiga o&apos;tkazish.
        </p>
        <p className="text-sm font-bold text-slate-900 mt-2">
          Narx: ${usd}
          {uzs ? <span className="font-normal text-slate-500"> (~{uzs.toLocaleString("en-US")} so&apos;m{rate ? `, 1$=${rate.toLocaleString("en-US")}` : ""})</span> : null}
        </p>
      </div>

      {isGoogle ? (
        <>
          <Input label="Developer Account ID" required placeholder="1234567890123456789" value={fields.developerAccountId || ""} onChange={(e) => set("developerAccountId", e.target.value)} hint="Google Play Console Developer Account ID" />
          <Input label="Google Payments Profile ID" placeholder="1234-5678-9012-3456" value={fields.googlePaymentsProfileId || ""} onChange={(e) => set("googlePaymentsProfileId", e.target.value)} />
        </>
      ) : (
        <>
          <Input label="App Store Connect Team ID" required placeholder="ABCDE12345" value={fields.appStoreConnectTeamId || ""} onChange={(e) => set("appStoreConnectTeamId", e.target.value)} />
          <Input label="Apple Developer akkaunt email" type="email" placeholder="email@example.com" value={fields.appleDevAccountEmail || ""} onChange={(e) => set("appleDevAccountEmail", e.target.value)} />
        </>
      )}
      <Textarea label="Izoh (ixtiyoriy)" rows={3} placeholder="Qo'shimcha ma'lumot..." value={fields.note || ""} onChange={(e) => set("note", e.target.value)} />

      {error && <p className="text-sm text-red-600">❌ {error}</p>}

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" size="lg" onClick={() => router.push("/panel")}>Bekor</Button>
        <Button type="submit" size="lg" loading={loading}>So&apos;rov yuborish</Button>
      </div>
    </form>
  );
}
