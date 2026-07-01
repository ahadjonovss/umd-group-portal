"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { ServiceType } from "@/types";

export function UpdateRequestForm({
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
  const isAndroid = serviceType !== "app-store";
  const [releaseNotes, setReleaseNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!releaseNotes.trim()) return setError("Relizdagi o'zgarishlarni yozing");
    setLoading(true);
    try {
      const res = await fetch("/api/requests/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId, releaseNotes }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Xato yuz berdi");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xato yuz berdi");
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <div className="text-4xl">✅</div>
        <h2 className="text-lg font-bold text-slate-900">So&apos;rov qabul qilindi!</h2>
        {isAndroid ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-left">
            <p className="text-sm font-semibold text-emerald-800 mb-1">Endi yangi .aab faylni yuboring</p>
            <p className="text-sm text-emerald-700">
              Ilovaning yangi <strong>.aab</strong> faylini Telegram orqali quyidagi akkauntga yuboring:
            </p>
            <div className="mt-2 inline-block bg-white rounded-lg px-3 py-1.5 text-sm font-mono font-bold text-emerald-700 border border-emerald-200">
              @umdgroupadmin
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left">
            <p className="text-sm font-semibold text-blue-800 mb-1">Endi yangi kodni push qiling</p>
            <p className="text-sm text-blue-700">
              Ilovaning yangi versiyasini <strong>GitHub</strong> repozitoriyangizga <strong>push</strong> qiling.
              Jamoamiz build qilib App Store&apos;ga yuklaydi.
            </p>
          </div>
        )}
        <Link
          href="/panel"
          className="inline-flex items-center justify-center gap-1.5 h-11 px-5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          Kabinetga qaytish
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-blue-800">{appName} — Update chiqarish</p>
        <p className="text-sm font-bold text-slate-900 mt-2">
          Narx: ${usd}
          {uzs ? (
            <span className="font-normal text-slate-500">
              {" "}
              (~{uzs.toLocaleString("en-US")} so&apos;m{rate ? `, 1$=${rate.toLocaleString("en-US")}` : ""})
            </span>
          ) : null}
        </p>
      </div>

      <Textarea
        label="Relizdagi o'zgarishlar"
        required
        rows={5}
        placeholder="Ushbu yangilanishda nima o'zgardi? (yangi funksiyalar, tuzatishlar...)"
        value={releaseNotes}
        onChange={(e) => setReleaseNotes(e.target.value)}
      />

      {error && <p className="text-sm text-red-600">❌ {error}</p>}

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" size="lg" onClick={() => router.push("/panel")}>Bekor</Button>
        <Button type="submit" size="lg" loading={loading}>So&apos;rov yuborish</Button>
      </div>
    </form>
  );
}
