import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/Logo";
import { AuthButtons } from "@/components/auth/AuthButtons";
import { PanelApps } from "@/components/panel/PanelApps";
import { NewRequestButton } from "@/components/panel/NewRequestButton";
import { DraftButton } from "@/components/panel/DraftButton";
import type { RequestView } from "@/lib/firestore/requests";
import { PanelReviewLauncher, type ReviewItem } from "@/components/panel/PanelReviewLauncher";
import { PublishedReviewAlert } from "@/components/panel/PublishedReviewAlert";
import { DiscountAlert } from "@/components/panel/DiscountAlert";
import { PackageExpiryAlert } from "@/components/panel/PackageExpiryAlert";
import { PaymentAlerts, type PaymentAlertItem } from "@/components/panel/PaymentAlerts";
import { getUserActiveDiscounts } from "@/lib/firestore/discounts";
import { getUserWalletUzs, getUserTelegram } from "@/lib/firestore/users";
import { WalletCard } from "@/components/panel/WalletCard";
import { TelegramLinkAlert } from "@/components/panel/TelegramLinkAlert";
import { requireUser, isAdmin } from "@/lib/auth/dal";
import { getUserApps } from "@/lib/firestore/apps";
import { isTerminalSuccess, isTerminalError } from "@/lib/app-status";
import { SERVICE_LABELS } from "@/lib/labels";
import { getPricing, getPaymentInfo } from "@/lib/firestore/settings";
import { getUserRequests } from "@/lib/firestore/requests";
import { getUsdRate } from "@/lib/cbu";
import { advanceUsdApp, finalUsdApp, renewalUsd } from "@/lib/payment";
import { getInstallment, isPayable } from "@/lib/payment-state";
import { categoryForServiceType, applyDiscount } from "@/lib/discount";
import { REQUEST_TYPE_LABEL } from "@/lib/request-status";

export const metadata: Metadata = { title: "Kabinet — UMD GROUP" };

// Har doim yangi ma'lumot (cache'lanmasin).
export const dynamic = "force-dynamic";

