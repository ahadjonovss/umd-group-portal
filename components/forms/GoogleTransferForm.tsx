"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { googleTransferSchema, type GoogleTransferData } from "@/lib/validations/google-transfer";

export function GoogleTransferForm() {
  const router = useRouter();
  const [submitStatus, setSubmitStatus] = useState<"idle" | "loading" | "error">("idle");
  const [submitError, setSubmitError] = useState("");

  const form = useForm<GoogleTransferData>({
    resolver: zodResolver(googleTransferSchema),
    defaultValues: { fullName: "", phone: "", email: "", developerAccountId: "", googlePaymentsProfileId: "" },
  });

  async function onSubmit(data: GoogleTransferData) {
    setSubmitStatus("loading");
    setSubmitError("");

    const formData = new FormData();
    Object.entries(data).forEach(([k, v]) => formData.append(k, v));

    try {
      const res = await fetch("/api/submit/google-transfer", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || json.message || "Xato yuz berdi");
      router.push("/success?service=google-transfer");
    } catch (err: unknown) {
      setSubmitStatus("error");
      setSubmitError(err instanceof Error ? err.message : "Kutilmagan xato");
    }
  }

  return (
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

      {submitStatus === "error" && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">⚠️ {submitError}</div>
      )}

      <Button type="submit" size="lg" loading={submitStatus === "loading"} className="w-full">
        {submitStatus === "loading" ? "Yuborilmoqda..." : "Yuborish ✓"}
      </Button>
    </form>
  );
}
