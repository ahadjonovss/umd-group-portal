"use client";

import { useState, useEffect, type ReactNode } from "react";
import { AdminAppListItem } from "@/components/admin/AdminAppListItem";
import { AdminReviewRow } from "@/components/admin/AdminReviewRow";
import { AdminUserListItem } from "@/components/admin/AdminUserListItem";
import { PricingModule } from "@/components/admin/PricingModule";
import { CardSettings } from "@/components/admin/CardSettings";
import { AdminPaymentRow } from "@/components/admin/AdminPaymentRow";
import { AdminRequestRow } from "@/components/admin/AdminRequestRow";
import { FinancePanel } from "@/components/admin/FinancePanel";
import type { AppView } from "@/lib/firestore/apps";
import type { AdminReview } from "@/lib/firestore/reviews";
import type { AdminUser } from "@/lib/firestore/users";
import type { PaymentView } from "@/lib/firestore/payments";
import type { RequestView } from "@/lib/firestore/requests";
import { isRequestActive, REQUEST_TYPE_LABEL } from "@/lib/request-status";
import { STATUS_META, SERVICE_LABELS } from "@/lib/labels";
import type { Pricing, PaymentInfo } from "@/lib/firestore/settings";
import type { AppStatus } from "@/lib/app-status";

// Arizalar = ilova arizalari (apps). So'rovlar = transfer/update/uzaytirish (requests).
type TabKey = "users" | "apps" | "live" | "payments" | "finance" | "requests" | "reviews" | "settings";

const TAB_KEYS: TabKey[] = ["users", "apps", "live", "payments", "finance", "requests", "reviews", "settings"];
const TAB_STORAGE_KEY = "admin.activeTab";

const ICONS: Record<TabKey, ReactNode> = {
  users: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a3 3 0 10-2.5-4.5" />
  ),
  apps: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  ),
  live: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
  ),
  payments: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  ),
  finance: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  ),
  requests: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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
  if (!apps.length) return <Empty text="Topilmadi." />;
  return (
    <div className="flex flex-col gap-3">
      {apps.map((a) => <AdminAppListItem key={a.id} app={a} />)}
    </div>
  );
}

const REQ_STATUS_LABELS: Record<string, string> = {
  requested: "So'rov yuborildi",
  review: "Ko'rib chiqilmoqda",
  payment_pending: "To'lov kutilmoqda",
  in_progress: "Jarayonda",
  completed: "Yakunlandi",
  rejected: "Rad etildi",
  cancelled: "Bekor qilindi",
};

const inc = (hay: string, q: string) => hay.toLowerCase().includes(q.trim().toLowerCase());

interface FilterDef {
  value: string;
  onChange: (v: string) => void;
  allLabel: string;
  options: { value: string; label: string }[];
}

