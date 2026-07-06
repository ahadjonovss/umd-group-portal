import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/Logo";
import { AuthButtons } from "@/components/auth/AuthButtons";
import { AppCard } from "@/components/panel/AppCard";
import { DraftButton } from "@/components/panel/DraftButton";
import { PanelReviewLauncher, type ReviewItem } from "@/components/panel/PanelReviewLauncher";
import { PublishedReviewAlert } from "@/components/panel/PublishedReviewAlert";
import { requireUser, isAdmin } from "@/lib/auth/dal";
import { getUserApps } from "@/lib/firestore/apps";
import { isTerminalSuccess } from "@/lib/app-status";
import { SERVICE_LABELS } from "@/lib/labels";
import { getPricing } from "@/lib/firestore/settings";
import { getUserRequests } from "@/lib/firestore/requests";

export const metadata: Metadata = { title: "Kabinet — UMD GROUP" };

// Har doim yangi ma'lumot (cache'lanmasin).
export const dynamic = "force-dynamic";

export default async function PanelPage() {
  const user = await requireUser();
  const [apps, admin, pricing, requests] = await Promise.all([
    getUserApps(user.uid),
    isAdmin(),
    getPricing(),
    getUserRequests(user.uid),
  ]);

  // Har ilova uchun eng so'nggi transfer / update / uzaytirish so'rovi
  const transferByApp = new Map<string, (typeof requests)[number]>();
  const updateByApp = new Map<string, (typeof requests)[number]>();
  const renewalByApp = new Map<string, (typeof requests)[number]>();
  for (const r of requests) {
    if (r.type === "transfer" && !transferByApp.has(r.appId)) transferByApp.set(r.appId, r);
    if (r.type === "update" && !updateByApp.has(r.appId)) updateByApp.set(r.appId, r);
    if (r.type === "subscription_renewal" && !renewalByApp.has(r.appId)) renewalByApp.set(r.appId, r);
  }

  const reviewItems: ReviewItem[] = apps.map((a) => ({
    id: a.id,
    label: a.appName || SERVICE_LABELS[a.serviceType],
    reviewed: a.reviewed,
    canReview: isTerminalSuccess(a.status),
  }));

  // Store'ga chiqqan, lekin hali baholanmagan ilovalar — eslatma banneri uchun
  let publishedUnreviewed = reviewItems
    .filter((a) => a.canReview && !a.reviewed)
    .map((a) => ({ id: a.id, label: a.label }));

  // TEST (vaqtincha): dev'da chiqarilgan ilova bo'lmasa ham alertni ko'rsatamiz
  if (process.env.NODE_ENV === "development" && publishedUnreviewed.length === 0 && reviewItems[0]) {
    const first = reviewItems[0];
    publishedUnreviewed = [{ id: first.id, label: first.label }];
    // launcher shu ilovani baholashga ruxsat bersin (aks holda "Baholab bo'lmaydi")
    reviewItems[0] = { ...first, canReview: true, reviewed: false };
  }

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

      <main className="max-w-4xl mx-auto px-4 py-10">
        <PublishedReviewAlert apps={publishedUnreviewed} />

        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Salom, {user.name || user.email} 👋
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              Ilovalaringiz, ularning holati va obuna muddati
            </p>
          </div>
          <div className="flex-shrink-0 flex items-center gap-2">
            {process.env.NODE_ENV === "development" && <DraftButton />}
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
            >
              + Yangi ariza
            </Link>
          </div>
        </div>

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
          <div className="flex flex-col gap-3">
            {apps.map((app) => (
              <AppCard
                key={app.id}
                app={app}
                pricing={pricing}
                transferRequest={transferByApp.get(app.id) ?? null}
                updateRequest={updateByApp.get(app.id) ?? null}
                renewalRequest={renewalByApp.get(app.id) ?? null}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
