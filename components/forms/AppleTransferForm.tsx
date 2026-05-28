"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { appleTransferSchema, type AppleTransferData } from "@/lib/validations/apple-transfer";

export function AppleTransferForm() {
  const router = useRouter();
  const [submitStatus, setSubmitStatus] = useState<"idle" | "loading" | "error">("idle");
  const [submitError, setSubmitError] = useState("");

  const form = useForm<AppleTransferData>({
    resolver: zodResolver(appleTransferSchema),
    defaultValues: { fullName: "", phone: "", email: "", appStoreConnectTeamId: "", appleDevAccountEmail: "" },
  });

  async function onSubmit(data: AppleTransferData) {
    setSubmitStatus("loading");
    setSubmitError("");

    const formData = new FormData();
    Object.entries(data).forEach(([k, v]) => formData.append(k, v));

    try {
      const res = await fetch("/api/submit/apple-transfer", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || json.message || "Xato yuz berdi");
      router.push("/success?service=apple-transfer");
    } catch (err: unknown) {
      setSubmitStatus("error");
      setSubmitError(err instanceof Error ? err.message : "Kutilmagan xato");
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-xl mx-auto px-4 py-8 flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Apple App Store — App Transfer</h2>
        <p className="text-sm text-gray-500 mt-1">Ilovani bizning akkauntga o&apos;tkazish uchun ma&apos;lumotlar</p>
      </div>

      <div className="h-px bg-gray-200" />

      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Mijoz ma&apos;lumotlari</h3>
      <Input label="To'liq ism" required placeholder="Sardor Abdullayev" {...form.register("fullName")} error={form.formState.errors.fullName?.message} />
      <Input label="Telefon raqami" required placeholder="+998901234567" {...form.register("phone")} error={form.formState.errors.phone?.message} />
      <Input label="Email" type="email" required placeholder="email@example.com" {...form.register("email")} error={form.formState.errors.email?.message} />

      <div className="h-px bg-gray-200" />

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

      {submitStatus === "error" && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">⚠️ {submitError}</div>
      )}

      <Button type="submit" size="lg" loading={submitStatus === "loading"} className="w-full">
        {submitStatus === "loading" ? "Yuborilmoqda..." : "Yuborish ✓"}
      </Button>
    </form>
  );
}
