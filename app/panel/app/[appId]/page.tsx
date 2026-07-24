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
import { advanceUsdApp, finalUsdApp } from "@/lib/payment";
import { getActiveDiscount } from "@/lib/firestore/discounts";
import { getAppReview } from "@/lib/firestore/reviews";
import { getAppActivity } from "@/lib/firestore/activity";
import { ActivityTimeline } from "@/components/panel/ActivityTimeline";
import { AppDetailTabs } from "@/components/panel/AppDetailTabs";
import { categoryForServiceType, applyDiscount } from "@/lib/discount";
import { appAdvanceStage, showFinalPayment, appPaymentDone } from "@/lib/panel-status";
import { getInstallment, isPayable } from "@/lib/payment-state";
import { SERVICE_LABELS, STATUS_META, accountLabel, formatDate, platformOf } from "@/lib/labels";
import { REQUEST_TYPE_LABEL, requestStatusLabel, REQUEST_STATUS_META } from "@/lib/request-status";
import { SERVICE_THEME, ServiceLogo } from "@/components/serviceTheme";
import { PaymentView } from "@/components/panel/PaymentView";
import { ReviewButton } from "@/components/panel/ReviewButton";
import { ReceiptButton } from "@/components/panel/ReceiptButton";
import {
  StatusProgress,
  SubscriptionProgress,
  TransferSection,
  UpdateSection,
  RenewalSection,
  PushCertSection,
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
  transactionId: "Transaction ID",
  appStoreConnectTeamId: "App Store Connect Team ID",
  appleDevAccountEmail: "Apple Dev akkaunt email",
  releaseNotes: "Relizdagi o'zgarishlar",
  months: "Muddat (oy)",
  // Akkaunt ochish
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

const PAYMENT_KIND_LABEL: Record<string, string> = {
  advance: "Avans (oldindan)",
  final: "Qolgan to'lov",
  transfer: "Transfer to'lovi",
  update: "Update to'lovi",
  renewal: "Obuna uzaytirish",
  push_certificate: "Push sertifikat",
};

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
      <h2 className="text-sm font-bold text-slate-900 mb-4">{title}</h2>
      {children}
    </section>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} className={`w-4 h-4 ${n <= rating ? "text-amber-400" : "text-slate-200"}`} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </span>
  );
}

