"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { StepProgress } from "@/components/StepProgress";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/ImageUpload";
import { SubmitProgressOverlay } from "@/components/SubmitProgressOverlay";
import { compressImages } from "@/lib/image-compress";
import { TermsConfirmModal } from "@/components/TermsConfirmModal";
import type { Pricing } from "@/lib/firestore/settings";

import {
  makeAppStoreStep1Schema,
  makeAppStoreStep2Schema,
  makeAppStoreStep3Schema,
  appStoreStep5Schema,
  type AppStoreStep1,
  type AppStoreStep2,
  type AppStoreStep3,
  type AppStoreStep5,
} from "@/lib/validations/app-store";
import { useT } from "@/components/i18n/LanguageProvider";

const STORAGE_KEY = "as_draft";

interface FormState {
  step1?: AppStoreStep1;
  step2?: AppStoreStep2;
  step3?: AppStoreStep3;
  step5?: AppStoreStep5;
}

export function AppStoreForm({ pricing }: { pricing: Pricing }) {
  const t = useT();
  const STEPS = [
    t.form.stepClient,
    t.form.stepApp,
    t.form.stepGithub,
    t.form.stepGraphics,
    t.form.stepExtra,
  ];
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formState, setFormState] = useState<FormState>({});
  const [submitStatus, setSubmitStatus] = useState<"idle" | "loading" | "error">("idle");
  const [submitError, setSubmitError] = useState("");
  const [progress, setProgress] = useState(0);
  const [showTerms, setShowTerms] = useState(false);
  const progressRef = useRef(0);
  const pendingStep5 = useRef<AppStoreStep5 | null>(null);
  function setP(v: number) { const c = Math.min(100, Math.round(v)); progressRef.current = c; setProgress(c); }

  // Step 4 graphics
  const [iphoneScreenshots, setIphoneScreenshots] = useState<File[]>([]);
  const [ipadScreenshots, setIpadScreenshots] = useState<File[]>([]);
  const [iphoneError, setIphoneError] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const s = parsed.formState || {};
        setFormState(s);
        setStep(parsed.step || 1);
        if (s.step1) form1.reset(s.step1);
        if (s.step2) form2.reset(s.step2);
        if (s.step3) form3.reset(s.step3);
        if (s.step5) form5.reset(s.step5);
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (step === 1 && formState.step1) form1.reset(formState.step1);
    if (step === 2 && formState.step2) form2.reset(formState.step2);
    if (step === 3 && formState.step3) form3.reset(formState.step3);
    if (step === 5 && formState.step5) form5.reset(formState.step5);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function saveDraft(newState: FormState, newStep: number) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ formState: newState, step: newStep }));
    } catch {}
  }

  const form1 = useForm<AppStoreStep1>({
    resolver: zodResolver(useMemo(() => makeAppStoreStep1Schema(t), [t])),
    defaultValues: formState.step1 || { fullName: "", phone: "", email: "", telegram: "" },
  });

  const form2 = useForm<AppStoreStep2>({
    resolver: zodResolver(useMemo(() => makeAppStoreStep2Schema(t), [t])),
    defaultValues: formState.step2 || { appName: "", subtitle: "", fullDescription: "", privacyPolicyUrl: "", supportUrl: "" },
  });
  const fullDescValue = form2.watch("fullDescription") || "";

  const form3 = useForm<AppStoreStep3>({
    resolver: zodResolver(useMemo(() => makeAppStoreStep3Schema(t), [t])),
    defaultValues: formState.step3 || { githubRepoUrl: "" },
  });

  const form5 = useForm<AppStoreStep5>({
    resolver: zodResolver(appStoreStep5Schema),
    defaultValues: formState.step5 || {},
  });

  function onStep1Submit(data: AppStoreStep1) {
    const newState = { ...formState, step1: data };
    setFormState(newState);
    saveDraft(newState, 2);
    setStep(2);
  }

  function onStep2Submit(data: AppStoreStep2) {
    const newState = { ...formState, step2: data };
    setFormState(newState);
    saveDraft(newState, 3);
    setStep(3);
  }

  function onStep3Submit(data: AppStoreStep3) {
    const newState = { ...formState, step3: data };
    setFormState(newState);
    saveDraft(newState, 4);
    setStep(4);
  }

  function onStep4Next() {
    if (iphoneScreenshots.length < 3) { setIphoneError(t.appStoreForm.iphoneRequired); return; }
    setIphoneError("");
    saveDraft(formState, 5);
    setStep(5);
  }

  // Step 5 to'g'ri to'ldirilgach — shartlar modalini ochamiz
  function onStep5Submit(data: AppStoreStep5) {
    setFormState((s) => ({ ...s, step5: data }));
    pendingStep5.current = data;
    setShowTerms(true);
  }

  // Shartlar tasdiqlangach — haqiqiy yuborish
  async function doSubmit() {
    const data = pendingStep5.current;
    if (!data) return;
    setShowTerms(false);
    const newState = { ...formState, step5: data };
    setSubmitStatus("loading");
    setSubmitError("");
    setP(0);

    const formData = new FormData();
    const allData = { ...newState.step1, ...newState.step2, ...newState.step3, ...data };
    Object.entries(allData).forEach(([k, v]) => { if (v) formData.append(k, String(v)); });

    // Skrinshotlarni siqamiz (o'lcham saqlanadi) — katta PNG'lar 413 bermasligi uchun
    const [iphoneC, ipadC] = await Promise.all([
      compressImages(iphoneScreenshots),
      compressImages(ipadScreenshots),
    ]);
    iphoneC.forEach((s, i) => formData.append(`iphone_${i}`, s));
    formData.append("iphoneCount", String(iphoneC.length));
    ipadC.forEach((s, i) => formData.append(`ipad_${i}`, s));
    formData.append("ipadCount", String(ipadC.length));

    let serverIntervalId: ReturnType<typeof setInterval> | null = null;

    function startServerAnim() {
      serverIntervalId = setInterval(() => {
        const next = Math.min(progressRef.current + 0.12, 94);
        setP(next);
        if (progressRef.current >= 94 && serverIntervalId) {
          clearInterval(serverIntervalId); serverIntervalId = null;
        }
      }, 100);
    }

    function stopServerAnim() {
      if (serverIntervalId) { clearInterval(serverIntervalId); serverIntervalId = null; }
    }

    try {
      const json = await xhrUpload(
        "/api/submit/app-store",
        formData,
        (uploadPct) => setP(uploadPct * 0.8),
        startServerAnim,
      );
      stopServerAnim();
      await animateProgress(progressRef.current, 100, 500);
      if (!json.success) throw new Error(json.error || json.message || t.common.error);
      localStorage.removeItem(STORAGE_KEY);
      await new Promise((r) => setTimeout(r, 500));
      router.push(`/success?service=app-store&appId=${json.id}`);
    } catch (err: unknown) {
      stopServerAnim();
      setSubmitStatus("error");
      setSubmitError(err instanceof Error ? err.message : t.form.unexpectedError);
    }
  }

  function xhrUpload(
    url: string,
    data: FormData,
    onProgress: (pct: number) => void,
    onUploadDone: () => void,
  ): Promise<{ success: boolean; error?: string; message?: string; id?: string }> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress((e.loaded / e.total) * 100);
      };
      xhr.upload.onload = () => onUploadDone();
      xhr.onload = () => {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          console.error("[Submit] Status:", xhr.status, "Response:", xhr.responseText.slice(0, 300));
          reject(new Error(t.form.serverError(xhr.status)));
        }
      };
      xhr.onerror = () => reject(new Error(t.form.networkError));
      xhr.ontimeout = () => reject(new Error(t.form.timeoutError));
      xhr.timeout = 180000;
      xhr.send(data);
    });
  }

  function animateProgress(from: number, to: number, durationMs: number): Promise<void> {
    return new Promise((resolve) => {
      const steps = 20;
      const stepMs = durationMs / steps;
      const stepVal = (to - from) / steps;
      let current = from; let count = 0;
      const interval = setInterval(() => {
        count++; current += stepVal;
        setP(Math.min(current, to));
        if (count >= steps) { clearInterval(interval); resolve(); }
      }, stepMs);
    });
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {showTerms && (
        <TermsConfirmModal service="publish" pricing={pricing} onConfirm={doSubmit} onClose={() => setShowTerms(false)} />
      )}
      {submitStatus === "loading" && <SubmitProgressOverlay progress={progress} />}
      {submitStatus === "error" && (
        <SubmitProgressOverlay
          progress={progress}
          error={submitError}
          onRetry={() => { setSubmitStatus("idle"); setProgress(0); setSubmitError(""); }}
        />
      )}

      <StepProgress steps={STEPS} currentStep={step} />

      <div className="mt-8">
        {step === 1 && (
          <form onSubmit={form1.handleSubmit(onStep1Submit)} className="flex flex-col gap-5">
            <h2 className="text-xl font-semibold text-gray-900">{t.form.sectionClient}</h2>
            <Input label={t.form.fullName} required placeholder={t.form.fullNamePlaceholder} {...form1.register("fullName")} error={form1.formState.errors.fullName?.message} />
            <Input label={t.form.phoneNumber} required placeholder={t.form.phonePlaceholder} {...form1.register("phone")} error={form1.formState.errors.phone?.message} />
            <Input label={t.form.email} type="email" required placeholder={t.form.emailPlaceholder} {...form1.register("email")} error={form1.formState.errors.email?.message} />
            <Input label={t.form.telegram} placeholder={t.form.telegramPlaceholder} {...form1.register("telegram")} hint={t.form.telegramHint} />
            <div className="flex justify-end">
              <Button type="submit" size="lg">{t.form.continue}</Button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={form2.handleSubmit(onStep2Submit)} className="flex flex-col gap-5">
            <h2 className="text-xl font-semibold text-gray-900">{t.form.sectionApp}</h2>
            <Input label={t.appStoreForm.appName} required placeholder={t.appStoreForm.appNamePlaceholder} maxLength={30} {...form2.register("appName")} error={form2.formState.errors.appName?.message} hint={t.appStoreForm.max30} />
            <Input label={t.appStoreForm.subtitle} required placeholder={t.appStoreForm.subtitlePlaceholder} maxLength={30} {...form2.register("subtitle")} error={form2.formState.errors.subtitle?.message} hint={t.appStoreForm.max30} />
            <Textarea
              label={t.appStoreForm.fullDesc}
              required
              placeholder={t.appStoreForm.fullDescPlaceholder}
              rows={6}
              charCount={fullDescValue.length}
              maxChars={4000}
              {...form2.register("fullDescription")}
              error={form2.formState.errors.fullDescription?.message}
            />
            <Input label={t.appStoreForm.privacyUrl} type="url" required placeholder={t.appStoreForm.privacyUrlPlaceholder} {...form2.register("privacyPolicyUrl")} error={form2.formState.errors.privacyPolicyUrl?.message} hint={t.appStoreForm.httpsHint} />
            <Input label={t.appStoreForm.supportUrl} type="url" required placeholder={t.appStoreForm.supportUrlPlaceholder} {...form2.register("supportUrl")} error={form2.formState.errors.supportUrl?.message} hint={t.appStoreForm.supportUrlHint} />
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" size="lg" onClick={() => {
                const ns = { ...formState, step2: form2.getValues() };
                setFormState(ns); saveDraft(ns, 1); setStep(1);
              }}>{t.form.backArrow}</Button>
              <Button type="submit" size="lg">{t.form.continue}</Button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={form3.handleSubmit(onStep3Submit)} className="flex flex-col gap-5">
            <h2 className="text-xl font-semibold text-gray-900">{t.appStoreForm.githubTitle}</h2>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
              <p className="font-semibold mb-1">{t.appStoreForm.collaboratorTitle}</p>
              <p>
                {t.appStoreForm.collaboratorPre}{" "}
                <a
                  href="https://github.com/ahadjonovss"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono font-bold underline"
                >
                  @ahadjonovss
                </a>{" "}
                {t.appStoreForm.collaboratorPost}
              </p>
              <p className="mt-1 text-xs text-blue-600 font-mono">
                {t.appStoreForm.collaboratorPath}
              </p>
            </div>

            <Input
              label={t.appStoreForm.repoUrl}
              type="url"
              required
              placeholder={t.appStoreForm.repoUrlPlaceholder}
              {...form3.register("githubRepoUrl")}
              error={form3.formState.errors.githubRepoUrl?.message}
            />

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" size="lg" onClick={() => {
                const ns = { ...formState, step3: form3.getValues() };
                setFormState(ns); saveDraft(ns, 2); setStep(2);
              }}>{t.form.backArrow}</Button>
              <Button type="submit" size="lg">{t.form.continue}</Button>
            </div>
          </form>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-6">
            <h2 className="text-xl font-semibold text-gray-900">{t.form.sectionGraphics}</h2>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">{t.appStoreForm.iphoneTitle}</p>
              <p className="text-xs text-gray-500 mb-3">{t.appStoreForm.iphoneHint}</p>
              <ImageUpload
                label={t.appStoreForm.iphoneLabel}
                required
                value={iphoneScreenshots}
                onChange={setIphoneScreenshots}
                error={iphoneError}
                validation={{ width: 1320, height: 2868, maxSizeMB: 8, strict: false }}
                multiple={true}
                minCount={3}
                maxCount={10}
              />
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">{t.appStoreForm.ipadTitle}</p>
              <p className="text-xs text-gray-500 mb-3">{t.appStoreForm.ipadHint}</p>
              <ImageUpload
                label={t.appStoreForm.ipadLabel}
                value={ipadScreenshots}
                onChange={setIpadScreenshots}
                validation={{ width: 2048, height: 2732, maxSizeMB: 8, strict: false }}
                multiple={true}
                maxCount={10}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" size="lg" onClick={() => { saveDraft(formState, 3); setStep(3); }}>{t.form.backArrow}</Button>
              <Button type="button" size="lg" onClick={onStep4Next}>{t.form.continue}</Button>
            </div>
          </div>
        )}

        {step === 5 && (
          <form onSubmit={form5.handleSubmit(onStep5Submit)} className="flex flex-col gap-5">
            <h2 className="text-xl font-semibold text-gray-900">{t.form.sectionExtra}</h2>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
              <p className="font-semibold mb-1">{t.form.testAccountTitle}</p>
              <p>{t.appStoreForm.testAccountBody}</p>
            </div>

            <Input label={t.form.testLogin} placeholder={t.form.testLoginPlaceholder} {...form5.register("testLogin")} hint={t.form.testLoginHint} />
            <PasswordInput label={t.form.testPassword} placeholder="••••••••" {...form5.register("testPassword")} />
            <Textarea label={t.form.note} placeholder={t.form.notePlaceholder} rows={4} {...form5.register("note")} />

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" size="lg" onClick={() => {
                const ns = { ...formState, step5: form5.getValues() };
                setFormState(ns); saveDraft(ns, 4); setStep(4);
              }}>{t.form.backArrow}</Button>
              <Button type="submit" size="lg">{t.form.submitCheck}</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
