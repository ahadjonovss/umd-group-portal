import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/Logo";
import { requireUser } from "@/lib/auth/dal";
import { getAppDetail } from "@/lib/firestore/apps";
import { getAppRequests } from "@/lib/firestore/requests";
import { getAppPayments } from "@/lib/firestore/payments";
import { getPricing, getPaymentInfo } from "@/lib/firestore/settings";
import { getUsdRate } from "@/lib/cbu";
import { isTerminalError, isTerminalSuccess } from "@/lib/app-status";
import { advanceUsd, finalUsd } from "@/lib/payment";
import { SERVICE_LABELS, STATUS_META, formatDate } from "@/lib/labels";
import { REQUEST_TYPE_LABEL, requestStatusLabel, REQUEST_STATUS_META } from "@/lib/request-status";
import { SERVICE_THEME, ServiceLogo } from "@/components/serviceTheme";
import { PaymentView } from "@/components/panel/PaymentView";
import { ReviewButton } from "@/components/panel/ReviewButton";
import {
  StatusProgress,
  SubscriptionProgress,
  TransferSection,
  UpdateSection,
  ClockIcon,
} from "@/components/panel/AppSections";

export const metadata: Metadata = { title: "Ilova — UMD GROUP" };
export const dynamic = "force-dynamic";

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
};

const PAYMENT_KIND_LABEL: Record<string, string> = {
  advance: "Avans (oldindan)",
  final: "Qolgan to'lov",
  transfer: "Transfer to'lovi",
};

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
      <h2 className="text-sm font-bold text-slate-900 mb-4">{title}</h2>
      {children}
    </section>
  );
}

