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
  makePlayMarketStep1Schema,
  makePlayMarketStep2Schema,
  playMarketStep5Schema,
  type PlayMarketStep1,
  type PlayMarketStep2,
  type PlayMarketStep5,
} from "@/lib/validations/play-market";
import { useT } from "@/components/i18n/LanguageProvider";

const STORAGE_KEY = "pm_draft";

interface FormState {
  step1?: PlayMarketStep1;
  step2?: PlayMarketStep2;
  step4?: PlayMarketStep5;
}

export function PlayMarketForm({ pricing }: { pricing: Pricing }) {
  const t = useT();
  const STEPS = [
    t.form.stepClient,
    t.form.stepApp,
    t.form.stepGraphics,
    t.form.stepExtra,
    t.form.stepFile,
  ];
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formState, setFormState] = useState<FormState>({});
  const [submitStatus, setSubmitStatus] = useState<"idle" | "loading" | "error">("idle");
  const [submitError, setSubmitError] = useState("");
  const [progress, setProgress] = useState(0);
  const [showTerms, setShowTerms] = useState(false);
  const progressRef = useRef(0);
  function setP(v: number) { const c = Math.min(100, Math.round(v)); progressRef.current = c; setProgress(c); }

  // Graphics (step 3)
  const [icon, setIcon] = useState<File | null>(null);
  const [banner, setBanner] = useState<File | null>(null);
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [iconError, setIconError] = useState("");
  const [bannerError, setBannerError] = useState("");
  const [screenshotError, setScreenshotError] = useState("");


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
        if (s.step4) form4.reset(s.step4);
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Step o'zgarganda formani formState dan tiklash
  useEffect(() => {
    if (step === 1 && formState.step1) form1.reset(formState.step1);
    if (step === 2 && formState.step2) form2.reset(formState.step2);
    if (step === 4 && formState.step4) form4.reset(formState.step4);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function saveDraft(newState: FormState, newStep: number) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ formState: newState, step: newStep }));
    } catch {}
  }

  const form1 = useForm<PlayMarketStep1>({
    resolver: zodResolver(useMemo(() => makePlayMarketStep1Schema(t), [t])),
    defaultValues: formState.step1 || { fullName: "", phone: "", email: "" },
  });

  const form2 = useForm<PlayMarketStep2>({
    resolver: zodResolver(useMemo(() => makePlayMarketStep2Schema(t), [t])),
    defaultValues: formState.step2 || { appName: "", packageName: "", shortDescription: "", fullDescription: "", privacyPolicyUrl: "" },
  });
  const fullDescValue = form2.watch("fullDescription") || "";

  const form4 = useForm<PlayMarketStep5>({
    resolver: zodResolver(playMarketStep5Schema),
    defaultValues: formState.step4 || { testLogin: "", testPassword: "", note: "" },
  });

  function onStep1Submit(data: PlayMarketStep1) {
    const newState = { ...formState, step1: data };
    setFormState(newState);
    saveDraft(newState, 2);
    setStep(2);
  }

  function onStep2Submit(data: PlayMarketStep2) {
    const newState = { ...formState, step2: data };
    setFormState(newState);
    saveDraft(newState, 3);
    setStep(3);
  }

  function onStep3Next() {
    let valid = true;
    if (!icon) { setIconError(t.playMarketForm.iconRequired); valid = false; } else { setIconError(""); }
    if (!banner) { setBannerError(t.playMarketForm.bannerRequired); valid = false; } else { setBannerError(""); }
    if (screenshots.length < 2) { setScreenshotError(t.playMarketForm.screenshotsRequired); valid = false; } else { setScreenshotError(""); }
    if (!valid) return;
    saveDraft(formState, 4);
    setStep(4);
  }

  function onStep4Submit(data: PlayMarketStep5) {
    const newState = { ...formState, step4: data };
    setFormState(newState);
    saveDraft(newState, 5);
    setStep(5);
  }

  // Yakuniy tugma — avval shartlar modalini ochamiz
  function onStep5Submit() {
    setShowTerms(true);
  }

  // Shartlar tasdiqlangach — haqiqiy yuborish
  async function doSubmit() {
    setShowTerms(false);
    setSubmitStatus("loading");
    setSubmitError("");
    setP(0);

    const formData = new FormData();
    const allData = { ...formState.step1, ...formState.step2, ...formState.step4 };
    Object.entries(allData).forEach(([k, v]) => { if (v) formData.append(k, String(v)); });
    formData.append("icon", icon!); // ikonka PNG bo'lib qoladi (Play Store talabi)
    formData.append("banner", banner!);
    // Skrinshotlarni siqamiz (o'lcham saqlanadi) — 413 bermasligi uchun
    const screenshotsC = await compressImages(screenshots);
    screenshotsC.forEach((s, i) => formData.append(`screenshot_${i}`, s));
    formData.append("screenshotCount", String(screenshotsC.length));

    let serverIntervalId: ReturnType<typeof setInterval> | null = null;

    function startServerAnim() {
      serverIntervalId = setInterval(() => {
        const next = Math.min(progressRef.current + 0.12, 94);
        setP(next);
        if (progressRef.current >= 94 && serverIntervalId) {
          clearInterval(serverIntervalId);
          serverIntervalId = null;
        }
      }, 100);
    }

    function stopServerAnim() {
      if (serverIntervalId) { clearInterval(serverIntervalId); serverIntervalId = null; }
    }

    try {
      const json = await xhrUpload(
        "/api/submit/play-market",
        formData,
        (uploadPct) => setP(uploadPct * 0.8),
        startServerAnim,
      );

      stopServerAnim();
      await animateProgress(progressRef.current, 100, 500);

      if (!json.success) throw new Error(json.error || json.message || t.common.error);

      localStorage.removeItem(STORAGE_KEY);
      await new Promise((r) => setTimeout(r, 500));
      router.push(`/success?service=play-market&appId=${json.id}`);
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
      {submitStatus === "loading" && (
        <SubmitProgressOverlay progress={progress} />
      )}
      {submitStatus === "error" && (
        <SubmitProgressOverlay
          progress={progress}
          error={submitError}
          onRetry={() => { setSubmitStatus("idle"); setProgress(0); setSubmitError(""); }}
        />
      )}

      <StepProgress steps={STEPS} currentStep={step} />

      <div className="mt-8">
        {/* Step 1 — Mijoz */}
        {step === 1 && (
          <form onSubmit={form1.handleSubmit(onStep1Submit)} className="flex flex-col gap-5">
            <h2 className="text-xl font-semibold text-gray-900">{t.form.sectionClient}</h2>
            <Input label={t.form.fullName} required placeholder={t.form.fullNamePlaceholder} {...form1.register("fullName")} error={form1.formState.errors.fullName?.message} />
            <Input label={t.form.phoneNumber} required placeholder={t.form.phonePlaceholder} {...form1.register("phone")} error={form1.formState.errors.phone?.message} />
            <Input label={t.form.email} type="email" required placeholder={t.form.emailPlaceholder} {...form1.register("email")} error={form1.formState.errors.email?.message} />
            <div className="flex justify-end">
              <Button type="submit" size="lg">{t.form.continue}</Button>
            </div>
          </form>
        )}

        {/* Step 2 — Ilova */}
        {step === 2 && (
          <form onSubmit={form2.handleSubmit(onStep2Submit)} className="flex flex-col gap-5">
            <h2 className="text-xl font-semibold text-gray-900">{t.form.sectionApp}</h2>
            <Input label={t.playMarketForm.appName} required placeholder={t.playMarketForm.appNamePlaceholder} maxLength={30} {...form2.register("appName")} error={form2.formState.errors.appName?.message} hint={t.playMarketForm.max30} />
            <Input label={t.playMarketForm.packageName} required placeholder={t.playMarketForm.packageNamePlaceholder} {...form2.register("packageName")} error={form2.formState.errors.packageName?.message} hint={t.playMarketForm.packageNameHint} />
            <Input label={t.playMarketForm.shortDesc} required placeholder={t.playMarketForm.shortDescPlaceholder} maxLength={80} {...form2.register("shortDescription")} error={form2.formState.errors.shortDescription?.message} hint={t.playMarketForm.max80} />
            <Textarea
              label={t.playMarketForm.fullDesc}
              required
              placeholder={t.playMarketForm.fullDescPlaceholder}
              rows={6}
              charCount={fullDescValue.length}
              maxChars={4000}
              {...form2.register("fullDescription")}
              error={form2.formState.errors.fullDescription?.message}
            />
            <Input label={t.playMarketForm.privacyUrl} type="url" required placeholder={t.playMarketForm.privacyUrlPlaceholder} {...form2.register("privacyPolicyUrl")} error={form2.formState.errors.privacyPolicyUrl?.message} hint={t.playMarketForm.httpsHint} />
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" size="lg" onClick={() => {
                const ns = { ...formState, step2: form2.getValues() };
                setFormState(ns); saveDraft(ns, 1); setStep(1);
              }}>{t.form.backArrow}</Button>
              <Button type="submit" size="lg">{t.form.continue}</Button>
            </div>
          </form>
        )}

        {/* Step 3 — Grafika */}
        {step === 3 && (
          <div className="flex flex-col gap-6">
            <h2 className="text-xl font-semibold text-gray-900">{t.form.sectionGraphics}</h2>
            <ImageUpload
              label={t.playMarketForm.icon}
              required
              value={icon}
              onChange={setIcon}
              error={iconError}
              validation={{ width: 512, height: 512, maxSizeMB: 1, strict: true }}
            />
            <ImageUpload
              label={t.playMarketForm.banner}
              required
              value={banner}
              onChange={setBanner}
              error={bannerError}
              validation={{ width: 1024, height: 500, maxSizeMB: 1, strict: true }}
            />
            <ImageUpload
              label={t.playMarketForm.screenshots}
              required
              value={screenshots}
              onChange={setScreenshots}
              error={screenshotError}
              validation={{ width: 1080, height: 1920, maxSizeMB: 8, strict: false }}
              multiple={true}
              minCount={2}
              maxCount={8}
            />
            {screenshotError && <p className="text-xs text-red-600">❌ {screenshotError}</p>}
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" size="lg" onClick={() => { saveDraft(formState, 2); setStep(2); }}>{t.form.backArrow}</Button>
              <Button type="button" size="lg" onClick={onStep3Next}>{t.form.continue}</Button>
            </div>
          </div>
        )}

        {/* Step 4 — Qo'shimcha */}
        {step === 4 && (
          <form onSubmit={form4.handleSubmit(onStep4Submit)} className="flex flex-col gap-5">
            <h2 className="text-xl font-semibold text-gray-900">{t.form.sectionExtra}</h2>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
              <p className="font-semibold mb-1">{t.form.testAccountTitle}</p>
              <p>{t.playMarketForm.testAccountBody}</p>
            </div>

            <Input label={t.form.testLogin} placeholder={t.form.testLoginPlaceholder} {...form4.register("testLogin")} hint={t.form.testLoginHint} />
            <PasswordInput label={t.form.testPassword} placeholder="••••••••" {...form4.register("testPassword")} />
            <Textarea label={t.form.noteWithExtra} placeholder={t.form.notePlaceholder} rows={4} {...form4.register("note")} />
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" size="lg" onClick={() => {
                const ns = { ...formState, step4: form4.getValues() };
                setFormState(ns); saveDraft(ns, 3); setStep(3);
              }}>{t.form.backArrow}</Button>
              <Button type="submit" size="lg">{t.form.continue}</Button>
            </div>
          </form>
        )}

        {/* Step 5 — Tasdiqlash va yuborish */}
        {step === 5 && (
          <div className="flex flex-col gap-5">
            <h2 className="text-xl font-semibold text-gray-900">{t.playMarketForm.readyTitle}</h2>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 13.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.496.969z"/>
                </svg>
                {t.playMarketForm.aabTitle}
              </p>
              <p className="text-sm text-blue-700 mb-3">
                {t.playMarketForm.aabBodyPre} <strong>{t.playMarketForm.aabBodyFile}</strong> {t.playMarketForm.aabBodyPost}
              </p>
              <div className="bg-white rounded-lg px-3 py-2 text-sm font-mono font-bold text-blue-700 border border-blue-200 inline-block">
                @umdgroupadmin
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" size="lg" onClick={() => { saveDraft(formState, 4); setStep(4); }}>
                {t.form.backArrow}
              </Button>
              <Button type="button" size="lg" onClick={onStep5Submit}>
                {t.form.submitCheck}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
