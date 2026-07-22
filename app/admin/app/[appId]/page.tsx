import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/Logo";
import { AuthButtons } from "@/components/auth/AuthButtons";
import { AdminAppDetail } from "@/components/admin/AdminAppDetail";
import { requireAdmin } from "@/lib/auth/dal";
import { getAppDetail } from "@/lib/firestore/apps";
import { getAppPayments } from "@/lib/firestore/payments";
import { getAppActivity } from "@/lib/firestore/activity";
import { SERVICE_LABELS } from "@/lib/labels";

export const metadata: Metadata = { title: "Ariza — Admin — UMD GROUP" };
export const dynamic = "force-dynamic";

export default async function AdminAppPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  await requireAdmin();
  const { appId } = await params;

  const detail = await getAppDetail(appId);
  if (!detail) notFound();

  const [payments, activity] = await Promise.all([getAppPayments(appId), getAppActivity(appId)]);
  const title = detail.app.appName || SERVICE_LABELS[detail.app.serviceType];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={30} color="#3a3733" />
            <span className="text-sm font-bold text-slate-900">UMD GROUP</span>
          </Link>
          <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[11px] font-semibold">ADMIN</span>
          <div className="flex-1" />
          <AuthButtons />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-4">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Admin panelga qaytish
        </Link>

        <h1 className="text-xl font-bold text-slate-900 mb-5">{title}</h1>

        <AdminAppDetail app={detail.app} submission={detail.submission} payments={payments} activity={activity} />
      </main>
    </div>
  );
}
