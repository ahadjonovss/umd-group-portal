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
const STEPS = ["Mijoz", "Ilova", "Sertifikatlar", "Grafika", "Qo'shimcha"];

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
  const [loadingMsg, setLoadingMsg] = useState("");

  // Step 3 files
  const [certFile, setCertFile] = useState<File | null>(null);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [certError, setCertError] = useState("");
  const [profileError, setProfileError] = useState("");

  // Step 4 graphics
  const [icon, setIcon] = useState<File | null>(null);
  const [iphoneScreenshots, setIphoneScreenshots] = useState<File[]>([]);
  const [ipadScreenshots, setIpadScreenshots] = useState<File[]>([]);
  const [iconError, setIconError] = useState("");
  const [iphoneError, setIphoneError] = useState("");

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

  const form1 = useForm<AppStoreStep1>({
    resolver: zodResolver(appStoreStep1Schema),
    defaultValues: formState.step1 || { fullName: "", phone: "", email: "" },
  });

  const form2 = useForm<AppStoreStep2>({
    resolver: zodResolver(appStoreStep2Schema),
    defaultValues: formState.step2 || { appName: "", subtitle: "", fullDescription: "", privacyPolicyUrl: "" },
  });
  const fullDescValue = form2.watch("fullDescription") || "";

  const form3 = useForm<AppStoreStep3>({
    resolver: zodResolver(appStoreStep3Schema),
    defaultValues: formState.step3 || { githubRepoUrl: "", githubUsername: "", certificatePassword: "", bundleId: "" },
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
    let valid = true;
    if (!certFile) { setCertError(".p12 fayl majburiy"); valid = false; } else { setCertError(""); }
    if (!profileFile) { setProfileError(".mobileprovision fayl majburiy"); valid = false; } else { setProfileError(""); }
    if (!valid) return;
    const newState = { ...formState, step3: data };
    setFormState(newState);
    saveDraft(newState, 4);
    setStep(4);
  }

  function onStep4Next() {
    let valid = true;
    if (!icon) { setIconError("Ilova ikonasi majburiy"); valid = false; } else { setIconError(""); }
    if (iphoneScreenshots.length < 3) { setIphoneError("Kamida 3 ta iPhone skrinshot talab qilinadi"); valid = false; } else { setIphoneError(""); }
    if (!valid) return;
    saveDraft(formState, 5);
    setStep(5);
  }

  async function onStep5Submit(data: AppStoreStep5) {
    const newState = { ...formState, step5: data };
    setFormState(newState);
    setSubmitStatus("loading");
    setSubmitError("");

    const formData = new FormData();
    const allData = { ...newState.step1, ...newState.step2, ...newState.step3, ...data };
    Object.entries(allData).forEach(([k, v]) => { if (v) formData.append(k, String(v)); });

    formData.append("certFile", certFile!);
    formData.append("profileFile", profileFile!);
    formData.append("icon", icon!);
    iphoneScreenshots.forEach((s, i) => formData.append(`iphone_${i}`, s));
    formData.append("iphoneCount", String(iphoneScreenshots.length));
    ipadScreenshots.forEach((s, i) => formData.append(`ipad_${i}`, s));
    formData.append("ipadCount", String(ipadScreenshots.length));

    try {
      setLoadingMsg("Ma'lumotlar yuklanmoqda...");
      await new Promise((r) => setTimeout(r, 500));
      setLoadingMsg("ZIP tayyorlanmoqda...");

      const res = await fetch("/api/submit/app-store", { method: "POST", body: formData });
      setLoadingMsg("Telegram-ga yuborilmoqda...");
      const json = await res.json();

      if (!res.ok || !json.success) throw new Error(json.error || json.message || "Xato yuz berdi");

      localStorage.removeItem(STORAGE_KEY);
      router.push("/success?service=app-store");
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
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" size="lg" onClick={() => setStep(1)}>← Orqaga</Button>
              <Button type="submit" size="lg">Davom etish →</Button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={form3.handleSubmit(onStep3Submit)} className="flex flex-col gap-5">
            <h2 className="text-xl font-semibold text-gray-900">Kod va sertifikatlar</h2>
            <Input label="GitHub repo URL" type="url" required placeholder="https://github.com/user/repo" {...form3.register("githubRepoUrl")} error={form3.formState.errors.githubRepoUrl?.message} />
            <Input label="GitHub username" required placeholder="github_username" {...form3.register("githubUsername")} error={form3.formState.errors.githubUsername?.message} hint="Collaborator qo'shish uchun" />
            <FileUpload
              label="Distribution Certificate (.p12)"
              accept=".p12"
              required
              value={certFile}
              onChange={setCertFile}
              error={certError}
            />
            <Input label="Certificate paroli" type="password" required placeholder="••••••••" {...form3.register("certificatePassword")} error={form3.formState.errors.certificatePassword?.message} />
            <FileUpload
              label="Provisioning Profile (.mobileprovision)"
              accept=".mobileprovision"
              required
              value={profileFile}
              onChange={setProfileFile}
              error={profileError}
            />
            <Input label="Bundle ID" required placeholder="com.company.appname" {...form3.register("bundleId")} error={form3.formState.errors.bundleId?.message} hint="Format: com.company.appname" />
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" size="lg" onClick={() => setStep(2)}>← Orqaga</Button>
              <Button type="submit" size="lg">Davom etish →</Button>
            </div>
          </form>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-6">
            <h2 className="text-xl font-semibold text-gray-900">Grafik materiallar</h2>

            <ImageUpload
              label="Ilova ikonasi"
              required
              value={icon}
              onChange={setIcon}
              error={iconError}
              validation={{ width: 1024, height: 1024, maxSizeMB: 10, strict: true }}
            />
            <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg -mt-3">
              ⚠️ Alpha channel (shaffoflik) bo&apos;lmasligi shart
            </p>

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
              <Button type="button" variant="outline" size="lg" onClick={() => setStep(3)}>← Orqaga</Button>
              <Button type="button" size="lg" onClick={onStep4Next}>Davom etish →</Button>
            </div>
          </div>
        )}

        {step === 5 && (
          <form onSubmit={form5.handleSubmit(onStep5Submit)} className="flex flex-col gap-5">
            <h2 className="text-xl font-semibold text-gray-900">Qo&apos;shimcha ma&apos;lumotlar</h2>
            <p className="text-sm text-gray-500">Bu ma&apos;lumotlar ixtiyoriy</p>
            <Input label="Test login" placeholder="test@example.com" {...form5.register("testLogin")} />
            <Input label="Test parol" type="password" placeholder="••••••••" {...form5.register("testPassword")} />
            <Textarea label="Izoh" placeholder="Qo'shimcha ma'lumot..." rows={4} {...form5.register("note")} />

            {submitStatus === "error" && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">⚠️ {submitError}</div>
            )}

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" size="lg" onClick={() => setStep(4)} disabled={submitStatus === "loading"}>← Orqaga</Button>
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
