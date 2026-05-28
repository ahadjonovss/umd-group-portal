"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SubmitProgressOverlay } from "@/components/SubmitProgressOverlay";
import { googleTransferSchema, type GoogleTransferData } from "@/lib/validations/google-transfer";

export function GoogleTransferForm() {
  const router = useRouter();
  const [submitStatus, setSubmitStatus] = useState<"idle" | "loading" | "error">("idle");
  const [submitError, setSubmitError] = useState("");
  const [progress, setProgress] = useState(0);

  const form = useForm<GoogleTransferData>({
    resolver: zodResolver(googleTransferSchema),
    defaultValues: { fullName: "", phone: "", email: "", developerAccountId: "", googlePaymentsProfileId: "" },
  });

  async function onSubmit(data: GoogleTransferData) {
    setSubmitStatus("loading");
    setSubmitError("");
    setProgress(0);

    const formData = new FormData();
    Object.entries(data).forEach(([k, v]) => formData.append(k, v));

    try {
      await animateProgress(0, 30, 400);
      const fetchPromise = fetch("/api/submit/google-transfer", { method: "POST", body: formData });
      await animateProgress(30, 80, 800);
      const res = await fetchPromise;
      await animateProgress(80, 95, 400);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || json.message || "Xato yuz berdi");
      await animateProgress(95, 100, 200);
      await new Promise((r) => setTimeout(r, 500));
      router.push("/success?service=google-transfer");
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
        <h2 className="text-xl font-semibold text-gray-900">Google Play — App Transfer</h2>
        <p className="text-sm text-gray-500 mt-1">Ilovani bizning akkauntga o&apos;tkazish uchun ma&apos;lumotlar</p>
      </div>

      <div className="h-px bg-gray-200" />

      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Mijoz ma&apos;lumotlari</h3>
      <Input label="To'liq ism" required placeholder="Sardor Abdullayev" {...form.register("fullName")} error={form.formState.errors.fullName?.message} />
      <Input label="Telefon raqami" required placeholder="+998901234567" {...form.register("phone")} error={form.formState.errors.phone?.message} />
      <Input label="Email" type="email" required placeholder="email@example.com" {...form.register("email")} error={form.formState.errors.email?.message} />

      <div className="h-px bg-gray-200" />

      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Developer akkaunt</h3>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
        ℹ️ Developer Account ID ni qayerdan topish: <br />
        <span className="font-medium">Play Console → Settings → Developer account → Account details</span>
      </div>

      <Input
        label="Developer Account ID"
        required
        placeholder="12345678901234567890"
        {...form.register("developerAccountId")}
        error={form.formState.errors.developerAccountId?.message}
        hint="Play Console → Settings → Developer account → Account details"
      />

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
        ℹ️ Google Payments Profile ID ni qayerdan topish: <br />
        <span className="font-medium">Play Console → Settings → Payments profile</span>
      </div>

      <Input
        label="Google Payments Profile ID"
        required
        placeholder="PDS.1234-5678-9012-3456"
        {...form.register("googlePaymentsProfileId")}
        error={form.formState.errors.googlePaymentsProfileId?.message}
        hint="Play Console → Settings → Payments profile"
      />



      <Button type="submit" size="lg" className="w-full">Yuborish ✓</Button>
    </form>
    </>
  );
}