export default async function PanelPage() {
  const user = await requireUser();
  const [apps, admin, pricing, requests, discounts, walletUzs, telegram, paymentInfo, usdRate] = await Promise.all([
    getUserApps(user.uid),
    isAdmin(),
    getPricing(),
    getUserRequests(user.uid),
    getUserActiveDiscounts(user.uid),
    getUserWalletUzs(user.uid),
    getUserTelegram(user.uid),
    getPaymentInfo(),
    getUsdRate(),
  ]);
  const rate = usdRate ?? null;
  const cardNumber = paymentInfo?.cardNumber ?? "";
  const cardHolder = paymentInfo?.cardHolder ?? "";

  // Har ilova uchun eng so'nggi transfer / update / uzaytirish so'rovi
  const transferByApp: Record<string, RequestView> = {};
  const updateByApp: Record<string, RequestView> = {};
  const renewalByApp: Record<string, RequestView> = {};
  for (const r of requests) {
    if (r.type === "transfer" && !transferByApp[r.appId]) transferByApp[r.appId] = r;
    if (r.type === "update" && !updateByApp[r.appId]) updateByApp[r.appId] = r;
    if (r.type === "subscription_renewal" && !renewalByApp[r.appId]) renewalByApp[r.appId] = r;
  }

  const reviewItems: ReviewItem[] = apps.map((a) => ({
    id: a.id,
    label: a.appName || SERVICE_LABELS[a.serviceType],
    reviewed: a.reviewed,
    canReview: isTerminalSuccess(a.status),
  }));

  // To'lovi kutilayotgan (to'lanmagan) barcha to'lovlar — home kartochkalari uchun
  const discPctFor = (serviceType: (typeof apps)[number]["serviceType"]): number => {
    const cat = categoryForServiceType(serviceType);
    const d = cat ? discounts.find((x) => x.service === cat) : null;
    return d?.percent ?? 0;
  };
  const payAlerts: PaymentAlertItem[] = [];
  for (const a of apps) {
    if (isTerminalError(a.status) || a.status === "transferred" || a.status === "subscription_ended") continue;
    const title = a.appName || SERVICE_LABELS[a.serviceType];
    const pct = discPctFor(a.serviceType);
    const adv = getInstallment(a.payment, "advance");
    const fin = getInstallment(a.payment, "final");
    if (isPayable(adv)) {
      const amt = Math.round(applyDiscount(advanceUsdApp(a, pricing), pct));
      if (amt > 0) payAlerts.push({ appId: a.id, title, label: fin ? "Avans to'lovi" : "To'lov", usd: amt, key: { type: "app", appId: a.id, kind: "advance" } });
    }
    if (isPayable(fin)) {
      const amt = Math.round(applyDiscount(finalUsdApp(a, pricing), pct));
      if (amt > 0) payAlerts.push({ appId: a.id, title, label: "Yakuniy to'lov", usd: amt, key: { type: "app", appId: a.id, kind: "final" } });
    }
  }
  for (const r of requests) {
    if (r.status === "rejected" || r.status === "cancelled") continue;
    if (!isPayable(getInstallment(r.payment, "full")) || r.amountUsd <= 0) continue;
    const title = r.appName || SERVICE_LABELS[r.serviceType];
    payAlerts.push({ appId: r.appId, title, label: `${REQUEST_TYPE_LABEL[r.type]} to'lovi`, usd: r.amountUsd, key: { type: "request", requestId: r.id } });
  }
  // Obunasi tugab, store'dan olib tashlangan ilovalar — hali faol uzaytirish so'rovi
  // bo'lmasa ham, uzaytirish to'lovi eslatma sifatida chiqadi. Hali so'rov (yozuv) yo'q —
  // shuning uchun "hammasini birga to'lash" guruhiga kirmaydi (key yo'q), avval alohida so'rov ochilishi kerak.
  for (const a of apps) {
    if (a.status !== "subscription_ended") continue;
    const lastRenewal = renewalByApp[a.id];
    // Eski so'rov to'lanishi mumkin bo'lsa (yuqoridagi loop allaqachon ko'rsatadi) yoki
    // to'langan bo'lsa — qo'shimcha eslatma shart emas. Aks holda (so'rov yo'q, yoki
    // holati noaniq/eski migratsiyalanmagan yozuv) — eslatma baribir chiqadi.
    const lastFull = lastRenewal ? getInstallment(lastRenewal.payment, "full") : null;
    if (lastFull && (lastFull.state === "confirmed" || isPayable(lastFull))) continue;
    const title = a.appName || SERVICE_LABELS[a.serviceType];
    const disc = discounts.find((d) => d.service === "renewal" && (!d.boundAppId || d.boundAppId === a.id));
    const amt = Math.round(applyDiscount(renewalUsd(a, pricing), disc?.percent ?? 0));
    if (amt > 0) payAlerts.push({ appId: a.id, title, label: "Obunani uzaytirish", usd: amt });
  }

  // Yakunlangan (chiqarilgan / transfer / akkaunt), lekin hali baholanmagan xizmatlar — eslatma banneri
  const publishedUnreviewed = apps
    .filter((a) => isTerminalSuccess(a.status) && !a.reviewed)
    .map((a) => ({
      id: a.id,
      label: a.appName || SERVICE_LABELS[a.serviceType],
      serviceType: a.serviceType,
    }));

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Suspense fallback={null}>
        <PanelReviewLauncher apps={reviewItems} />
      </Suspense>

      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={30} color="#3a3733" />
            <span className="text-sm font-bold text-slate-900">UMD GROUP</span>
          </Link>
          <div className="flex-1" />
          {admin && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
            >
              Admin
            </Link>
          )}
          <AuthButtons />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-5">
        {/* Hero */}
        <div>
          <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 to-slate-700 p-5 sm:p-6 shadow-lg shadow-slate-900/20">
            {/* Dekор (kesilgan) */}
            <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
              <div className="absolute -right-8 -top-10 w-40 h-40 rounded-full bg-white/5" />
              <div className="absolute right-16 bottom-0 w-24 h-24 rounded-full bg-white/5" />
            </div>
            <div className="relative flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center text-lg sm:text-xl font-bold text-white flex-shrink-0">
                  {(user.name || user.email || "U").trim().charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-2xl font-bold text-white truncate">
                    Salom, {user.name || user.email} 👋
                  </h1>
                  <p className="text-slate-300 mt-0.5 text-xs sm:text-sm truncate">Ilovalaringiz, holati va obuna muddati</p>
                </div>
              </div>
              <div className="flex-shrink-0 flex items-center gap-2">
                {process.env.NODE_ENV === "development" && <DraftButton />}
                <NewRequestButton />
              </div>
            </div>
          </div>
        </div>

        {/* Diqqat talab qiladigan: to'lovlar */}
        <PaymentAlerts items={payAlerts} cardNumber={cardNumber} cardHolder={cardHolder} rate={rate} walletUzs={walletUzs} />

        {/* Hamyon + bildirishnomalar */}
        <WalletCard balanceUzs={walletUzs} />
        <TelegramLinkAlert count={telegram.chatIds.length} />
        <DiscountAlert discounts={discounts} />
        <PackageExpiryAlert apps={apps} />
        <PublishedReviewAlert apps={publishedUnreviewed} />

        {/* Ilovalar */}
        {apps.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/50 p-12 text-center">
            <p className="text-slate-500 text-sm">Hali ariza yubormagansiz.</p>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
            >
              Birinchi arizani yuborish
            </Link>
          </div>
        ) : (
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-3 px-0.5">Ilovalarim <span className="text-slate-400 font-normal">· {apps.length} ta</span></h2>
            <PanelApps
              apps={apps}
              pricing={pricing}
              transfer={transferByApp}
              update={updateByApp}
              renewal={renewalByApp}
            />
          </div>
        )}
      </main>
    </div>
  );
}
