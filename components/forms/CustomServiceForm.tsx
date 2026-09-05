"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SubmitProgressOverlay } from "@/components/SubmitProgressOverlay";
import type { CatalogService } from "@/lib/service-def";

// Katalogdagi "ochiq" (self-service) maxsus xizmat uchun dinamik ariza formasi.
// Maydonlar admin katalogda belgilagan tartibda chiziladi.
export function CustomServiceForm({ service }: { service: CatalogService }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(service.fields.map((f) => [f.key, ""]))
  );
  const [note, setNote] = useState("");
  const [agreed, setAgreed] = useState(!service.terms);

  const set = (k: string, v: string) => setValues((s) => ({ ...s, [k]: v }));

  const missing = service.fields.filter((f) => f.required && !values[f.key]?.trim());

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (missing.length) {
      setError(`Majburiy maydonlarni to'ldiring: ${missing.map((f) => f.label).join(", ")}`);
      return;
    }
    setStatus("loading");
    setError("");
    setProgress(10);

    try {
      const timer = setInterval(() => setProgress((p) => Math.min(p + 7, 90)), 150);
      const res = await fetch("/api/submit/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catalogId: service.id, fields: values, note }),
      });
      clearInterval(timer);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Xato yuz berdi");
      setProgress(100);
      await new Promise((r) => setTimeout(r, 400));
      router.push(`/success?service=custom&appId=${json.id}`);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Kutilmagan xato");
    }
  }

  const oneTime = service.pricing.oneTime;
  const rec = service.pricing.recurring;

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      {status === "loading" && <SubmitProgressOverlay progress={progress} />}

      {/* Narx xulosasi */}
      <div className="rounded-xl bg-slate-50 ring-1 ring-slate-200 p-4 flex flex-col gap-1.5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Narx</p>
        {oneTime.enabled && oneTime.amountUsd > 0 && (
          <p className="text-sm text-slate-800">
            Bir martalik: <strong>${oneTime.amountUsd}</strong>
            <span className="text-slate-500"> · avans {oneTime.advancePercent}% (${Math.round((oneTime.amountUsd * oneTime.advancePercent) / 100)})</span>
          </p>
        )}
        {rec.enabled && rec.amountUsd > 0 && (
          <p className="text-sm text-slate-800">
            Davriy: <strong>${rec.amountUsd}</strong>
            <span className="text-slate-500"> / {rec.periodMonths === 1 ? "oy" : `${rec.periodMonths} oy`}</span>
          </p>
        )}
        {service.etaDays > 0 && <p className="text-xs text-slate-500">Taxminiy muddat: {service.etaDays} ish kuni</p>}
      </div>

      {/* Dinamik maydonlar */}
      {service.fields.map((f) => (
        <div key={f.key} className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">
            {f.label}
            {f.required && <span className="text-red-500"> *</span>}
          </label>
          {f.type === "textarea" ? (
            <Textarea value={values[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder} rows={4} />
          ) : f.type === "select" ? (
            <select
              value={values[f.key] ?? ""}
              onChange={(e) => set(f.key, e.target.value)}
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            >
              <option value="">— tanlang —</option>
              {f.options.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          ) : (
            <Input
              type={f.type === "number" ? "number" : f.type === "email" ? "email" : f.type === "url" ? "url" : f.type === "phone" ? "tel" : "text"}
              value={values[f.key] ?? ""}
              onChange={(e) => set(f.key, e.target.value)}
              placeholder={f.placeholder}
            />
          )}
        </div>
      ))}

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700">Qo&apos;shimcha izoh</label>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Loyihangiz haqida qisqacha..." />
      </div>

      {service.terms && (
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Shartlar</p>
          <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">{service.terms}</p>
          <label className="mt-3 inline-flex items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 w-4 h-4" />
            Shartlar bilan tanishdim va roziman
          </label>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={status === "loading" || !agreed}>
        {status === "loading" ? "Yuborilmoqda…" : "Ariza yuborish"}
      </Button>
    </form>
  );
}
