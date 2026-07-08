"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SubmitProgressOverlay } from "@/components/SubmitProgressOverlay";
import { compressImage } from "@/lib/image-compress";
import { accountBaseUsd } from "@/lib/payment";
import { TermsConfirmModal } from "@/components/TermsConfirmModal";
import type { Pricing } from "@/lib/firestore/settings";

type Platform = "google" | "apple";
type AccountType = "personal" | "corporate";

export function AccountForm({ pricing, rate }: { pricing: Pricing; rate: number | null }) {
  const router = useRouter();
  const [phase, setPhase] = useState<"intro" | "form">("intro");
  const [platform, setPlatform] = useState<Platform>("google");
  const [accountType, setAccountType] = useState<AccountType>("personal");
  const [f, setF] = useState<Record<string, string>>({});
  const [cert, setCert] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [showTerms, setShowTerms] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  const isApple = platform === "apple";
  const isCorp = accountType === "corporate";
  const loginLabel = isApple ? "Apple ID (email)" : "Google akkaunt (Gmail)";
  const platformFee = isApple ? "$99/yil" : "$25 (bir marta)";

  // Narx hisob-kitobi
  const base = Math.round(accountBaseUsd(platform, accountType, pricing));
  const advance = Math.round((base * pricing.accountAdvance) / 100);
  const remaining = base - advance;
  const uzs = (usd: number) => (rate ? Math.round(usd * rate).toLocaleString("en-US") + " so'm" : null);

  function validate(): string | null {
    if (!f.fullName?.trim() || !f.phone?.trim() || !f.email?.trim()) return "Aloqa ma'lumotlarini to'ldiring";
    if (!f.login?.trim() || !f.loginPassword?.trim()) return `${loginLabel} va parolni kiriting`;
    if (isCorp) {
      if (!f.companyName?.trim()) return "Yuridik kompaniya nomini kiriting";
      if (!f.legalAddress?.trim()) return "Yuridik manzilni kiriting";
    } else {
      if (!f.holderName?.trim()) return "Akkaunt egasining to'liq ismini kiriting";
    }
    return null;
  }

  function onFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); setStatus("error"); return; }
    setShowTerms(true); // shartlar modali ochiladi
  }

  async function doSubmit() {
    setShowTerms(false);
    setStatus("loading");
    setError("");
    setProgress(20);

    const fd = new FormData();
    fd.append("platform", platform);
    fd.append("accountType", accountType);
    Object.entries(f).forEach(([k, v]) => { if (v?.trim()) fd.append(k, v.trim()); });
    if (cert) {
      const c = cert.type.startsWith("image/") ? await compressImage(cert) : cert;
      fd.append("certificate", c);
    }

    try {
      setProgress(60);
      const res = await fetch("/api/submit/account", { method: "POST", body: fd });
      setProgress(90);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Xato yuz berdi");
      setProgress(100);
      await new Promise((r) => setTimeout(r, 400));
      router.push("/success?service=account");
    } catch (err2) {
      setStatus("error");
      setError(err2 instanceof Error ? err2.message : "Kutilmagan xato");
    }
  }

  const Radio = ({ active, onClick, title, sub }: { active: boolean; onClick: () => void; title: string; sub: string }) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 text-left rounded-xl border-2 px-4 py-3 transition-all ${
        active ? "border-teal-500 bg-teal-50" : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <p className={`text-sm font-semibold ${active ? "text-teal-700" : "text-slate-800"}`}>{title}</p>
      <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
    </button>
  );

  // ── INTRO BOSQICHI ──────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Developer akkaunt ochish</h2>
          <p className="text-sm text-slate-500 mt-1">
            Google Play yoki App Store uchun rasmiy developer akkauntni siz uchun ochib, sozlab beramiz.
          </p>
        </div>

        {/* Tanlov moduli */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">1. Platformani tanlang</p>
            <div className="flex gap-3">
              <Radio active={platform === "google"} onClick={() => setPlatform("google")} title="Google Play Console" sub="Android" />
              <Radio active={platform === "apple"} onClick={() => setPlatform("apple")} title="App Store Connect" sub="iOS" />
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">2. Akkaunt turini tanlang</p>
            <div className="flex gap-3">
              <Radio active={!isCorp} onClick={() => setAccountType("personal")} title="Shaxsiy" sub="Jismoniy shaxs nomiga" />
              <Radio active={isCorp} onClick={() => setAccountType("corporate")} title="Korporativ" sub="Tashkilot / yuridik shaxs" />
            </div>
          </div>
        </div>

        {/* Xizmat haqi + breakdown — tanlov moduli tagida aniq */}
        <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold text-teal-800">Bizning xizmat haqimiz</span>
            <span className="text-2xl font-bold text-teal-700">${base}</span>
          </div>
          {uzs(base) && <p className="text-xs text-teal-600 text-right">~{uzs(base)}</p>}
          <div className="h-px bg-teal-200 my-3" />
          <p className="text-xs font-semibold text-teal-800 mb-1.5">To&apos;lov tartibi:</p>
          <div className="flex flex-col gap-1 text-xs text-teal-700">
            <div className="flex justify-between">
              <span>Avans ({pricing.accountAdvance}%) — ariza tasdiqlangach</span>
              <strong>${advance}</strong>
            </div>
            {remaining > 0 && (
              <div className="flex justify-between">
                <span>Qolgan ({100 - pricing.accountAdvance}%) — akkaunt topshirilgach</span>
                <strong>${remaining}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Xizmat haqi nimani o'z ichiga oladi */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-800 mb-2">Xizmat haqi nimani o&apos;z ichiga oladi?</p>
          <ul className="flex flex-col gap-2 text-sm text-slate-600">
            <li className="flex gap-2">
              <span className="text-teal-500">•</span>
              <span>Akkauntni ro&apos;yxatdan o&apos;tkazish va to&apos;g&apos;ri sozlash</span>
            </li>
            <li className="flex gap-2">
              <span className="text-teal-500">•</span>
              <span>Ma&apos;lumotlarni kiritish va tasdiqlash jarayonini kuzatish</span>
            </li>
            {isCorp && (
              <li className="flex gap-2">
                <span className="text-teal-500">•</span>
                <span>{isApple ? "D-U-N-S raqami va yuridik hujjatlarni rasmiylashtirishda ko'maklashish" : "Yuridik shaxs ma'lumotlarini to'g'ri sozlash"}</span>
              </li>
            )}
          </ul>
        </div>

        {/* Platforma to'lovi alohida ekanligi haqida ogohlantirish */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-2.5">
          <span className="text-lg flex-shrink-0">⚠️</span>
          <p className="text-sm text-amber-800 leading-snug">
            Bu narx <strong>platformaning rasmiy to&apos;lovini o&apos;z ichiga olmaydi</strong>.{" "}
            {isApple ? "Apple Developer Program" : "Google Play Console"} to&apos;lovi (<strong>{platformFee}</strong>)
            to&apos;g&apos;ridan-to&apos;g&apos;ri {isApple ? "Apple" : "Google"}ga alohida to&apos;lanadi.
          </p>
        </div>

        <Button type="button" size="lg" className="w-full" onClick={() => setPhase("form")}>
          Davom etish →
        </Button>
      </div>
    );
  }

  // ── FORMA BOSQICHI ──────────────────────────────────────
  return (
    <>
      {status === "loading" && <SubmitProgressOverlay progress={progress} />}
      {status === "error" && (
        <SubmitProgressOverlay progress={progress} error={error} onRetry={() => { setStatus("idle"); setError(""); setProgress(0); }} />
      )}

      {showTerms && (
        <TermsConfirmModal
          service="account"
          pricing={pricing}
          onConfirm={doSubmit}
          onClose={() => setShowTerms(false)}
        />
      )}

      <form onSubmit={onFormSubmit} className="max-w-xl mx-auto px-4 py-8 flex flex-col gap-5">
        {/* Tanlangan xizmat sarlavhasi */}
        <div className="flex items-center justify-between gap-3 rounded-xl bg-teal-50 border border-teal-200 p-3">
          <div>
            <p className="text-sm font-semibold text-teal-800">
              {isApple ? "App Store Connect" : "Google Play Console"} · {isCorp ? "Korporativ" : "Shaxsiy"}
            </p>
            <p className="text-xs text-teal-600">Xizmat narxi: ${base} · Avans: ${advance}</p>
          </div>
          <button type="button" onClick={() => setPhase("intro")} className="text-xs font-medium text-teal-700 hover:underline flex-shrink-0">
            ← O&apos;zgartirish
          </button>
        </div>

        {/* Aloqa */}
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Aloqa ma&apos;lumotlari</h3>
        <Input label="To'liq ism" required placeholder="Sardor Abdullayev" value={f.fullName ?? ""} onChange={set("fullName")} />
        <Input label="Telefon" required placeholder="+998901234567" value={f.phone ?? ""} onChange={set("phone")} />
        <Input label="Email" type="email" required placeholder="email@example.com" value={f.email ?? ""} onChange={set("email")} />

        <div className="h-px bg-slate-200" />

        {/* Akkaunt login */}
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">{isApple ? "Apple ID" : "Google akkaunt"}</h3>
        <Input label={loginLabel} required placeholder={isApple ? "apple-id@icloud.com" : "example@gmail.com"} value={f.login ?? ""} onChange={set("login")} />
        <Input label="Parol" required placeholder="Akkaunt paroli" value={f.loginPassword ?? ""} onChange={set("loginPassword")} />

        <div className="h-px bg-slate-200" />

        {/* Tur bo'yicha maydonlar */}
        {isCorp ? (
          <>
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Tashkilot ma&apos;lumotlari</h3>
            <Input label="Yuridik kompaniya nomi" required placeholder="MChJ «Namuna»" value={f.companyName ?? ""} onChange={set("companyName")} />
            <Textarea label="Yuridik manzil" required rows={2} placeholder="Ko'cha, shahar, pochta indeksi, mamlakat" value={f.legalAddress ?? ""} onChange={set("legalAddress")} />
            <Input label="Kompaniya telefoni" placeholder="+998..." value={f.companyPhone ?? ""} onChange={set("companyPhone")} />
            <Input label="Kompaniya email" type="email" placeholder="info@company.uz" value={f.companyEmail ?? ""} onChange={set("companyEmail")} />
            <Input label="Veb-sayt" placeholder="https://company.uz" value={f.website ?? ""} onChange={set("website")} />
            <Input label="Kompaniya turi" placeholder="MChJ, AJ, LLC..." value={f.companyType ?? ""} onChange={set("companyType")} />
            {!isApple && (
              <Input label="Faoliyat turi" placeholder="IT, savdo, ta'lim..." value={f.activityType ?? ""} onChange={set("activityType")} />
            )}

            <div className="h-px bg-slate-200" />
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              {isApple ? "Legal Signatory (imzolovchi)" : "Kontakt shaxs"}
            </h3>
            <Input label="F.I.O." placeholder="To'liq ism" value={f.cpName ?? ""} onChange={set("cpName")} />
            <Input label="Lavozim" placeholder="Direktor, menejer..." value={f.cpPosition ?? ""} onChange={set("cpPosition")} />
            <Input label="Telefon" placeholder="+998..." value={f.cpPhone ?? ""} onChange={set("cpPhone")} />
            <Input label="Email" type="email" placeholder="email@..." value={f.cpEmail ?? ""} onChange={set("cpEmail")} />

            {isApple && (
              <div>
                <label className="text-sm font-medium text-slate-700">Guvohnoma scan (ixtiyoriy)</label>
                <p className="text-xs text-slate-500 mb-1.5">Kompaniya ro&apos;yxatdan o&apos;tganlik guvohnomasi (rasm yoki PDF)</p>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setCert(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-700 file:text-sm file:font-medium hover:file:bg-slate-200"
                />
              </div>
            )}
          </>
        ) : (
          <>
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Akkaunt egasi</h3>
            <Input label={isApple ? "To'liq ism familiya (pasportdagi)" : "To'liq ism familiya"} required placeholder="Sardor Abdullayev" value={f.holderName ?? ""} onChange={set("holderName")} />
            {isApple ? (
              <>
                <Textarea label="Yuridik manzil" rows={2} placeholder="Ko'cha, shahar, pochta indeksi, mamlakat" value={f.legalAddress ?? ""} onChange={set("legalAddress")} />
                <Input label="Telefon" placeholder="+998..." value={f.holderPhone ?? ""} onChange={set("holderPhone")} />
              </>
            ) : (
              <Input label="Mamlakat" placeholder="O'zbekiston" value={f.country ?? ""} onChange={set("country")} />
            )}
          </>
        )}

        <Textarea label="Qo'shimcha izoh (ixtiyoriy)" rows={2} placeholder="Qo'shimcha ma'lumot..." value={f.note ?? ""} onChange={set("note")} />

        {error && status === "error" && <p className="text-sm text-red-600">❌ {error}</p>}

        <Button type="submit" size="lg" className="w-full">Yuborish ✓</Button>
      </form>
    </>
  );
}
