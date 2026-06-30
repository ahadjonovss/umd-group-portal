import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/Logo";
import { AuthButtons } from "@/components/auth/AuthButtons";
import { AppCard } from "@/components/panel/AppCard";
import { PanelReviewLauncher, type ReviewItem } from "@/components/panel/PanelReviewLauncher";
import { requireUser } from "@/lib/auth/dal";
import { getUserApps } from "@/lib/firestore/apps";
import { isTerminalSuccess } from "@/lib/app-status";
import { SERVICE_LABELS } from "@/lib/labels";

export const metadata: Metadata = { title: "Kabinet — UMD GROUP" };

// Har doim yangi ma'lumot (cache'lanmasin).
export const dynamic = "force-dynamic";

export default async function PanelPage() {
  const user = await requireUser();
  const apps = await getUserApps(user.uid);

  const reviewItems: ReviewItem[] = apps.map((a) => ({
    id: a.id,
    label: a.appName || SERVICE_LABELS[a.serviceType],
    reviewed: a.reviewed,
    canReview: isTerminalSuccess(a.status),
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
          <AuthButtons />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Salom, {user.name || user.email} 👋
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              Ilovalaringiz, ularning holati va obuna muddati
            </p>
          </div>
          <Link
            href="/"
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
          >
            + Yangi ariza
          </Link>
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
              <AppCard key={app.id} app={app} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
