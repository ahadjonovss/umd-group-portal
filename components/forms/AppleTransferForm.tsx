"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SubmitProgressOverlay } from "@/components/SubmitProgressOverlay";
import { makeAppleTransferSchema, type AppleTransferData } from "@/lib/validations/apple-transfer";
import { useT } from "@/components/i18n/LanguageProvider";

export function AppleTransferForm() {
  const t = useT();
  const router = useRouter();
  const [submitStatus, setSubmitStatus] = useState<"idle" | "loading" | "error">("idle");
  const [submitError, setSubmitError] = useState("");
  const [progress, setProgress] = useState(0);

  const form = useForm<AppleTransferData>({
    resolver: zodResolver(useMemo(() => makeAppleTransferSchema(t), [t])),
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
      if (!res.ok || !json.success) throw new Error(json.error || json.message || t.common.error);
      await animateProgress(95, 100, 200);
      await new Promise((r) => setTimeout(r, 500));
      router.push(`/success?service=apple-transfer&appId=${json.id}`);
    } catch (err: unknown) {
      setSubmitStatus("error");
      setSubmitError(err instanceof Error ? err.message : t.form.unexpectedError);
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
          <h2 className="text-xl font-semibold text-gray-900">{t.appleTransferForm.heading}</h2>
          <p className="text-sm text-gray-500 mt-1">{t.appleTransferForm.sub}</p>
        </div>

        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{t.appleTransferForm.sectionAccount}</h3>

        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700">
          {t.appleTransferForm.whereToFind} <br />
          <span className="font-medium">{t.appleTransferForm.whereToFindPath}</span>
        </div>

        <Input
          label={t.appleTransferForm.teamId}
          required
          placeholder={t.appleTransferForm.teamIdPlaceholder}
          {...form.register("appStoreConnectTeamId")}
          error={form.formState.errors.appStoreConnectTeamId?.message}
          hint={t.appleTransferForm.whereToFindPath}
        />

        <Input
          label={t.appleTransferForm.devEmail}
          type="email"
          required
          placeholder={t.appleTransferForm.devEmailPlaceholder}
          {...form.register("appleDevAccountEmail")}
          error={form.formState.errors.appleDevAccountEmail?.message}
          hint={t.appleTransferForm.devEmailHint}
        />

        <Button type="submit" size="lg" className="w-full">{t.form.submitCheck}</Button>
      </form>
    </>
  );
}
