"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function RenewalRequestForm({
  appId,
  appName,
  usd,
  uzs,
  rate,
  currentEnd,
}: {
  appId: string;
  appName: string;
  usd: number;
  uzs: number | null;
  rate: number | null;
  currentEnd: string;
}) {
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
        <p className="text-sm text-slate-500">
          Admin so&apos;rovni ko&apos;rib chiqib, to&apos;lov uchun taqdim etadi. To&apos;lovdan so&apos;ng obuna
          muddati <strong>+9 oyga</strong> uzaytiriladi.
        </p>
        <Link
          href={`/panel/app/${appId}`}
          className="inline-flex items-center justify-center gap-1.5 h-11 px-5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          Ilovaga qaytish
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-emerald-800">{appName} — obunani uzaytirish</p>
        <p className="text-sm text-emerald-700 mt-1">
          Obuna muddati <strong>+9 oy (270 kun)</strong> ga uzaytiriladi.
        </p>
        <p className="text-xs text-emerald-600 mt-1">Joriy tugash sanasi: {currentEnd}</p>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <p className="text-sm font-bold text-slate-900">
          Narx: ${usd}
          {uzs ? (
            <span className="font-normal text-slate-500">
              {" "}
              (~{uzs.toLocaleString("en-US")} so&apos;m{rate ? `, 1$=${rate.toLocaleString("en-US")}` : ""})
            </span>
          ) : null}
        </p>
      </div>

      {error && <p className="text-sm text-red-600">❌ {error}</p>}

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" size="lg" onClick={() => router.push(`/panel/app/${appId}`)}>
          Bekor
        </Button>
        <Button type="button" size="lg" loading={loading} onClick={submit}>
          So&apos;rov yuborish
        </Button>
      </div>
    </div>
  );
}
