"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AdminAppListItem } from "@/components/admin/AdminAppListItem";
import { AdminPaymentRow } from "@/components/admin/AdminPaymentRow";
import { AdminReviewRow } from "@/components/admin/AdminReviewRow";
import { actSetUserRole, actSetUserPassword, actSetUserEmail, actDeleteUser } from "@/app/admin/actions";
import { formatDate } from "@/lib/labels";
import type { AdminUser } from "@/lib/firestore/users";
import type { AppView } from "@/lib/firestore/apps";
import type { PaymentView } from "@/lib/firestore/payments";
import type { AdminReview } from "@/lib/firestore/reviews";

type TabKey = "info" | "apps" | "payments" | "reviews";

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-slate-400 py-8 text-center">{text}</p>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm text-slate-900 text-right break-all">{value || "—"}</span>
    </div>
  );
}

function CredentialsEditor({ uid, currentEmail }: { uid: string; currentEmail: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(currentEmail);
  const [pw, setPw] = useState("");
  const [pending, start] = useTransition();
  const [emailMsg, setEmailMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
      <h3 className="font-semibold text-slate-900 text-sm mb-3">Login ma&apos;lumotlari</h3>

      {/* Email */}
      <label className="text-xs text-slate-500">Email (login)</label>
      <div className="flex flex-wrap items-center gap-2 mt-1 mb-1">
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setEmailMsg(null); }}
          placeholder="email@example.com"
          className="flex-1 min-w-48 h-10 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
        />
        <button
          disabled={pending || !email.trim() || email.trim() === currentEmail}
          onClick={() =>
            start(async () => {
              const r = await actSetUserEmail(uid, email);
              setEmailMsg(r.ok ? { ok: true, text: "Email yangilandi" } : { ok: false, text: r.error || "Xatolik" });
              if (r.ok) router.refresh();
            })
          }
          className="h-10 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          Email yangilash
        </button>
      </div>
      {emailMsg && <p className={`text-xs mb-3 ${emailMsg.ok ? "text-emerald-600" : "text-red-600"}`}>{emailMsg.ok ? "✓ " : "❌ "}{emailMsg.text}</p>}

      {/* Parol */}
      <label className="text-xs text-slate-500 mt-2 block">Yangi parol</label>
      <div className="flex flex-wrap items-center gap-2 mt-1">
        <input
          value={pw}
          onChange={(e) => { setPw(e.target.value); setPwMsg(null); }}
          placeholder="Yangi parol (kamida 6 belgi)"
          className="flex-1 min-w-48 h-10 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
        />
        <button
          disabled={pending || pw.length < 6}
          onClick={() =>
            start(async () => {
              const r = await actSetUserPassword(uid, pw);
              setPwMsg(r.ok ? { ok: true, text: "Parol yangilandi" } : { ok: false, text: r.error || "Xatolik" });
              if (r.ok) setPw("");
            })
          }
          className="h-10 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          Parol yangilash
        </button>
      </div>
      {pwMsg && <p className={`text-xs mt-2 ${pwMsg.ok ? "text-emerald-600" : "text-red-600"}`}>{pwMsg.ok ? "✓ " : "❌ "}{pwMsg.text}</p>}
    </div>
  );
}

export function AdminUserDetail({
  user,
  apps,
  payments,
  reviews,
}: {
  user: AdminUser;
  apps: AppView[];
  payments: PaymentView[];
  reviews: AdminReview[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("info");
  const [pending, start] = useTransition();
  const isAdmin = user.role === "admin";

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: "info", label: "Ma'lumot" },
    { key: "apps", label: "Ilovalar", count: apps.length },
    { key: "payments", label: "To'lovlar", count: payments.length },
    { key: "reviews", label: "Reviewlar", count: reviews.length },
  ];

  return (
    <div>
      <div className="flex flex-wrap gap-1 border-b border-slate-200 mb-5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
              tab === t.key ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.label}
            {typeof t.count === "number" && <span className="text-xs text-slate-400">{t.count}</span>}
          </button>
        ))}
      </div>

      {tab === "info" && (
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
            <InfoRow label="To'liq ism" value={user.fullName} />
            <InfoRow label="Email (login)" value={user.email || ""} />
            <InfoRow label="Telefon" value={user.phone} />
            <InfoRow label="Telegram" value={user.telegram} />
            <InfoRow label="Rol" value={isAdmin ? "Admin" : "Mijoz"} />
            <InfoRow label="Ro'yxatdan o'tgan" value={formatDate(user.createdAt)} />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-900 text-sm">Admin huquqi</p>
              <p className="text-xs text-slate-400">{isAdmin ? "Bu user admin" : "Oddiy mijoz"}</p>
            </div>
            <button
              disabled={pending}
              onClick={() => start(() => actSetUserRole(user.uid, !isAdmin))}
              className={`h-9 px-3 rounded-lg text-xs font-semibold disabled:opacity-50 ${
                isAdmin ? "bg-slate-100 text-slate-600 hover:bg-slate-200" : "bg-slate-900 text-white hover:bg-slate-800"
              }`}
            >
              {isAdmin ? "Adminlikni olish" : "Admin qilish"}
            </button>
          </div>

          <CredentialsEditor uid={user.uid} currentEmail={user.email || ""} />

          {/* Xavfli zona */}
          <div className="bg-white rounded-2xl border border-red-200 p-5">
            <h3 className="font-semibold text-red-700 text-sm mb-1">Xavfli zona</h3>
            <p className="text-xs text-slate-400 mb-3">
              Foydalanuvchi va uning barcha ilovalari, to&apos;lovlari, sharhlari butunlay o&apos;chiriladi. Qaytarib bo&apos;lmaydi.
            </p>
            <button
              disabled={pending}
              onClick={() => {
                if (confirm(`"${user.fullName || user.email}" va uning BARCHA ma'lumotlarini o'chirasizmi? Bu amalni qaytarib bo'lmaydi.`))
                  start(async () => { await actDeleteUser(user.uid); router.push("/admin"); });
              }}
              className="h-9 px-4 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
            >
              Foydalanuvchini o&apos;chirish
            </button>
          </div>
        </div>
      )}

      {tab === "apps" &&
        (apps.length ? (
          <div className="flex flex-col gap-3">{apps.map((a) => <AdminAppListItem key={a.id} app={a} />)}</div>
        ) : (
          <Empty text="Ilova yo'q." />
        ))}

      {tab === "payments" &&
        (payments.length ? (
          <div className="flex flex-col gap-3">{payments.map((p) => <AdminPaymentRow key={p.id} payment={p} />)}</div>
        ) : (
          <Empty text="To'lov yo'q." />
        ))}

      {tab === "reviews" &&
        (reviews.length ? (
          <div className="grid lg:grid-cols-2 gap-3">{reviews.map((r) => <AdminReviewRow key={r.id} review={r} />)}</div>
        ) : (
          <Empty text="Sharh yo'q." />
        ))}
    </div>
  );
}
