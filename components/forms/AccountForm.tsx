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
import { useT } from "@/components/i18n/LanguageProvider";

type Platform = "google" | "apple";
type AccountType = "personal" | "corporate";

export function AccountForm({ pricing, rate }: { pricing: Pricing; rate: number | null }) {
  const t = useT();
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
  const loginLabel = isApple ? t.accountForm.appleLogin : t.accountForm.googleLogin;
  const platformFee = isApple ? t.accountForm.appleFee : t.accountForm.googleFee;

  // Narx hisob-kitobi
  const base = Math.round(accountBaseUsd(platform, accountType, pricing));
  const advance = Math.round((base * pricing.accountAdvance) / 100);
  const remaining = base - advance;
  const uzs = (usd: number) => (rate ? Math.round(usd * rate).toLocaleString("en-US") + " " + t.common.sum : null);

  function validate(): string | null {
    if (!f.fullName?.trim() || !f.phone?.trim() || !f.email?.trim()) return t.accountForm.errContact;
    if (!f.login?.trim() || !f.loginPassword?.trim()) return t.accountForm.errLogin(loginLabel);
    if (isCorp) {
      if (!f.companyName?.trim()) return t.accountForm.errCompanyName;
      if (!f.legalAddress?.trim()) return t.accountForm.errLegalAddress;
    } else {
      if (!f.holderName?.trim()) return t.accountForm.errHolderName;
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
      if (!res.ok || !json.success) throw new Error(json.error || t.common.error);
      setProgress(100);
      await new Promise((r) => setTimeout(r, 400));
      router.push(`/success?service=account&appId=${json.id}`);
    } catch (err2) {
      setStatus("error");
      setError(err2 instanceof Error ? err2.message : t.form.unexpectedError);
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
          <h2 className="text-xl font-semibold text-slate-900">{t.accountForm.introTitle}</h2>
          <p className="text-sm text-slate-500 mt-1">{t.accountForm.introSub}</p>
        </div>

        {/* Tanlov moduli */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">{t.accountForm.pickPlatform}</p>
            <div className="flex gap-3">
              <Radio active={platform === "google"} onClick={() => setPlatform("google")} title={t.accountForm.googleConsole} sub="Android" />
              <Radio active={platform === "apple"} onClick={() => setPlatform("apple")} title={t.accountForm.appStoreConnect} sub="iOS" />
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">{t.accountForm.pickType}</p>
            <div className="flex gap-3">
              <Radio active={!isCorp} onClick={() => setAccountType("personal")} title={t.accountForm.personal} sub={t.accountForm.personalSub} />
              <Radio active={isCorp} onClick={() => setAccountType("corporate")} title={t.accountForm.corporate} sub={t.accountForm.corporateSub} />
            </div>
          </div>
        </div>

        {/* Xizmat haqi + breakdown — tanlov moduli tagida aniq */}
        <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold text-teal-800">{t.accountForm.ourFee}</span>
            <span className="text-2xl font-bold text-teal-700">${base}</span>
          </div>
          {uzs(base) && <p className="text-xs text-teal-600 text-right">~{uzs(base)}</p>}
          <div className="h-px bg-teal-200 my-3" />
          <p className="text-xs font-semibold text-teal-800 mb-1.5">{t.accountForm.paymentOrder}</p>
          <div className="flex flex-col gap-1 text-xs text-teal-700">
            <div className="flex justify-between">
              <span>{t.accountForm.advance(pricing.accountAdvance)}</span>
              <strong>${advance}</strong>
            </div>
            {remaining > 0 && (
              <div className="flex justify-between">
                <span>{t.accountForm.remaining(100 - pricing.accountAdvance)}</span>
                <strong>${remaining}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Xizmat haqi nimani o'z ichiga oladi */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-800 mb-2">{t.accountForm.includesTitle}</p>
          <ul className="flex flex-col gap-2 text-sm text-slate-600">
            <li className="flex gap-2">
              <span className="text-teal-500">•</span>
              <span>{t.accountForm.include1}</span>
            </li>
            <li className="flex gap-2">
              <span className="text-teal-500">•</span>
              <span>{t.accountForm.include2}</span>
            </li>
            {isCorp && (
              <li className="flex gap-2">
                <span className="text-teal-500">•</span>
                <span>{isApple ? t.accountForm.include3Apple : t.accountForm.include3Google}</span>
              </li>
            )}
          </ul>
        </div>

        {/* Platforma to'lovi alohida ekanligi haqida ogohlantirish */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-2.5">
          <span className="text-lg flex-shrink-0">⚠️</span>
          <p className="text-sm text-amber-800 leading-snug">
            {t.accountForm.warnPre} <strong>{t.accountForm.warnStrong}</strong>.{" "}
            {isApple ? "Apple Developer Program" : "Google Play Console"} {t.accountForm.warnMid} (<strong>{platformFee}</strong>){" "}
            {t.accountForm.warnPost(isApple ? "Apple" : "Google")}
          </p>
        </div>

        <Button type="button" size="lg" className="w-full" onClick={() => setPhase("form")}>
          {t.form.continue}
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
              {isApple ? t.accountForm.appStoreConnect : t.accountForm.googleConsole} · {isCorp ? t.accountForm.corporate : t.accountForm.personal}
            </p>
            <p className="text-xs text-teal-600">{t.accountForm.priceLine(base, advance)}</p>
          </div>
          <button type="button" onClick={() => setPhase("intro")} className="text-xs font-medium text-teal-700 hover:underline flex-shrink-0">
            {t.form.change}
          </button>
        </div>

        {/* Aloqa */}
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">{t.form.sectionContact}</h3>
        <Input label={t.form.fullName} required placeholder={t.form.fullNamePlaceholder} value={f.fullName ?? ""} onChange={set("fullName")} />
        <Input label={t.form.phone} required placeholder={t.form.phonePlaceholder} value={f.phone ?? ""} onChange={set("phone")} />
        <Input label={t.form.email} type="email" required placeholder={t.form.emailPlaceholder} value={f.email ?? ""} onChange={set("email")} />

        <div className="h-px bg-slate-200" />

        {/* Akkaunt login */}
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">{isApple ? t.accountForm.sectionAppleId : t.accountForm.sectionGoogleAccount}</h3>
        <Input label={loginLabel} required placeholder={isApple ? t.accountForm.applePlaceholder : t.accountForm.googlePlaceholder} value={f.login ?? ""} onChange={set("login")} />
        <Input label={t.form.password} required placeholder={t.accountForm.loginPasswordPlaceholder} value={f.loginPassword ?? ""} onChange={set("loginPassword")} />

        <div className="h-px bg-slate-200" />

        {/* Tur bo'yicha maydonlar */}
        {isCorp ? (
          <>
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">{t.accountForm.sectionOrg}</h3>
            <Input label={t.accountForm.legalCompanyName} required placeholder={t.accountForm.legalCompanyPlaceholder} value={f.companyName ?? ""} onChange={set("companyName")} />
            <Textarea label={t.accountForm.legalAddress} required rows={2} placeholder={t.accountForm.legalAddressPlaceholder} value={f.legalAddress ?? ""} onChange={set("legalAddress")} />
            <Input label={t.accountForm.companyPhone} placeholder="+998..." value={f.companyPhone ?? ""} onChange={set("companyPhone")} />
            <Input label={t.accountForm.companyEmail} type="email" placeholder="info@company.uz" value={f.companyEmail ?? ""} onChange={set("companyEmail")} />
            <Input label={t.accountForm.website} placeholder="https://company.uz" value={f.website ?? ""} onChange={set("website")} />
            <Input label={t.accountForm.companyType} placeholder={t.accountForm.companyTypePlaceholder} value={f.companyType ?? ""} onChange={set("companyType")} />
            {!isApple && (
              <Input label={t.accountForm.activityType} placeholder={t.accountForm.activityTypePlaceholder} value={f.activityType ?? ""} onChange={set("activityType")} />
            )}

            <div className="h-px bg-slate-200" />
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              {isApple ? t.accountForm.sectionSignatory : t.accountForm.sectionContactPerson}
            </h3>
            <Input label={t.accountForm.cpName} placeholder={t.accountForm.cpNamePlaceholder} value={f.cpName ?? ""} onChange={set("cpName")} />
            <Input label={t.accountForm.cpPosition} placeholder={t.accountForm.cpPositionPlaceholder} value={f.cpPosition ?? ""} onChange={set("cpPosition")} />
            <Input label={t.form.phone} placeholder="+998..." value={f.cpPhone ?? ""} onChange={set("cpPhone")} />
            <Input label={t.form.email} type="email" placeholder="email@..." value={f.cpEmail ?? ""} onChange={set("cpEmail")} />

            {isApple && (
              <div>
                <label className="text-sm font-medium text-slate-700">{t.accountForm.certLabel}</label>
                <p className="text-xs text-slate-500 mb-1.5">{t.accountForm.certHint}</p>
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
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">{t.accountForm.sectionHolder}</h3>
            <Input label={isApple ? t.accountForm.holderNameApple : t.accountForm.holderName} required placeholder={t.form.fullNamePlaceholder} value={f.holderName ?? ""} onChange={set("holderName")} />
            {isApple ? (
              <>
                <Textarea label={t.accountForm.legalAddress} rows={2} placeholder={t.accountForm.legalAddressPlaceholder} value={f.legalAddress ?? ""} onChange={set("legalAddress")} />
                <Input label={t.form.phone} placeholder="+998..." value={f.holderPhone ?? ""} onChange={set("holderPhone")} />
              </>
            ) : (
              <Input label={t.accountForm.country} placeholder={t.accountForm.countryPlaceholder} value={f.country ?? ""} onChange={set("country")} />
            )}
          </>
        )}

        <Textarea label={t.accountForm.extraNote} rows={2} placeholder={t.form.notePlaceholder} value={f.note ?? ""} onChange={set("note")} />

        {error && status === "error" && <p className="text-sm text-red-600">❌ {error}</p>}

        <Button type="submit" size="lg" className="w-full">{t.form.submitCheck}</Button>
      </form>
    </>
  );
}
