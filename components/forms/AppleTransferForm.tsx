"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SubmitProgressOverlay } from "@/components/SubmitProgressOverlay";
import { appleTransferSchema, type AppleTransferData } from "@/lib/validations/apple-transfer";

export function AppleTransferForm() {
  const router = useRouter();
  const [submitStatus, setSubmitStatus] = useState<"idle" | "loading" | "error">("idle");
  const [submitError, setSubmitError] = useState("");
  const [progress, setProgress] = useState(0);

  const form = useForm<AppleTransferData>({
    resolver: zodResolver(appleTransferSchema),
    defaultValues: { appStoreConnectTeamId: "", appleDevAccountEmail: "" },
  });

  async function onSubmit(data: AppleTransferData) {
    setSubmitStatus("loading");
    setSubmitError("");
    setProgress(0);

    const formData = new FormData();
    Object.entries(data).forEach(([k, v]) => formData.append(k, v));

    try {
      await animateProgress(0, 30, 400);
      const fetchPromise = fetch("/api/submit/apple-transfer", { method: "POST", body: formData });
      await animateProgress(30, 80, 800);
      const res = await fetchPromise;
      await animateProgress(80, 95, 400);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || json.message || "Xato yuz berdi");
      await animateProgress(95, 100, 200);
      await new Promise((r) => setTimeout(r, 500));
      router.push("/success?service=apple-transfer");
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
          <h2 className="text-xl font-semibold text-gray-900">Apple App Store — App Transfer</h2>
          <p className="text-sm text-gray-500 mt-1">Ilovani bizning akkauntga o&apos;tkazish uchun ma&apos;lumotlar</p>
        </div>

        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Apple akkaunt</h3>

        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700">
          ℹ️ Team ID ni qayerdan topish: <br />
          <span className="font-medium">App Store Connect → Users and Access → Team ID</span>
        </div>

        <Input
          label="App Store Connect Team ID"
          required
          placeholder="1A2B3C4D5E"
          {...form.register("appStoreConnectTeamId")}
          error={form.formState.errors.appStoreConnectTeamId?.message}
          hint="App Store Connect → Users and Access → Team ID"
        />

        <Input
          label="Apple Developer Account Email"
          type="email"
          required
          placeholder="example@company.com"
          {...form.register("appleDevAccountEmail")}
          error={form.formState.errors.appleDevAccountEmail?.message}
          hint="Apple Developer akkauntingizga ulangan email"
        />

        <Button type="submit" size="lg" className="w-full">Yuborish ✓</Button>
      </form>
    </>
  );
}
