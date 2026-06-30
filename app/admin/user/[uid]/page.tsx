import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/Logo";
import { AuthButtons } from "@/components/auth/AuthButtons";
import { AdminUserDetail } from "@/components/admin/AdminUserDetail";
import { requireAdmin } from "@/lib/auth/dal";
import { getUser } from "@/lib/firestore/users";
import { getUserApps } from "@/lib/firestore/apps";
import { getUserPayments } from "@/lib/firestore/payments";
import { getUserReviews } from "@/lib/firestore/reviews";

export const metadata: Metadata = { title: "Foydalanuvchi — Admin — UMD GROUP" };
export const dynamic = "force-dynamic";

export default async function AdminUserPage({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  await requireAdmin();
  const { uid } = await params;

  const user = await getUser(uid);
  if (!user) notFound();

  const [apps, payments, reviews] = await Promise.all([
    getUserApps(uid),
    getUserPayments(uid),
    getUserReviews(uid),
  ]);

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

        <h1 className="text-xl font-bold text-slate-900 mb-1">{user.fullName || user.email}</h1>
        <p className="text-sm text-slate-500 mb-5">{user.email}</p>

        <AdminUserDetail user={user} apps={apps} payments={payments} reviews={reviews} />
      </main>
    </div>
  );
}
