import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { AuthButtons } from "@/components/auth/AuthButtons";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { requireAdmin } from "@/lib/auth/dal";
import { getAllApps } from "@/lib/firestore/apps";
import { getAllReviews } from "@/lib/firestore/reviews";
import { getAllUsers } from "@/lib/firestore/users";
import { getAllPayments } from "@/lib/firestore/payments";
import { getAllRequests } from "@/lib/firestore/requests";
import { getPricing, getPaymentInfo } from "@/lib/firestore/settings";

export const metadata: Metadata = { title: "Admin panel — UMD GROUP" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  const [apps, reviews, users, payments, requests, pricing, payment] = await Promise.all([
    getAllApps(),
    getAllReviews(),
    getAllUsers(),
    getAllPayments(),
    getAllRequests(),
    getPricing(),
    getPaymentInfo(),
  ]);

  // Har bir userga ariza sonini biriktirish (email bo'yicha)
  const countByEmail = new Map<string, number>();
  for (const a of apps) {
    if (a.ownerEmail) countByEmail.set(a.ownerEmail, (countByEmail.get(a.ownerEmail) ?? 0) + 1);
  }
  const usersWithCount = users.map((u) => ({
    ...u,
    appCount: u.email ? countByEmail.get(u.email) ?? 0 : 0,
  }));

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={30} color="#3a3733" />
            <span className="text-sm font-bold text-slate-900">UMD GROUP</span>
          </Link>
          <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[11px] font-semibold">ADMIN</span>
          <div className="flex-1" />
          <AuthButtons />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <AdminTabs
          apps={apps}
          users={usersWithCount}
          reviews={reviews}
          payments={payments}
          requests={requests}
          pricing={pricing}
          payment={payment}
        />
      </main>
    </div>
  );
}