export default async function AppDetailPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const user = await requireUser();
  const { appId } = await params;

  const detail = await getAppDetail(appId);
  if (!detail || detail.app.ownerUid !== user.uid) notFound();
  const { app, submission } = detail;

  const [pricing, paymentInfo, usdRate, requests, payments] = await Promise.all([
    getPricing(),
    getPaymentInfo(),
    getUsdRate(),
    getAppRequests(appId),
    getAppPayments(appId),
  ]);

  const theme = SERVICE_THEME[app.serviceType];
  const status = STATUS_META[app.status];
  const title = app.appName || SERVICE_LABELS[app.serviceType];
  const transferred = app.status === "transferred";
  const subStarted = Boolean(app.subscription?.startDate);
  const canReview = isTerminalSuccess(app.status);

  const rate = usdRate ?? null;
  const advanceAmount = Math.round(advanceUsd(app.serviceType, pricing));
  const advanceUzs = rate ? Math.round(advanceAmount * rate) : null;
  const finalAmount = Math.round(finalUsd(app.serviceType, pricing));
  const finalUzs = rate ? Math.round(finalAmount * rate) : null;

  const showAdvance = app.status === "payment_pending";
  const showFinal = app.status === "published" && !app.finalPaid && finalAmount > 0;
  const paymentDone = app.finalPaid || finalAmount === 0;

  const transferReq = requests.find((r) => r.type === "transfer") ?? null;
  const updateReq = requests.find((r) => r.type === "update") ?? null;

  const infoEntries = Object.entries(submission).filter(([, v]) => v && String(v).trim() !== "");

  const cardNumber = paymentInfo?.cardNumber ?? "";
  const cardHolder = paymentInfo?.cardHolder ?? "";

  const hasActions = !transferred && (showAdvance || showFinal || app.status === "published");

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-3xl mx-auto px-4 py-3.5 flex items-center gap-3">
          <Link href="/panel" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kabinet
          </Link>
          <div className="flex-1" />
          <Logo size={26} color="#3a3733" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-4">
        {/* Hero */}
        <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
          <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${theme.accent}`} />
          <div className="flex gap-4 items-start pl-2">
            <ServiceLogo serviceType={app.serviceType} iconUrl={app.iconUrl} appName={app.appName} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="text-lg font-bold text-slate-900 truncate">{title}</h1>
                  <p className={`text-sm font-medium ${theme.text}`}>{SERVICE_LABELS[app.serviceType]}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 flex-shrink-0 ${status.badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                  {status.label}
                </span>
              </div>

              <div className="mt-4">
                {transferred ? (
                  <div className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 ring-1 ring-violet-200 px-2.5 py-1.5 text-xs font-medium text-violet-700">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {formatDate(app.transferredAt)} da transfer qilingan
                  </div>
                ) : subStarted ? (
                  <SubscriptionProgress sub={app.subscription!} />
                ) : (
                  <StatusProgress app={app} />
                )}
              </div>
            </div>
          </div>

          {/* Status tushuntirishi */}
          {!transferred && (
            <p className="flex items-start gap-1.5 text-xs text-slate-500 leading-snug mt-4 pl-2">
              <svg className="w-3.5 h-3.5 flex-shrink-0 mt-px text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{status.desc}</span>
            </p>
          )}
        </div>

        {/* Amallar */}
        {hasActions && (
          <SectionCard title="Amallar">
            <div className="flex flex-col gap-4">
              {showAdvance && (
                <PaymentView
                  idPayload={{ appId: app.id }}
                  usd={advanceAmount}
                  rate={rate}
                  uzs={advanceUzs}
                  cardNumber={cardNumber}
                  cardHolder={cardHolder}
                  receiptSent={app.receiptSent}
                />
              )}

              {showFinal && (
                <div className="rounded-xl bg-amber-50 ring-1 ring-amber-200 p-3.5 flex flex-col gap-2">
                  <p className="text-sm font-semibold text-amber-800">Qolgan to&apos;lovni amalga oshiring</p>
                  <p className="text-xs text-amber-700 leading-snug">
                    ⚠️ To&apos;lovning qolgan qismini o&apos;z vaqtida to&apos;lang. Aks holda ilova store&apos;dan
                    olib tashlanishi mumkin.
                  </p>
                  <PaymentView
                    endpoint="/api/payment/receipt"
                    idPayload={{ appId: app.id, kind: "final" }}
                    amountLabel="Qolgan to'lov"
                    usd={finalAmount}
                    rate={rate}
                    uzs={finalUzs}
                    cardNumber={cardNumber}
                    cardHolder={cardHolder}
                    receiptSent={app.finalReceiptSent}
                  />
                </div>
              )}

              {app.status === "published" && (
                <>
                  <UpdateSection
                    app={app}
                    req={updateReq}
                    cardNumber={cardNumber}
                    cardHolder={cardHolder}
                    paymentDone={paymentDone}
                  />
                  <TransferSection app={app} req={transferReq} cardNumber={cardNumber} cardHolder={cardHolder} paymentDone={paymentDone} />
                </>
              )}

              {!subStarted && app.subscription && !isTerminalError(app.status) && app.status !== "payment_pending" && (
                <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 ring-1 ring-slate-200 px-2.5 py-1.5 text-xs text-slate-500 self-start">
                  <ClockIcon />
                  Obuna ilova chiqarilgach boshlanadi (9 oy)
                </div>
              )}
            </div>
          </SectionCard>
        )}

        {/* Store havolasi */}
        {app.publication.published && (
          <SectionCard title="Store'da">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-500">Chiqarilgan sana: <strong className="text-slate-800">{formatDate(app.publication.publishedAt)}</strong></span>
              {app.publication.storeUrl && (
                <a
                  href={app.publication.storeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1 font-semibold ${theme.text} hover:underline`}
                >
                  Store havolasi ↗
                </a>
              )}
            </div>
          </SectionCard>
        )}

        {/* Baholash */}
        {canReview && (
          <SectionCard title="Xizmatni baholang">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-slate-500">Xizmatimiz haqidagi fikringiz biz uchun muhim.</p>
              <ReviewButton appId={app.id} reviewed={app.reviewed} />
            </div>
          </SectionCard>
        )}

        {/* Ilova ma'lumotlari */}
        <SectionCard title="Ilova ma'lumotlari">
          {infoEntries.length ? (
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
              {infoEntries.map(([k, v]) => (
                <div key={k} className="min-w-0">
                  <dt className="text-[11px] text-slate-400">{FIELD_LABELS[k] ?? k}</dt>
                  <dd className="text-sm text-slate-800 break-words">{v}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-slate-400">Qo&apos;shimcha ma&apos;lumot yo&apos;q.</p>
          )}
        </SectionCard>

        {/* So'rovlar tarixi */}
        {requests.length > 0 && (
          <SectionCard title="So'rovlar tarixi">
            <div className="flex flex-col gap-2">
              {requests.map((r) => {
                const m = REQUEST_STATUS_META[r.status];
                return (
                  <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 ring-1 ring-slate-100 px-3.5 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800">
                        {REQUEST_TYPE_LABEL[r.type]}
                        <span className="text-slate-400 font-normal"> · ${r.amountUsd}</span>
                      </p>
                      <p className="text-[11px] text-slate-400">{formatDate(r.createdAt)}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 flex-shrink-0 ${m.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
                      {requestStatusLabel(r.type, r.status)}
                    </span>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        )}

        {/* To'lovlar tarixi */}
        {payments.length > 0 && (
          <SectionCard title="To'lovlar tarixi">
            <div className="flex flex-col gap-2">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 ring-1 ring-slate-100 px-3.5 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800">
                      {PAYMENT_KIND_LABEL[p.kind] ?? p.kind}
                      <span className="text-slate-400 font-normal"> · ${p.amountUsd}</span>
                      {p.amountUzs ? <span className="text-slate-400 font-normal"> (~{p.amountUzs.toLocaleString("en-US")} so&apos;m)</span> : null}
                    </p>
                    <p className="text-[11px] text-slate-400">{formatDate(p.createdAt)}</p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 flex-shrink-0 ${
                      p.status === "confirmed"
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                        : "bg-amber-50 text-amber-700 ring-amber-200"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${p.status === "confirmed" ? "bg-emerald-500" : "bg-amber-500"}`} />
                    {p.status === "confirmed" ? "Tasdiqlangan" : "Kutilmoqda"}
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>
        )}
      </main>
    </div>
  );
}
