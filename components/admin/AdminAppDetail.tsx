"use client";

import { useState } from "react";
import { AdminAppRow } from "@/components/admin/AdminAppRow";
import { AdminPaymentRow } from "@/components/admin/AdminPaymentRow";
import { ActivityTimeline } from "@/components/panel/ActivityTimeline";
import type { AppView } from "@/lib/firestore/apps";
import type { PaymentView } from "@/lib/firestore/payments";
import type { ActivityView } from "@/lib/firestore/activity";

const FIELD_LABELS: Record<string, string> = {
  fullName: "To'liq ism",
  phone: "Telefon",
  email: "Email",
  telegram: "Telegram",
  appName: "Ilova nomi",
  packageName: "Package name",
  shortDescription: "Qisqa tavsif",
  fullDescription: "To'liq tavsif",
  privacyPolicyUrl: "Privacy Policy",
  subtitle: "Subtitle",
  supportUrl: "Support URL",
  githubRepoUrl: "GitHub repo",
  githubUsername: "GitHub username",
  bundleId: "Bundle ID",
  certificatePassword: "Sertifikat paroli",
  keystorePassword: "Keystore paroli",
  keyAlias: "Key alias",
  keyPassword: "Key paroli",
  testLogin: "Test login",
  testPassword: "Test parol",
  note: "Izoh",
  developerAccountId: "Developer Account ID",
  googlePaymentsProfileId: "Payments Profile ID",
  appStoreConnectTeamId: "App Store Connect Team ID",
  appleDevAccountEmail: "Apple Dev akkaunt email",
  platform: "Platforma",
  accountType: "Akkaunt turi",
  login: "Akkaunt login",
  loginPassword: "Akkaunt paroli",
  holderName: "Akkaunt egasi (F.I.O.)",
  holderPhone: "Telefon",
  country: "Mamlakat",
  companyName: "Yuridik kompaniya nomi",
  legalAddress: "Yuridik manzil",
  companyPhone: "Kompaniya telefoni",
  companyEmail: "Kompaniya email",
  website: "Veb-sayt",
  companyType: "Kompaniya turi",
  activityType: "Faoliyat turi",
  cpName: "Kontakt/Signatory F.I.O.",
  cpPosition: "Lavozim",
  cpPhone: "Kontakt telefon",
  cpEmail: "Kontakt email",
};

export function AdminAppDetail({
  app,
  submission,
  payments,
  activity,
}: {
  app: AppView;
  submission: Record<string, string>;
  payments: PaymentView[];
  activity: ActivityView[];
}) {
  const [tab, setTab] = useState<"info" | "payment" | "activity">("info");

  const entries = Object.entries(submission).filter(([, v]) => v && String(v).trim() !== "");
  const pendingPay = payments.filter((p) => p.status === "pending").length;

  return (
    <div>
      {/* Tablar */}
      <div className="flex gap-1 border-b border-slate-200 mb-5">
        {([
          { key: "info" as const, label: "Ma'lumot" },
          { key: "payment" as const, label: "To'lov" },
          { key: "activity" as const, label: "Amaliyotlar tarixi" },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.label}
            {t.key === "payment" && (
              <span className="text-xs text-slate-400">{payments.length}</span>
            )}
            {t.key === "activity" && (
              <span className="text-xs text-slate-400">{activity.length}</span>
            )}
            {t.key === "payment" && pendingPay > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                {pendingPay}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "info" && (
        <div className="flex flex-col gap-4">
          {/* Boshqaruv (status, chiqarish, obuna) */}
          <AdminAppRow app={app} />

          {/* Yuborilgan ma'lumotlar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
            <h3 className="font-semibold text-slate-900 mb-3 text-sm">Yuborilgan ma&apos;lumotlar</h3>
            {entries.length ? (
              <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
                {entries.map(([k, v]) => (
                  <div key={k} className="min-w-0">
                    <dt className="text-[11px] text-slate-400">{FIELD_LABELS[k] ?? k}</dt>
                    <dd className="text-sm text-slate-800 break-words">{v}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-sm text-slate-400">Qo&apos;shimcha ma&apos;lumot yo&apos;q.</p>
            )}
          </div>
        </div>
      )}

      {tab === "payment" && (
        <div>
          {payments.length ? (
            <div className="flex flex-col gap-3">
              {payments.map((pm) => <AdminPaymentRow key={pm.id} payment={pm} relatedPayments={payments} />)}
            </div>
          ) : (
            <p className="text-sm text-slate-400 py-10 text-center">Bu ariza uchun to&apos;lov yo&apos;q.</p>
          )}
        </div>
      )}

      {tab === "activity" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
          <ActivityTimeline items={activity} />
        </div>
      )}
    </div>
  );
}