function InfoGroup({ label, rows }: { label: string; rows: [string, string][] }) {
  if (!rows.length) return null;
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-2">{label}</p>
      <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
        {rows.map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="text-[11px] text-slate-400">{k}</dt>
            <dd className="text-sm text-slate-800 break-words">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
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

  const [pricing, paymentInfo, usdRate, requests, payments, myReview, activity] = await Promise.all([
    getPricing(),
    getPaymentInfo(),
    getUsdRate(),
    getAppRequests(appId),
    getAppPayments(appId),
    getAppReview(appId, user.uid),
    getAppActivity(appId),
  ]);

  const theme = SERVICE_THEME[app.serviceType];
  const status = STATUS_META[app.status];
  const title = app.appName || SERVICE_LABELS[app.serviceType];
  const transferred = app.status === "transferred";
  const subStarted = Boolean(app.subscription?.startDate);
  const canReview = isTerminalSuccess(app.status);

  // Chegirma (bo'lsa) — avans va yakuniyга qo'llanadi
  const discCategory = categoryForServiceType(app.serviceType);
  const disc = discCategory ? await getActiveDiscount(user.uid, discCategory, appId) : null;
  const discPct = disc?.percent ?? 0;

  const rate = usdRate ?? null;
  const advanceAmount = Math.round(applyDiscount(advanceUsdApp(app, pricing), discPct));
  const advanceUzs = rate ? Math.round(advanceAmount * rate) : null;
  const finalAmount = Math.round(applyDiscount(finalUsdApp(app, pricing), discPct));
  const finalUzs = rate ? Math.round(finalAmount * rate) : null;

  const showAdvance = appAdvanceStage(app, pricing);
  const showFinal = showFinalPayment(app, pricing);
  const paymentDone = appPaymentDone(app, pricing);
  // To'lov amali kerak (to'lash mumkin bo'lgan qism) — shu holda To'lov tabı avtomatik ochiladi
  const advInst = getInstallment(app.payment, "advance");
  const finInst = getInstallment(app.payment, "final");
  const paymentNeeded =
    (showAdvance && (advInst ? isPayable(advInst) : !app.receiptSent)) ||
    (showFinal && (finInst ? isPayable(finInst) : !app.finalReceiptSent));

  const transferReq = requests.find((r) => r.type === "transfer") ?? null;
  const updateReq = requests.find((r) => r.type === "update") ?? null;
  const renewalReq = requests.find((r) => r.type === "subscription_renewal") ?? null;
  const pushReq = requests.find((r) => r.type === "push_certificate") ?? null;

  // Umumiy metama'lumot
  const generalRows: [string, string][] = [];
  if (app.appName) generalRows.push(["Ilova nomi", app.appName]);
  generalRows.push([
    "Xizmat turi",
    app.serviceType === "account" && app.accountPlatform
      ? `${SERVICE_LABELS[app.serviceType]} · ${accountLabel(app.accountPlatform, app.accountType)}`
      : SERVICE_LABELS[app.serviceType],
  ]);
  generalRows.push(["Holati", status.label]);
  generalRows.push(["Yuborilgan sana", formatDate(app.createdAt)]);
  if (app.publication.published) generalRows.push(["Store'ga chiqarilgan", formatDate(app.publication.publishedAt)]);
  if (app.publishedPrice) generalRows.push(["Chiqarilgan narx", `$${app.publishedPrice}`]);
  if (app.taxPhone) generalRows.push(["Soliq cheki telefoni", app.taxPhone]);
  if (app.subscription?.startDate) {
    generalRows.push(["Obuna boshlangan", formatDate(app.subscription.startDate)]);
    generalRows.push(["Obuna tugashi", formatDate(app.subscription.endDate)]);
    generalRows.push(["Obuna holati", app.subscription.active ? "Faol" : "Faol emas"]);
    if (app.subscription.renewedCount > 0) generalRows.push(["Uzaytirilgan", `${app.subscription.renewedCount} marta`]);
  }
  if (transferred) generalRows.push(["Transfer qilingan", formatDate(app.transferredAt)]);

  // Aloqa ma'lumotlari
  const contactRows: [string, string][] = [];
  if (app.contact?.fullName) contactRows.push(["To'liq ism", app.contact.fullName]);
  if (app.contact?.phone) contactRows.push(["Telefon", app.contact.phone]);
  if (app.contact?.email) contactRows.push(["Email", app.contact.email]);

  // Yuborilgan (forma) ma'lumotlari — aloqa maydonlarini takrorlamaymiz
  const CONTACT_KEYS = new Set(["fullName", "phone", "email", "telegram"]);
  const submissionRows: [string, string][] = Object.entries(submission)
    .filter(([k, v]) => v && String(v).trim() !== "" && !CONTACT_KEYS.has(k))
    .map(([k, v]) => [FIELD_LABELS[k] ?? k, String(v)]);

  const hasAnyInfo = generalRows.length + contactRows.length + submissionRows.length > 0;

  const cardNumber = paymentInfo?.cardNumber ?? "";
  const cardHolder = paymentInfo?.cardHolder ?? "";

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

        <AppDetailTabs
          paymentCount={payments.length}
          activityCount={activity.length}
          defaultPayment={paymentNeeded}
          info={
            <>
              {/* Amallar — update / obuna uzaytirish / transfer / push sertifikat.
                  Faqat to'lovi yakunlangan chiqarilgan ilovada (yoki iOS yakunlangan — push uchun). */}
              {paymentDone && (app.status === "published" || (isTerminalSuccess(app.status) && platformOf(app.serviceType) === "ios")) && (
                <SectionCard title="Amallar">
                  <div className="flex flex-col gap-4">
                    <UpdateSection app={app} req={updateReq} cardNumber={cardNumber} cardHolder={cardHolder} paymentDone={paymentDone} />
                    <RenewalSection app={app} req={renewalReq} cardNumber={cardNumber} cardHolder={cardHolder} paymentDone={paymentDone} />
                    <TransferSection app={app} req={transferReq} cardNumber={cardNumber} cardHolder={cardHolder} paymentDone={paymentDone} />
                    <PushCertSection app={app} req={pushReq} cardNumber={cardNumber} cardHolder={cardHolder} paymentDone={paymentDone} />
                  </div>
                </SectionCard>
              )}

              {/* Obuna eslatmasi (chiqarishdan oldin) */}
              {!subStarted && app.subscription && !isTerminalError(app.status) && (
                <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 ring-1 ring-slate-200 px-2.5 py-1.5 text-xs text-slate-500 self-start">
                  <ClockIcon />
                  Obuna ilova chiqarilgach boshlanadi (9 oy)
                </div>
              )}

              {/* Ilova ma'lumotlari */}
              <SectionCard title="Ilova ma'lumotlari">
                {hasAnyInfo ? (
                  <div className="flex flex-col gap-5">
                    <InfoGroup label="Umumiy" rows={generalRows} />
                    <InfoGroup label="Aloqa" rows={contactRows} />
                    <InfoGroup label="Yuborilgan ma'lumotlar" rows={submissionRows} />
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">Qo&apos;shimcha ma&apos;lumot yo&apos;q.</p>
                )}
              </SectionCard>

              {/* So'rovlar (transfer/update/uzaytirish) — ma'lumotlari + statusi bilan */}
              {requests.length > 0 && (
                <SectionCard title="So'rovlar">
                  <div className="flex flex-col gap-3">
                    {requests.map((r) => {
                      const m = REQUEST_STATUS_META[r.status];
                      const dataEntries = Object.entries(r.data).filter(([, v]) => v && String(v).trim() !== "");
                      return (
                        <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-3.5 flex flex-col gap-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-900">
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
                          {dataEntries.length > 0 && (
                            <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1.5 bg-slate-50 rounded-lg p-3">
                              {dataEntries.map(([k, v]) => (
                                <div key={k} className="min-w-0">
                                  <p className="text-[10px] text-slate-400">{FIELD_LABELS[k] ?? k}</p>
                                  <p className="text-sm text-slate-800 break-words">{v}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
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
              {(canReview || myReview) && (
                <SectionCard title="Xizmatni baholash">
                  {myReview ? (
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Stars rating={myReview.rating} />
                        <span className="text-xs text-slate-400">{formatDate(myReview.date)}</span>
                        <span
                          className={`ml-auto text-[11px] px-2 py-0.5 rounded-full font-medium ring-1 ${
                            myReview.approved
                              ? "bg-emerald-50 text-emerald-600 ring-emerald-200"
                              : "bg-amber-50 text-amber-600 ring-amber-200"
                          }`}
                        >
                          {myReview.approved ? "E'lon qilingan" : "Tekshiruvda"}
                        </span>
                      </div>
                      {myReview.comment && (
                        <p className="text-sm text-slate-700 whitespace-pre-line">{myReview.comment}</p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-slate-500">Xizmatimiz haqidagi fikringiz biz uchun muhim.</p>
                      <ReviewButton appId={app.id} reviewed={app.reviewed} />
                    </div>
                  )}
                </SectionCard>
              )}
            </>
          }
          payment={
            <>
              {showAdvance || showFinal ? (
                <SectionCard title="To'lov">
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
                  askTaxPhone={finalAmount === 0}
                  discountPercent={discPct}
                />
              )}

              {showFinal && (
                <div className="rounded-xl bg-amber-50 ring-1 ring-amber-200 p-3.5 flex flex-col gap-2">
                  <p className="text-sm font-semibold text-amber-800">Qolgan to&apos;lovni amalga oshiring</p>
                  <p className="text-xs text-amber-700 leading-snug">
                    {app.serviceType === "account"
                      ? "Akkaunt tayyor. Xizmatni yakunlash uchun qolgan to'lovni amalga oshiring."
                      : "⚠️ To'lovning qolgan qismini o'z vaqtida to'lang. Aks holda ilova store'dan olib tashlanishi mumkin."}
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
                    askTaxPhone
                    discountPercent={discPct}
                  />
                </div>
              )}

                  </div>
                </SectionCard>
              ) : payments.length === 0 ? (
                <p className="text-sm text-slate-400 py-6 text-center">Hozircha to&apos;lov amali yo&apos;q.</p>
              ) : null}

              {/* To'lovlar tarixi */}
              {payments.length > 0 && (
                <SectionCard title="To'lovlar tarixi">
                  <div className="flex flex-col gap-2">
                    {payments.map((p) => (
                      <div key={p.id} className="rounded-xl bg-slate-50 ring-1 ring-slate-100 px-4 py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">
                            {PAYMENT_KIND_LABEL[p.kind] ?? p.kind}
                            <span className="text-slate-400 font-normal"> · ${p.amountUsd}</span>
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {formatDate(p.createdAt)}
                            {p.amountUzs ? ` · ~${p.amountUzs.toLocaleString("en-US")} so'm` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {p.taxReceiptUrl && <ReceiptButton url={p.taxReceiptUrl} variant="subtle" />}
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 ${
                              p.status === "confirmed"
                                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                : p.status === "rejected"
                                  ? "bg-red-50 text-red-700 ring-red-200"
                                  : "bg-amber-50 text-amber-700 ring-amber-200"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${p.status === "confirmed" ? "bg-emerald-500" : p.status === "rejected" ? "bg-red-500" : "bg-amber-500"}`} />
                            {p.status === "confirmed" ? "Tasdiqlangan" : p.status === "rejected" ? "Rad etilgan" : "Kutilmoqda"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              )}
            </>
          }
          activity={
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
              <ActivityTimeline items={activity} forUser />
            </div>
          }
        />
      </main>
    </div>
  );
}
