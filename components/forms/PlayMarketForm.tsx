"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { StepProgress } from "@/components/StepProgress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/FileUpload";
import { ImageUpload } from "@/components/ImageUpload";
import { SubmitProgressOverlay } from "@/components/SubmitProgressOverlay";

import {
  playMarketStep1Schema,
  playMarketStep2Schema,
  playMarketStep5Schema,
  type PlayMarketStep1,
  type PlayMarketStep2,
  type PlayMarketStep5,
} from "@/lib/validations/play-market";

const STORAGE_KEY = "pm_draft";
const STEPS = ["Mijoz", "Ilova", "Grafika", "Qo'shimcha", "Fayl"];

interface FormState {
  step1?: PlayMarketStep1;
  step2?: PlayMarketStep2;
  step4?: PlayMarketStep5;
}

export function PlayMarketForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formState, setFormState] = useState<FormState>({});
  const [submitStatus, setSubmitStatus] = useState<"idle" | "loading" | "error">("idle");
  const [submitError, setSubmitError] = useState("");
  const [progress, setProgress] = useState(0);

  // Graphics (step 3)
  const [icon, setIcon] = useState<File | null>(null);
  const [banner, setBanner] = useState<File | null>(null);
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [iconError, setIconError] = useState("");
  const [bannerError, setBannerError] = useState("");
  const [screenshotError, setScreenshotError] = useState("");

  // AAB file (step 5)
  const [aabFile, setAabFile] = useState<File | null>(null);
  const [aabError, setAabError] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormState(parsed.formState || {});
        setStep(parsed.step || 1);
      }
    } catch {}
  }, []);

  function saveDraft(newState: FormState, newStep: number) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ formState: newState, step: newStep }));
    } catch {}
  }

  const form1 = useForm<PlayMarketStep1>({
    resolver: zodResolver(playMarketStep1Schema),
    defaultValues: formState.step1 || { fullName: "", phone: "", email: "" },
  });

  const form2 = useForm<PlayMarketStep2>({
    resolver: zodResolver(playMarketStep2Schema),
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
    if (!icon) { setIconError("Ilova ikonasi majburiy"); valid = false; } else { setIconError(""); }
    if (!banner) { setBannerError("Feature Graphic majburiy"); valid = false; } else { setBannerError(""); }
    if (screenshots.length < 2) { setScreenshotError("Kamida 2 ta skrinshot talab qilinadi"); valid = false; } else { setScreenshotError(""); }
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

  async function onStep5Submit() {
    if (!aabFile) { setAabError("AAB fayl majburiy"); return; }
    setAabError("");
    setSubmitStatus("loading");
    setSubmitError("");
    setProgress(0);

    const formData = new FormData();
    const allData = { ...formState.step1, ...formState.step2, ...formState.step4 };
    Object.entries(allData).forEach(([k, v]) => { if (v) formData.append(k, String(v)); });
    formData.append("aabFile", aabFile);
    formData.append("icon", icon!);
    formData.append("banner", banner!);
    screenshots.forEach((s, i) => formData.append(`screenshot_${i}`, s));
    formData.append("screenshotCount", String(screenshots.length));

    try {
      const json = await xhrUpload("/api/submit/play-market", formData, (pct) => {
        // Upload 0→80% real, keyin server javobi 80→100
        setProgress(Math.round(pct * 0.8));
      });

      // Server javobi keldi, 80→100 animatsiya
      await animateProgress(80, 100, 600);

      if (!json.success) throw new Error(json.error || json.message || "Xato yuz berdi");

      localStorage.removeItem(STORAGE_KEY);
      await new Promise((r) => setTimeout(r, 500));
      router.push("/success?service=play-market");
    } catch (err: unknown) {
      setSubmitStatus("error");
      setSubmitError(err instanceof Error ? err.message : "Kutilmagan xato");
    }
  }

  function xhrUpload(url: string, data: FormData, onProgress: (pct: number) => void): Promise<{ success: boolean; error?: string; message?: string }> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress((e.loaded / e.total) * 100);
      };
      xhr.onload = () => {
        try { resolve(JSON.parse(xhr.responseText)); }
        catch { reject(new Error("Server javobi noto'g'ri")); }
      };
      xhr.onerror = () => reject(new Error("Tarmoq xatosi yuz berdi"));
      xhr.ontimeout = () => reject(new Error("So'rov vaqti tugadi"));
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
        setProgress(Math.min(Math.round(current), to));
        if (count >= steps) { clearInterval(interval); resolve(); }
      }, stepMs);
    });
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
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
            <h2 className="text-xl font-semibold text-gray-900">Mijoz ma&apos;lumotlari</h2>
            <Input label="To'liq ism" required placeholder="Sardor Abdullayev" {...form1.register("fullName")} error={form1.formState.errors.fullName?.message} />
            <Input label="Telefon raqami" required placeholder="+998901234567" {...form1.register("phone")} error={form1.formState.errors.phone?.message} />
            <Input label="Email" type="email" required placeholder="email@example.com" {...form1.register("email")} error={form1.formState.errors.email?.message} />
            <div className="flex justify-end">
              <Button type="submit" size="lg">Davom etish →</Button>
            </div>
          </form>
        )}

        {/* Step 2 — Ilova */}
        {step === 2 && (
          <form onSubmit={form2.handleSubmit(onStep2Submit)} className="flex flex-col gap-5">
            <h2 className="text-xl font-semibold text-gray-900">Ilova tafsilotlari</h2>
            <Input label="Ilova nomi" required placeholder="MyApp" maxLength={30} {...form2.register("appName")} error={form2.formState.errors.appName?.message} hint="Max 30 belgi" />
            <Input label="Package name" required placeholder="com.company.appname" {...form2.register("packageName")} error={form2.formState.errors.packageName?.message} hint="Misol: com.umdgroup.myapp" />
            <Input label="Qisqa tavsif" required placeholder="Eng zo'r ilova" maxLength={80} {...form2.register("shortDescription")} error={form2.formState.errors.shortDescription?.message} hint="Max 80 belgi" />
            <Textarea
              label="To'liq tavsif"
              required
              placeholder="Ilovangiz haqida batafsil ma'lumot..."
              rows={6}
              charCount={fullDescValue.length}
              maxChars={4000}
              {...form2.register("fullDescription")}
              error={form2.formState.errors.fullDescription?.message}
            />
            <Input label="Privacy Policy URL" type="url" required placeholder="https://yourapp.com/privacy" {...form2.register("privacyPolicyUrl")} error={form2.formState.errors.privacyPolicyUrl?.message} hint="HTTPS bilan boshlanishi shart" />
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" size="lg" onClick={() => setStep(1)}>← Orqaga</Button>
              <Button type="submit" size="lg">Davom etish →</Button>
            </div>
          </form>
        )}

        {/* Step 3 — Grafika */}
        {step === 3 && (
          <div className="flex flex-col gap-6">
            <h2 className="text-xl font-semibold text-gray-900">Grafik materiallar</h2>
            <ImageUpload
              label="Ilova ikonasi"
              required
              value={icon}
              onChange={setIcon}
              error={iconError}
              validation={{ width: 512, height: 512, maxSizeMB: 1, strict: true }}
            />
            <ImageUpload
              label="Feature Graphic / Banner"
              required
              value={banner}
              onChange={setBanner}
              error={bannerError}
              validation={{ width: 1024, height: 500, maxSizeMB: 1, strict: true }}
            />
            <ImageUpload
              label="Skrinshotlar (kamida 2 ta, max 8 ta)"
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
              <Button type="button" variant="outline" size="lg" onClick={() => setStep(2)}>← Orqaga</Button>
              <Button type="button" size="lg" onClick={onStep3Next}>Davom etish →</Button>
            </div>
          </div>
        )}

        {/* Step 4 — Qo'shimcha */}
        {step === 4 && (
          <form onSubmit={form4.handleSubmit(onStep4Submit)} className="flex flex-col gap-5">
            <h2 className="text-xl font-semibold text-gray-900">Qo&apos;shimcha ma&apos;lumotlar</h2>
            <p className="text-sm text-gray-500">Bu ma&apos;lumotlar ixtiyoriy</p>
            <Input label="Test login" placeholder="test@example.com" {...form4.register("testLogin")} />
            <Input label="Test parol" type="password" placeholder="••••••••" {...form4.register("testPassword")} />
            <Textarea label="Izoh / Qo'shimcha ma'lumot" placeholder="Qo'shimcha malumot..." rows={4} {...form4.register("note")} />
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" size="lg" onClick={() => setStep(3)}>← Orqaga</Button>
              <Button type="submit" size="lg">Davom etish →</Button>
            </div>
          </form>
        )}

        {/* Step 5 — AAB fayl (oxirgi qadam) */}
        {step === 5 && (
          <div className="flex flex-col gap-5">
            <h2 className="text-xl font-semibold text-gray-900">App Bundle (.aab fayl)</h2>
            <p className="text-sm text-gray-500">
              Google Play Console-da yaratilgan signed AAB faylni yuklang
            </p>
            <FileUpload
              label="App Bundle (.aab)"
              accept=".aab"
              required
              value={aabFile}
              onChange={setAabFile}
              error={aabError}
              hint="Faqat .aab formatdagi fayl qabul qilinadi"
              maxSizeMB={200}
            />

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" size="lg" onClick={() => setStep(4)}>
                ← Orqaga
              </Button>
              <Button type="button" size="lg" onClick={onStep5Submit}>
                Yuborish ✓
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
