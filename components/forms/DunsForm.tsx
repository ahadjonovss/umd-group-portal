"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SubmitProgressOverlay } from "@/components/SubmitProgressOverlay";
import { dunsSchema, type DunsData } from "@/lib/validations/duns";

export function DunsForm() {
  const router = useRouter();
  const [submitStatus, setSubmitStatus] = useState<"idle" | "loading" | "error">("idle");
  const [submitError, setSubmitError] = useState("");
  const [progress, setProgress] = useState(0);

  const form = useForm<DunsData>({
    resolver: zodResolver(dunsSchema),
    defaultValues: { companyName: "", legalAddress: "", companyPhone: "", website: "", cpName: "", cpPhone: "" },
  });

  async function onSubmit(data: DunsData) {
    setSubmitStatus("loading");
    setSubmitError("");
    setProgress(0);

    const formData = new FormData();
    Object.entries(data).forEach(([k, v]) => formData.append(k, v ?? ""));

    try {
      await animateProgress(0, 30, 400);
      const fetchPromise = fetch("/api/submit/duns", { method: "POST", body: formData });
      await animateProgress(30, 80, 800);
      const res = await fetchPromise;
      await animateProgress(80, 95, 400);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || json.message || "Xato yuz berdi");
      await animateProgress(95, 100, 200);
      await new Promise((r) => setTimeout(r, 500));
      router.push("/success?service=duns");
    } catch (err: unknown) {
      setSubmitStatus("error");
      setSubmitError(err instanceof Error ? err.message : "Kutilmagan xato");
    }
  }

  function animateProgress(from: number, to: number, durationMs: number): Promise<void> {
    return new Promise((resolve) => {
      const steps = 15;
      const stepMs = durationMs / steps;
      const stepVal = (to - from) / steps;
      let current = from; let count = 0;
      const interval = setInterval(() => {
        count++; current += stepVal;
        setProgress(Math.min(Math.round(current), to));
        if (count >= steps) { clearInterval(interval); resolve(); }
      }, stepMs);
    });
  }

  return (
    <>
      {submitStatus === "loading" && <SubmitProgressOverlay progress={progress} />}
      {submitStatus === "error" && (
        <SubmitProgressOverlay
          progress={progress}
          error={submitError}
          onRetry={() => { setSubmitStatus("idle"); setProgress(0); setSubmitError(""); }}
        />
      )}
    <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-xl mx-auto px-4 py-8 flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">DUNS raqami ochish</h2>
        <p className="text-sm text-gray-500 mt-1">Biznesingiz uchun DUNS (Dun &amp; Bradstreet) raqamini rasmiylashtirib beramiz</p>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700 leading-relaxed">
        ℹ️ <span className="font-semibold">DUNS raqami</span> — Dun &amp; Bradstreet tomonidan beriladigan, biznesni
        xalqaro miqyosda tasdiqlaydigan noyob identifikator. Apple Developer Enterprise akkaunt va boshqa xalqaro
        xizmatlar uchun talab qilinadi.
      </div>

      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Kompaniya ma&apos;lumotlari</h3>

      <Input
        label="Kompaniya nomi (yuridik)"
        required
        placeholder="Masalan: MCHJ Umd Group"
        {...form.register("companyName")}
        error={form.formState.errors.companyName?.message}
      />
      <Input
        label="Yuridik manzil"
        required
        placeholder="Shahar, ko'cha, uy raqami"
        {...form.register("legalAddress")}
        error={form.formState.errors.legalAddress?.message}
      />
      <Input
        label="Kompaniya telefoni"
        required
        placeholder="+998 90 123 45 67"
        {...form.register("companyPhone")}
        error={form.formState.errors.companyPhone?.message}
      />
      <Input
        label="Veb-sayt (ixtiyoriy)"
        placeholder="https://..."
        {...form.register("website")}
        error={form.formState.errors.website?.message}
      />

      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Kontakt shaxs</h3>

      <Input
        label="F.I.O."
        required
        placeholder="Kontakt shaxs to'liq ismi"
        {...form.register("cpName")}
        error={form.formState.errors.cpName?.message}
      />
      <Input
        label="Telefon (ixtiyoriy)"
        placeholder="+998 90 123 45 67"
        {...form.register("cpPhone")}
        error={form.formState.errors.cpPhone?.message}
      />

      <Button type="submit" size="lg" className="w-full">Yuborish ✓</Button>
    </form>
    </>
  );
}
