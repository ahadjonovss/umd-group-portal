"use client";

import { useState, type ReactNode } from "react";
import { AdminAppListItem } from "@/components/admin/AdminAppListItem";
import { AdminReviewRow } from "@/components/admin/AdminReviewRow";
import { AdminUserListItem } from "@/components/admin/AdminUserListItem";
import { PricingModule } from "@/components/admin/PricingModule";
import { CardSettings } from "@/components/admin/CardSettings";
import { AdminPaymentRow } from "@/components/admin/AdminPaymentRow";
import type { AppView } from "@/lib/firestore/apps";
import type { AdminReview } from "@/lib/firestore/reviews";
import type { AdminUser } from "@/lib/firestore/users";
import type { PaymentView } from "@/lib/firestore/payments";
import type { Pricing, PaymentInfo } from "@/lib/firestore/settings";
import type { ServiceType } from "@/types";

type TabKey = "users" | "requests" | "live" | "payments" | "reviews" | "settings";
type SubKey = "transfer" | "store";

const TRANSFER: ServiceType[] = ["google-transfer", "apple-transfer"];
const isTransfer = (s: ServiceType) => TRANSFER.includes(s);

const ICONS: Record<TabKey, ReactNode> = {
  users: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a3 3 0 10-2.5-4.5" />
  ),
  requests: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  ),
  live: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
  ),
  payments: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  ),
  reviews: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.98 9.771c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  ),
  settings: (
    <>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </>
  ),
};

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-slate-400 py-10 text-center">{text}</p>;
}

function List({ apps }: { apps: AppView[] }) {
  if (!apps.length) return <Empty text="Hech narsa yo'q." />;
  return (
    <div className="flex flex-col gap-3">
      {apps.map((a) => <AdminAppListItem key={a.id} app={a} />)}
    </div>
  );
}

export function AdminTabs({
  apps,
  users,
  reviews,
  payments,
  pricing,
  payment,
}: {
  apps: AppView[];
  users: AdminUser[];
  reviews: AdminReview[];
  payments: PaymentView[];
  pricing: Pricing;
  payment: PaymentInfo;
}) {
  const [tab, setTab] = useState<TabKey>("requests");
  const [sub, setSub] = useState<SubKey>("store");

  const pending = reviews.filter((r) => !r.approved).length;
  const pendingPayments = payments.filter((p) => p.status === "pending").length;

  const transferReqs = apps.filter((a) => isTransfer(a.serviceType));
  const storeReqs = apps.filter((a) => !isTransfer(a.serviceType) && a.status !== "published");
  const liveApps = apps.filter((a) => !isTransfer(a.serviceType) && a.status === "published");

  const tabs: { key: TabKey; label: string; count: number; badge?: number }[] = [
    { key: "users", label: "Userlar", count: users.length },
    { key: "requests", label: "Arizalar", count: transferReqs.length + storeReqs.length },
    { key: "live", label: "Ilovalar", count: liveApps.length },
    { key: "payments", label: "To'lovlar", count: payments.length, badge: pendingPayments },
    { key: "reviews", label: "Reviewlar", count: reviews.length, badge: pending },
    { key: "settings", label: "Sozlamalar", count: 0 },
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-6">
      {/* Chap sidebar */}
      <nav className="sm:w-56 flex-shrink-0">
        <div className="flex sm:flex-col gap-1 overflow-x-auto sm:sticky sm:top-20">
          {tabs.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                  active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <svg className={`w-[18px] h-[18px] flex-shrink-0 ${active ? "text-blue-600" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {ICONS[t.key]}
                </svg>
                <span className="flex-1 text-left">{t.label}</span>
                {t.badge ? (
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {t.badge}
                  </span>
                ) : t.key !== "settings" ? (
                  <span className={`text-xs ${active ? "text-blue-400" : "text-slate-400"}`}>{t.count}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Kontent */}
      <div className="flex-1 min-w-0">
        {tab === "users" &&
          (users.length ? (
            <div className="flex flex-col gap-3">
              {users.map((u) => <AdminUserListItem key={u.uid} user={u} />)}
            </div>
          ) : (
            <Empty text="Foydalanuvchilar yo'q." />
          ))}

        {tab === "requests" && (
          <div>
            <div className="inline-flex rounded-xl bg-slate-100 p-1 mb-4">
              {([
                { key: "store" as SubKey, label: `Store (${storeReqs.length})` },
                { key: "transfer" as SubKey, label: `Transfer (${transferReqs.length})` },
              ]).map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSub(s.key)}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    sub === s.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <List apps={sub === "store" ? storeReqs : transferReqs} />
          </div>
        )}

        {tab === "live" && <List apps={liveApps} />}

        {tab === "payments" &&
          (payments.length ? (
            <div className="flex flex-col gap-3">
              {payments.map((pm) => <AdminPaymentRow key={pm.id} payment={pm} />)}
            </div>
          ) : (
            <Empty text="To'lovlar yo'q." />
          ))}

        {tab === "reviews" &&
          (reviews.length ? (
            <div className="grid lg:grid-cols-2 gap-3">
              {reviews.map((r) => <AdminReviewRow key={r.id} review={r} />)}
            </div>
          ) : (
            <Empty text="Sharhlar yo'q." />
          ))}

        {tab === "settings" && (
          <div className="flex flex-col gap-5">
            <PricingModule pricing={pricing} />
            <CardSettings payment={payment} />
          </div>
        )}
      </div>
    </div>
  );
}
