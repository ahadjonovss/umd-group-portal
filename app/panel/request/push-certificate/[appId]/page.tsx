import type { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Logo } from "@/components/Logo";
import { requireUser } from "@/lib/auth/dal";
import { getAppDetail } from "@/lib/firestore/apps";
import { hasActiveRequest } from "@/lib/firestore/requests";
import { getPricing } from "@/lib/firestore/settings";
import { getUsdRate } from "@/lib/cbu";
import { pushCertUsd, finalUsdApp } from "@/lib/payment";
import { getActiveDiscount } from "@/lib/firestore/discounts";
import { categoryForRequest, applyDiscount } from "@/lib/discount";
import { isTerminalSuccess } from "@/lib/app-status";
import { platformOf } from "@/lib/labels";
import { getT } from "@/lib/i18n/server";
import { appTitleOf } from "@/lib/i18n/format";
import { PushCertRequestForm } from "@/components/panel/PushCertRequestForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.requestPage.pushMeta };
}
export const dynamic = "force-dynamic";

export default async function PushCertRequestPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const user = await requireUser();
  const { appId } = await params;

  const detail = await getAppDetail(appId);
  if (!detail) notFound();
  const app = detail.app;
  if (app.ownerUid !== user.uid) notFound();
  // Faqat Apple (iOS) ilovalar, chiqarilgan/yakunlangan
  if (platformOf(app.serviceType) !== "ios" || !isTerminalSuccess(app.status)) redirect(`/panel/app/${appId}`);

  const [pricing, rate] = await Promise.all([getPricing(), getUsdRate()]);
  const paymentDone = Boolean(app.finalPaid) || Math.round(finalUsdApp(app, pricing)) === 0;
  if (!paymentDone) redirect(`/panel/app/${appId}`);
  if (await hasActiveRequest(appId, "push_certificate")) redirect(`/panel/app/${appId}`);

  const disc = await getActiveDiscount(user.uid, categoryForRequest("push_certificate"), appId);
  const discPct = disc?.percent ?? 0;
  const usd = Math.round(applyDiscount(pushCertUsd(pricing), discPct));
  const uzs = rate ? Math.round(usd * rate) : null;
  const t = await getT();
  const appName = appTitleOf(t, app.appName, app.serviceType);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="px-4 py-4">
        <Link href={`/panel/app/${appId}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t.requestPage.backToApp}
        </Link>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-5">
          <Logo size={30} color="#3a3733" />
          <h1 className="text-xl font-bold text-slate-900">{t.requestPage.pushTitle}</h1>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <PushCertRequestForm
            appId={appId}
            appName={appName}
            usd={usd}
            uzs={uzs}
            rate={rate}
            discountPercent={discPct}
          />
        </div>
      </main>
    </div>
  );
}
