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

import {
  playMarketStep1Schema,
  playMarketStep2Schema,
  playMarketStep5Schema,
  type PlayMarketStep1,
  type PlayMarketStep2,
  type PlayMarketStep5,
} from "@/lib/validations/play-market";

const STORAGE_KEY = "pm_draft";
const STEPS = ["Mijoz", "Ilova", "Fayllar", "Grafika", "Qo'shimcha"];

interface FormState {
  step1?: PlayMarketStep1;
  step2?: PlayMarketStep2;
  step5?: PlayMarketStep5;
}

export function PlayMarketForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formState, setFormState] = useState<FormState>({});
  const [submitStatus, setSubmitStatus] = useState<"idle" | "loading" | "error">("idle");
  const [submitError, setSubmitError] = useState("");
  const [loadingMsg, setLoadingMsg] = useState("");

  // Step 3 files
  const [aabFile, setAabFile] = useState<File | null>(null);
  const [aabError, setAabError] = useState("");

  // Step 4 graphics
  const [icon, setIcon] = useState<File | null>(null);
  const [banner, setBanner] = useState<File | null>(null);
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [iconError, setIconError] = useState("");
  const [bannerError, setBannerError] = useState("");
  const [screenshotError, setScreenshotError] = useState("");

  // Load draft from localStorage
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

  // Step 1
  const form1 = useForm<PlayMarketStep1>({
    resolver: zodResolver(playMarketStep1Schema),
    defaultValues: formState.step1 || { fullName: "", phone: "", email: "" },
  });

  // Step 2
  const form2 = useForm<PlayMarketStep2>({
    resolver: zodResolver(playMarketStep2Schema),
    defaultValues: formState.step2 || { appName: "", packageName: "", shortDescription: "", fullDescription: "", privacyPolicyUrl: "" },
  });
  const fullDescValue = form2.watch("fullDescription") || "";

  // Step 5
  const form5 = useForm<PlayMarketStep5>({
    resolver: zodResolver(playMarketStep5Schema),
    defaultValues: formState.step5 || { testLogin: "", testPassword: "", note: "" },
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
    if (!aabFile) { setAabError("AAB fayl majburiy"); return; }
    setAabError("");
    saveDraft(formState, 4);
    setStep(4);
  }

  function onStep4Next() {
    let valid = true;
    if (!icon) { setIconError("Ilova ikonasi majburiy"); valid = false; } else { setIconError(""); }
    if (!banner) { setBannerError("Feature Graphic majburiy"); valid = false; } else { setBannerError(""); }
    if (screenshots.length < 2) { setScreenshotError("Kamida 2 ta skrinshot talab qilinadi"); valid = false; } else { setScreenshotError(""); }
    if (!valid) return;
    saveDraft(formState, 5);
    setStep(5);
  }

  async function onStep5Submit(data: PlayMarketStep5) {
    const newState = { ...formState, step5: data };
    setFormState(newState);

    setSubmitStatus("loading");
    setSubmitError("");

    const formData = new FormData();

    // Text fields
    const allData = { ...newState.step1, ...newState.step2, ...data };
    Object.entries(allData).forEach(([k, v]) => { if (v) formData.append(k, String(v)); });

    // Files
    formData.append("aabFile", aabFile!);
    formData.append("icon", icon!);
    formData.append("banner", banner!);
    screenshots.forEach((s, i) => formData.append(`screenshot_${i}`, s));
    formData.append("screenshotCount", String(screenshots.length));

    try {
      setLoadingMsg("Ma'lumotlar yuklanmoqda...");
      await new Promise((r) => setTimeout(r, 500));
      setLoadingMsg("ZIP tayyorlanmoqda...");

      const res = await fetch("/api/submit/play-market", {
        method: "POST",
        body: formData,
      });

      setLoadingMsg("Telegram-ga yuborilmoqda...");
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || json.message || "Xato yuz berdi");
      }

      localStorage.removeItem(STORAGE_KEY);
      router.push("/success?service=play-market");
    } catch (err: unknown) {
      setSubmitStatus("error");
      setSubmitError(err instanceof Error ? err.message : "Kutilmagan xato");
    } finally {
      setLoadingMsg("");
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <StepProgress steps={STEPS} currentStep={step} />

      <div className="mt-8">
        {/* Step 1 */}
        {step === 1 && (
          <form onSubmit={form1.handleSubmit(onStep1Submit)} className="flex flex-col gap-5">
            <h2 className="text-xl font-semibold text-gray-900">Mijoz ma&apos;lumotlari</h2>
            <Input
              label="To'liq ism"
              required
              placeholder="Sardor Abdullayev"
              {...form1.register("fullName")}
              error={form1.formState.errors.fullName?.message}
            />
            <Input
              label="Telefon raqami"
              required
              placeholder="+998901234567"
              {...form1.register("phone")}
              error={form1.formState.errors.phone?.message}
            />
            <Input
              label="Email"
              type="email"
              required
              placeholder="email@example.com"
              {...form1.register("email")}
              error={form1.formState.errors.email?.message}
            />
            <div className="flex justify-end">
              <Button type="submit" size="lg">Davom etish →</Button>
            </div>
          </form>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <form onSubmit={form2.handleSubmit(onStep2Submit)} className="flex flex-col gap-5">
            <h2 className="text-xl font-semibold text-gray-900">Ilova tafsilotlari</h2>
            <Input
              label="Ilova nomi"
              required
              placeholder="MyApp"
              maxLength={30}
              {...form2.register("appName")}
              error={form2.formState.errors.appName?.message}
              hint="Max 30 belgi"
            />
            <Input
              label="Package name"
              required
              placeholder="com.company.appname"
              {...form2.register("packageName")}
              error={form2.formState.errors.packageName?.message}
              hint="Misol: com.umdgroup.myapp"
            />
            <Input
              label="Qisqa tavsif"
              required
              placeholder="Eng zo'r ilova"
              maxLength={80}
              {...form2.register("shortDescription")}
              error={form2.formState.errors.shortDescription?.message}
              hint="Max 80 belgi"
            />
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
            <Input
              label="Privacy Policy URL"
              type="url"
              required
              placeholder="https://yourapp.com/privacy"
              {...form2.register("privacyPolicyUrl")}
              error={form2.formState.errors.privacyPolicyUrl?.message}
              hint="HTTPS bilan boshlanishi shart"
            />
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" size="lg" onClick={() => setStep(1)}>← Orqaga</Button>
              <Button type="submit" size="lg">Davom etish →</Button>
            </div>
          </form>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="flex flex-col gap-5">
            <h2 className="text-xl font-semibold text-gray-900">Ilova fayli</h2>
            <FileUpload
              label="App Bundle (.aab fayl)"
              accept=".aab"
              required
              value={aabFile}
              onChange={setAabFile}
              error={aabError}
              hint="Faqat .aab formatdagi fayl qabul qilinadi"
              maxSizeMB={200}
            />
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" size="lg" onClick={() => setStep(2)}>← Orqaga</Button>
              <Button type="button" size="lg" onClick={onStep3Next}>Davom etish →</Button>
            </div>
          </div>
        )}

        {/* Step 4 */}
        {step === 4 && (
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
              <Button type="button" variant="outline" size="lg" onClick={() => setStep(3)}>← Orqaga</Button>
              <Button type="button" size="lg" onClick={onStep4Next}>Davom etish →</Button>
            </div>
          </div>
        )}

        {/* Step 5 */}
        {step === 5 && (
          <form onSubmit={form5.handleSubmit(onStep5Submit)} className="flex flex-col gap-5">
            <h2 className="text-xl font-semibold text-gray-900">Qo&apos;shimcha ma&apos;lumotlar</h2>
            <p className="text-sm text-gray-500">Bu ma&apos;lumotlar ixtiyoriy</p>
            <Input
              label="Test login"
              placeholder="test@example.com"
              {...form5.register("testLogin")}
            />
            <Input
              label="Test parol"
              type="password"
              placeholder="••••••••"
              {...form5.register("testPassword")}
            />
            <Textarea
              label="Izoh / Qo'shimcha ma'lumot"
              placeholder="Qo'shimcha malumot..."
              rows={4}
              {...form5.register("note")}
            />

            {submitStatus === "error" && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                ⚠️ {submitError}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" size="lg" onClick={() => setStep(4)} disabled={submitStatus === "loading"}>
                ← Orqaga
              </Button>
              <Button type="submit" size="lg" loading={submitStatus === "loading"}>
                {submitStatus === "loading" ? loadingMsg || "Yuborilmoqda..." : "Yuborish ✓"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
