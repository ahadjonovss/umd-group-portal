"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SubmitProgressOverlay } from "@/components/SubmitProgressOverlay";
import { makeGoogleTransferSchema, type GoogleTransferData } from "@/lib/validations/google-transfer";
import { useT } from "@/components/i18n/LanguageProvider";

export function GoogleTransferForm() {
  const t = useT();
  const router = useRouter();
  const [submitStatus, setSubmitStatus] = useState<"idle" | "loading" | "error">("idle");
  const [submitError, setSubmitError] = useState("");
  const [progress, setProgress] = useState(0);

  const form = useForm<GoogleTransferData>({
    resolver: zodResolver(useMemo(() => makeGoogleTransferSchema(t), [t])),
    defaultValues: { developerAccountId: "", transactionId: "" },
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
      if (!res.ok || !json.success) throw new Error(json.error || json.message || t.common.error);
      await animateProgress(95, 100, 200);
      await new Promise((r) => setTimeout(r, 500));
      router.push(`/success?service=google-transfer&appId=${json.id}`);
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
        <h2 className="text-xl font-semibold text-gray-900">{t.googleTransferForm.heading}</h2>
        <p className="text-sm text-gray-500 mt-1">{t.googleTransferForm.sub}</p>
      </div>

      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{t.googleTransferForm.sectionAccount}</h3>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
        {t.googleTransferForm.whereToFind} <br />
        <span className="font-medium">{t.googleTransferForm.whereToFindPath}</span>
      </div>

      <Input
        label={t.googleTransferForm.devAccountId}
        required
        placeholder={t.googleTransferForm.devAccountIdPlaceholder}
        {...form.register("developerAccountId")}
        error={form.formState.errors.developerAccountId?.message}
        hint={t.googleTransferForm.whereToFindPath}
      />

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 leading-relaxed">
        {t.googleTransferForm.txTitlePre} <span className="font-semibold">{t.googleTransferForm.txTitleStrong}</span>{t.googleTransferForm.txTitlePost}
        <br />
        {t.googleTransferForm.txStep1Pre} <span className="font-semibold">{t.googleTransferForm.txStep1Amount}</span> {t.googleTransferForm.txStep1Post}
        <br />
        {t.googleTransferForm.txStep2}
        <br />
        &nbsp;&nbsp;{t.googleTransferForm.txStep2aPre} <span className="font-medium">{t.googleTransferForm.txStep2a}</span>{t.googleTransferForm.txStep2aPost}
        <br />
        &nbsp;&nbsp;• <span className="font-medium">{t.googleTransferForm.txStep2b}</span>{t.googleTransferForm.txStep2bPost}
      </div>

      <Input
        label={t.googleTransferForm.transactionId}
        required
        placeholder={t.googleTransferForm.transactionIdPlaceholder}
        {...form.register("transactionId")}
        error={form.formState.errors.transactionId?.message}
        hint={t.googleTransferForm.transactionIdHint}
      />



      <Button type="submit" size="lg" className="w-full">{t.form.submitCheck}</Button>
    </form>
    </>
  );
}
