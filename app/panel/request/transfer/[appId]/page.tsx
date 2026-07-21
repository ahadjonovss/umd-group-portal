import type { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Logo } from "@/components/Logo";
import { requireUser } from "@/lib/auth/dal";
import { getAppDetail } from "@/lib/firestore/apps";
import { hasActiveRequest } from "@/lib/firestore/requests";
import { getPricing } from "@/lib/firestore/settings";
import { getUsdRate } from "@/lib/cbu";
import { transferUsd, finalUsd } from "@/lib/payment";
import { getActiveDiscount } from "@/lib/firestore/discounts";
import { categoryForRequest, applyDiscount } from "@/lib/discount";
import { SERVICE_LABELS } from "@/lib/labels";
import { TransferRequestForm } from "@/components/panel/TransferRequestForm";

export const metadata: Metadata = { title: "Transfer so'rovi — UMD GROUP" };
export const dynamic = "force-dynamic";

export default async function TransferRequestPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const user = await requireUser();
  const { appId } = await params;

  const detail = await getAppDetail(appId);
  if (!detail) notFound();
  const app = detail.app;
  // Faqat ega + chiqarilgan
  if (app.ownerUid !== user.uid) notFound();
  if (app.status !== "published") redirect("/panel");

  const [pricing, rate] = await Promise.all([getPricing(), getUsdRate()]);
  const paymentDone = Boolean(app.finalPaid) || Math.round(finalUsd(app.serviceType, pricing)) === 0;
  if (!paymentDone) redirect(`/panel/app/${appId}`);
  if (await hasActiveRequest(appId, "transfer")) redirect(`/panel/app/${appId}`);

  const disc = await getActiveDiscount(user.uid, categoryForRequest("transfer"), appId);
  const discPct = disc?.percent ?? 0;
  const usd = Math.round(applyDiscount(transferUsd(app.serviceType, pricing), discPct));
  const uzs = rate ? Math.round(usd * rate) : null;
  const appName = app.appName || SERVICE_LABELS[app.serviceType];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="px-4 py-4">
        <Link href="/panel" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Kabinetga qaytish
        </Link>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-5">
          <Logo size={30} color="#3a3733" />
          <h1 className="text-xl font-bold text-slate-900">Transferga so&apos;rov</h1>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <TransferRequestForm
            appId={appId}
            serviceType={app.serviceType}
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
