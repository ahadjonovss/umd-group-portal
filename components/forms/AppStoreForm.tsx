"use client";

import { useState, useEffect, useRef } from "react";
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

import {
  appStoreStep1Schema,
  appStoreStep2Schema,
  appStoreStep3Schema,
  appStoreStep5Schema,
  type AppStoreStep1,
  type AppStoreStep2,
  type AppStoreStep3,
  type AppStoreStep5,
} from "@/lib/validations/app-store";

const STORAGE_KEY = "as_draft";
const STEPS = ["Mijoz", "Ilova", "GitHub", "Grafika", "Qo'shimcha"];

interface FormState {
  step1?: AppStoreStep1;
  step2?: AppStoreStep2;
  step3?: AppStoreStep3;
  step5?: AppStoreStep5;
}

export function AppStoreForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formState, setFormState] = useState<FormState>({});
  const [submitStatus, setSubmitStatus] = useState<"idle" | "loading" | "error">("idle");
  const [submitError, setSubmitError] = useState("");
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
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
    resolver: zodResolver(appStoreStep1Schema),
    defaultValues: formState.step1 || { fullName: "", phone: "", email: "", telegram: "" },
  });

  const form2 = useForm<AppStoreStep2>({
    resolver: zodResolver(appStoreStep2Schema),
    defaultValues: formState.step2 || { appName: "", subtitle: "", fullDescription: "", privacyPolicyUrl: "", supportUrl: "" },
  });
  const fullDescValue = form2.watch("fullDescription") || "";

  const form3 = useForm<AppStoreStep3>({
    resolver: zodResolver(appStoreStep3Schema),
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
    if (iphoneScreenshots.length < 3) { setIphoneError("Kamida 3 ta iPhone skrinshot talab qilinadi"); return; }
    setIphoneError("");
    saveDraft(formState, 5);
    setStep(5);
  }

  async function onStep5Submit(data: AppStoreStep5) {
    const newState = { ...formState, step5: data };
    setFormState(newState);
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
      if (!json.success) throw new Error(json.error || json.message || "Xato yuz berdi");
      localStorage.removeItem(STORAGE_KEY);
      await new Promise((r) => setTimeout(r, 500));
      router.push("/success?service=app-store");
    } catch (err: unknown) {
      stopServerAnim();
      setSubmitStatus("error");
      setSubmitError(err instanceof Error ? err.message : "Kutilmagan xato");
    }
  }

  function xhrUpload(
    url: string,
    data: FormData,
    onProgress: (pct: number) => void,
    onUploadDone: () => void,
  ): Promise<{ success: boolean; error?: string; message?: string }> {
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
          reject(new Error(`Server xatosi (${xhr.status}). Qayta urinib ko'ring.`));
        }
      };
      xhr.onerror = () => reject(new Error("Tarmoq xatosi yuz berdi"));
      xhr.ontimeout = () => reject(new Error("So'rov vaqti tugadi (3 daqiqa)"));
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
            <h2 className="text-xl font-semibold text-gray-900">Mijoz ma&apos;lumotlari</h2>
            <Input label="To'liq ism" required placeholder="Sardor Abdullayev" {...form1.register("fullName")} error={form1.formState.errors.fullName?.message} />
            <Input label="Telefon raqami" required placeholder="+998901234567" {...form1.register("phone")} error={form1.formState.errors.phone?.message} />
            <Input label="Email" type="email" required placeholder="email@example.com" {...form1.register("email")} error={form1.formState.errors.email?.message} />
            <Input label="Telegram username" placeholder="@username" {...form1.register("telegram")} hint="Ixtiyoriy — tezkor bog'lanish uchun" />
            <div className="flex justify-end">
              <Button type="submit" size="lg">Davom etish →</Button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={form2.handleSubmit(onStep2Submit)} className="flex flex-col gap-5">
            <h2 className="text-xl font-semibold text-gray-900">Ilova tafsilotlari</h2>
            <Input label="Ilova nomi" required placeholder="MyApp" maxLength={30} {...form2.register("appName")} error={form2.formState.errors.appName?.message} hint="Max 30 belgi" />
            <Input label="Subtitle (qisqa tavsif)" required placeholder="Best app for..." maxLength={30} {...form2.register("subtitle")} error={form2.formState.errors.subtitle?.message} hint="Max 30 belgi" />
            <Textarea
              label="To'liq tavsif"
              required
              placeholder="Ilovangiz haqida batafsil..."
              rows={6}
              charCount={fullDescValue.length}
              maxChars={4000}
              {...form2.register("fullDescription")}
              error={form2.formState.errors.fullDescription?.message}
            />
            <Input label="Privacy Policy URL" type="url" required placeholder="https://yourapp.com/privacy" {...form2.register("privacyPolicyUrl")} error={form2.formState.errors.privacyPolicyUrl?.message} hint="HTTPS bilan boshlanishi shart" />
            <Input label="Support URL" type="url" required placeholder="https://yourapp.com/support" {...form2.register("supportUrl")} error={form2.formState.errors.supportUrl?.message} hint="Foydalanuvchilar murojaat qiladigan sahifa (HTTPS)" />
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" size="lg" onClick={() => {
                const ns = { ...formState, step2: form2.getValues() };
                setFormState(ns); saveDraft(ns, 1); setStep(1);
              }}>← Orqaga</Button>
              <Button type="submit" size="lg">Davom etish →</Button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={form3.handleSubmit(onStep3Submit)} className="flex flex-col gap-5">
            <h2 className="text-xl font-semibold text-gray-900">GitHub Repository</h2>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
              <p className="font-semibold mb-1">Muhim: Collaborator qo&apos;shing</p>
              <p>
                Repo-ga{" "}
                <a
                  href="https://github.com/ahadjonovss"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono font-bold underline"
                >
                  @ahadjonovss
                </a>{" "}
                ni collaborator sifatida qo&apos;shing:
              </p>
              <p className="mt-1 text-xs text-blue-600 font-mono">
                Settings → Collaborators → Add people → ahadjonovss
              </p>
            </div>

            <Input
              label="GitHub repo URL"
              type="url"
              required
              placeholder="https://github.com/username/repo"
              {...form3.register("githubRepoUrl")}
              error={form3.formState.errors.githubRepoUrl?.message}
            />

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" size="lg" onClick={() => {
                const ns = { ...formState, step3: form3.getValues() };
                setFormState(ns); saveDraft(ns, 2); setStep(2);
              }}>← Orqaga</Button>
              <Button type="submit" size="lg">Davom etish →</Button>
            </div>
          </form>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-6">
            <h2 className="text-xl font-semibold text-gray-900">Grafik materiallar</h2>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">iPhone skrinshotlari</p>
              <p className="text-xs text-gray-500 mb-3">Kamida 3 ta • iPhone 6.9&quot;: 1320×2868 px yoki 6.5&quot;: 1242×2688 px</p>
              <ImageUpload
                label="iPhone skrinshotlari (kamida 3 ta, max 10 ta)"
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
              <p className="text-sm font-medium text-gray-700 mb-1">iPad skrinshotlari (ixtiyoriy)</p>
              <p className="text-xs text-gray-500 mb-3">iPad 12.9&quot;: 2048×2732 px yoki 11&quot;: 1668×2388 px</p>
              <ImageUpload
                label="iPad skrinshotlari"
                value={ipadScreenshots}
                onChange={setIpadScreenshots}
                validation={{ width: 2048, height: 2732, maxSizeMB: 8, strict: false }}
                multiple={true}
                maxCount={10}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" size="lg" onClick={() => { saveDraft(formState, 3); setStep(3); }}>← Orqaga</Button>
              <Button type="button" size="lg" onClick={onStep4Next}>Davom etish →</Button>
            </div>
          </div>
        )}

        {step === 5 && (
          <form onSubmit={form5.handleSubmit(onStep5Submit)} className="flex flex-col gap-5">
            <h2 className="text-xl font-semibold text-gray-900">Qo&apos;shimcha ma&apos;lumotlar</h2>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
              <p className="font-semibold mb-1">⚠️ Test akkaunt majburiy</p>
              <p>
                Ilovangizda login yoki ro&apos;yxatdan o&apos;tish talab qilinsa, App Store
                ko&apos;rib chiquvchilari ilovani tekshirish uchun test akkaunt
                ma&apos;lumotlarini talab qiladi. Aks holda ariza rad etilishi mumkin.
              </p>
            </div>

            <Input label="Test login" placeholder="test@example.com" {...form5.register("testLogin")} hint="Ixtiyoriy — login talab qilinmasa bo'sh qoldiring" />
            <PasswordInput label="Test parol" placeholder="••••••••" {...form5.register("testPassword")} />
            <Textarea label="Izoh" placeholder="Qo'shimcha ma'lumot..." rows={4} {...form5.register("note")} />

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" size="lg" onClick={() => {
                const ns = { ...formState, step5: form5.getValues() };
                setFormState(ns); saveDraft(ns, 4); setStep(4);
              }}>← Orqaga</Button>
              <Button type="submit" size="lg">Yuborish ✓</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