function Toolbar({
  query,
  setQuery,
  placeholder,
  filters,
}: {
  query: string;
  setQuery: (v: string) => void;
  placeholder: string;
  filters?: FilterDef[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <div className="relative flex-1 min-w-[180px]">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
        />
      </div>
      {filters?.map((f, i) => (
        <select
          key={i}
          value={f.value}
          onChange={(e) => f.onChange(e.target.value)}
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
        >
          <option value="">{f.allLabel}</option>
          {f.options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ))}
    </div>
  );
}

// Ro'yxatda mavjud statuslardan filter variantlarini quramiz
function appStatusOptions(list: AppView[]): { value: string; label: string }[] {
  const seen = Array.from(new Set(list.map((a) => a.status)));
  return seen.map((s) => ({ value: s, label: STATUS_META[s as AppStatus]?.label ?? s }));
}

export function AdminTabs({
  apps,
  users,
  reviews,
  payments,
  requests,
  pricing,
  payment,
}: {
  apps: AppView[];
  users: AdminUser[];
  reviews: AdminReview[];
  payments: PaymentView[];
  requests: RequestView[];
  pricing: Pricing;
  payment: PaymentInfo;
}) {
  const [tab, setTab] = useState<TabKey>("apps");

  // Tanlangan tabni saqlaymiz — kartochkaga o'tib qaytganda o'sha tab ochiladi
  useEffect(() => {
    const saved = sessionStorage.getItem(TAB_STORAGE_KEY);
    if (saved && TAB_KEYS.includes(saved as TabKey)) setTab(saved as TabKey);
  }, []);

  const selectTab = (k: TabKey) => {
    setTab(k);
    sessionStorage.setItem(TAB_STORAGE_KEY, k);
  };

  const pending = reviews.filter((r) => !r.approved).length;
  const pendingPayments = payments.filter((p) => p.status === "pending").length;
  const activeRequests = requests.filter((r) => isRequestActive(r.status)).length;

  // Jarayondagi arizalar vs chiqarilgan/transfer qilingan ilovalar
  const isLive = (a: AppView) => a.status === "published" || a.status === "transferred";
  const arizaApps = apps.filter((a) => !isLive(a));
  const liveApps = apps.filter(isLive);

  // Qidiruv / filter holatlari (har bir tab uchun alohida)
  const [userQ, setUserQ] = useState("");
  const [appQ, setAppQ] = useState("");
  const [appStatus, setAppStatus] = useState("");
  const [liveQ, setLiveQ] = useState("");
  const [liveStatus, setLiveStatus] = useState("");
  const [payQ, setPayQ] = useState("");
  const [payStatus, setPayStatus] = useState("");
  const [reqQ, setReqQ] = useState("");
  const [reqStatus, setReqStatus] = useState("");
  const [reqType, setReqType] = useState("");
  const [revQ, setRevQ] = useState("");
  const [revStatus, setRevStatus] = useState("");

  const appText = (a: AppView) =>
    `${a.appName ?? ""} ${a.contact?.fullName ?? ""} ${a.contact?.phone ?? ""} ${SERVICE_LABELS[a.serviceType]}`;

  const fUsers = users.filter((u) => !userQ || inc(`${u.fullName} ${u.email ?? ""} ${u.phone} ${u.telegram}`, userQ));
  const fAriza = arizaApps.filter((a) => (!appStatus || a.status === appStatus) && (!appQ || inc(appText(a), appQ)));
  const fLive = liveApps.filter((a) => (!liveStatus || a.status === liveStatus) && (!liveQ || inc(appText(a), liveQ)));
  const fPay = payments.filter(
    (p) => (!payStatus || p.status === payStatus) && (!payQ || inc(`${p.appName ?? ""} ${p.ownerName} ${p.ownerPhone}`, payQ))
  );
  const fReq = requests.filter(
    (r) =>
      (!reqStatus || r.status === reqStatus) &&
      (!reqType || r.type === reqType) &&
      (!reqQ || inc(`${r.appName ?? ""} ${r.ownerName} ${r.ownerPhone}`, reqQ))
  );
  const fRev = reviews.filter(
    (r) =>
      (!revStatus || (revStatus === "approved" ? r.approved : !r.approved)) &&
      (!revQ || inc(`${r.name} ${r.comment} ${r.appName ?? ""}`, revQ))
  );

  const reqStatusOptions = Array.from(new Set(requests.map((r) => r.status))).map((s) => ({
    value: s,
    label: REQ_STATUS_LABELS[s] ?? s,
  }));

  const tabs: { key: TabKey; label: string; count: number; badge?: number }[] = [
    { key: "apps", label: "Arizalar", count: arizaApps.length },
    { key: "requests", label: "So'rovlar", count: requests.length, badge: activeRequests },
    { key: "payments", label: "To'lovlar", count: payments.length, badge: pendingPayments },
    { key: "reviews", label: "Reviewlar", count: reviews.length, badge: pending },
    { key: "live", label: "Ilovalar", count: liveApps.length },
    { key: "finance", label: "Moliya", count: 0 },
    { key: "users", label: "Userlar", count: users.length },
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
                onClick={() => selectTab(t.key)}
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
                ) : t.key !== "settings" && t.key !== "finance" ? (
                  <span className={`text-xs ${active ? "text-blue-400" : "text-slate-400"}`}>{t.count}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Kontent */}
      <div className="flex-1 min-w-0">
        {tab === "users" && (
          <>
            <Toolbar query={userQ} setQuery={setUserQ} placeholder="Ism, email, telefon bo'yicha qidirish…" />
            {fUsers.length ? (
              <div className="flex flex-col gap-3">
                {fUsers.map((u) => <AdminUserListItem key={u.uid} user={u} />)}
              </div>
            ) : (
              <Empty text="Topilmadi." />
            )}
          </>
        )}

        {tab === "apps" && (
          <>
            <Toolbar
              query={appQ}
              setQuery={setAppQ}
              placeholder="Ilova nomi yoki mijoz bo'yicha qidirish…"
              filters={[{ value: appStatus, onChange: setAppStatus, allLabel: "Barcha statuslar", options: appStatusOptions(arizaApps) }]}
            />
            <List apps={fAriza} />
          </>
        )}

        {tab === "live" && (
          <>
            <Toolbar
              query={liveQ}
              setQuery={setLiveQ}
              placeholder="Ilova nomi yoki mijoz bo'yicha qidirish…"
              filters={[{ value: liveStatus, onChange: setLiveStatus, allLabel: "Barcha statuslar", options: appStatusOptions(liveApps) }]}
            />
            <List apps={fLive} />
          </>
        )}

        {tab === "payments" && (
          <>
            <Toolbar
              query={payQ}
              setQuery={setPayQ}
              placeholder="Ilova nomi yoki mijoz bo'yicha qidirish…"
              filters={[{
                value: payStatus,
                onChange: setPayStatus,
                allLabel: "Barcha statuslar",
                options: [{ value: "pending", label: "Kutilmoqda" }, { value: "confirmed", label: "Tasdiqlangan" }],
              }]}
            />
            {fPay.length ? (
              <div className="flex flex-col gap-3">
                {fPay.map((pm) => <AdminPaymentRow key={pm.id} payment={pm} />)}
              </div>
            ) : (
              <Empty text="Topilmadi." />
            )}
          </>
        )}

        {tab === "finance" && <FinancePanel payments={payments} />}

        {tab === "requests" && (
          <>
            <Toolbar
              query={reqQ}
              setQuery={setReqQ}
              placeholder="Ilova nomi yoki mijoz bo'yicha qidirish…"
              filters={[
                { value: reqType, onChange: setReqType, allLabel: "Barcha turlar", options: (["transfer", "update", "subscription_renewal"] as const).map((t) => ({ value: t, label: REQUEST_TYPE_LABEL[t] })) },
                { value: reqStatus, onChange: setReqStatus, allLabel: "Barcha statuslar", options: reqStatusOptions },
              ]}
            />
            {fReq.length ? (
              <div className="flex flex-col gap-3">
                {fReq.map((r) => <AdminRequestRow key={r.id} request={r} />)}
              </div>
            ) : (
              <Empty text="Topilmadi." />
            )}
          </>
        )}

        {tab === "reviews" && (
          <>
            <Toolbar
              query={revQ}
              setQuery={setRevQ}
              placeholder="Ism, izoh yoki ilova bo'yicha qidirish…"
              filters={[{
                value: revStatus,
                onChange: setRevStatus,
                allLabel: "Barchasi",
                options: [{ value: "approved", label: "Tasdiqlangan" }, { value: "pending", label: "Kutilmoqda" }],
              }]}
            />
            {fRev.length ? (
              <div className="grid lg:grid-cols-2 gap-3">
                {fRev.map((r) => <AdminReviewRow key={r.id} review={r} />)}
              </div>
            ) : (
              <Empty text="Topilmadi." />
            )}
          </>
        )}

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
