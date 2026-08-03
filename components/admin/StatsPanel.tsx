"use client";

import { useMemo } from "react";
import type { AppView } from "@/lib/firestore/apps";
import type { AdminUser } from "@/lib/firestore/users";
import type { PaymentView } from "@/lib/firestore/payments";
import type { RequestView } from "@/lib/firestore/requests";
import type { AdminReview } from "@/lib/firestore/reviews";
import type { DiscountView } from "@/lib/firestore/discounts";
import type { Pricing } from "@/lib/firestore/settings";
import { SERVICE_LABELS, STATUS_META, platformOf } from "@/lib/labels";
import { REQUEST_TYPE_LABEL, isRequestActive } from "@/lib/request-status";
import { advanceUsdApp, finalUsdApp, renewalUsd } from "@/lib/payment";
import { getInstallment } from "@/lib/payment-state";
import { isTerminalError } from "@/lib/app-status";
import type { ServiceType } from "@/types";

const UZ_MONTHS = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"];
const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
const uzs = (n: number) => Math.round(n).toLocaleString("en-US") + " so'm";
const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);

// ── UI bo'laklari ─────────────────────────────
function Kpi({ label, value, sub, accent = "text-slate-900" }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${accent}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
      <h3 className="font-semibold text-slate-900 text-sm mb-4 flex items-center gap-2">
        <span>{icon}</span> {title}
      </h3>
      {children}
    </div>
  );
}

function Progress({ value, total, label, hint, color = "bg-blue-500" }: { value: number; total: number; label: string; hint?: string; color?: string }) {
  const p = pct(value, total);
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-slate-600">{label}</span>
        <span className="font-semibold text-slate-800">{value} / {total} · {p}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${p}%` }} />
      </div>
      {hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

type Seg = { label: string; value: number; color: string };
function Dist({ segs }: { segs: Seg[] }) {
  const total = segs.reduce((s, x) => s + x.value, 0);
  if (!total) return <p className="text-sm text-slate-400">Ma&apos;lumot yo&apos;q.</p>;
  return (
    <div className="flex flex-col gap-2.5">
      {segs.filter((s) => s.value > 0).sort((a, b) => b.value - a.value).map((s) => (
        <div key={s.label}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-600">{s.label}</span>
            <span className="font-semibold text-slate-800">{s.value} · {pct(s.value, total)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div className={`h-full rounded-full ${s.color}`} style={{ width: `${pct(s.value, total)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Bars({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-1.5 h-32">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
          <div className="w-full flex items-end justify-center h-24">
            <div
              className="w-full max-w-[28px] rounded-t bg-gradient-to-t from-blue-500 to-blue-400 group-hover:from-blue-600 transition-all relative"
              style={{ height: `${Math.max(2, (d.value / max) * 100)}%` }}
            >
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-slate-500 opacity-0 group-hover:opacity-100 whitespace-nowrap">
                {d.value}
              </span>
            </div>
          </div>
          <span className="text-[10px] text-slate-400">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function Ranks({ items }: { items: { name: string; sub?: string; value: string }[] }) {
  if (!items.length) return <p className="text-sm text-slate-400">Ma&apos;lumot yo&apos;q.</p>;
  return (
    <div className="flex flex-col gap-2">
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-slate-200 text-slate-600" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-400"}`}>{i + 1}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-800 truncate">{it.name}</p>
            {it.sub && <p className="text-[11px] text-slate-400 truncate">{it.sub}</p>}
          </div>
          <span className="text-sm font-semibold text-slate-900 flex-shrink-0">{it.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Asosiy panel ─────────────────────────────
export function StatsPanel({
  apps,
  users,
  payments,
  requests,
  reviews,
  discounts,
  pricing,
}: {
  apps: AppView[];
  users: AdminUser[];
  payments: PaymentView[];
  requests: RequestView[];
  reviews: AdminReview[];
  discounts: DiscountView[];
  pricing?: Pricing;
}) {
  const s = useMemo(() => {
    const now = new Date();
    const curMonth = monthKey(now);
    const prevMonth = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const curYear = String(now.getFullYear());
    const nowMs = now.getTime();

    const confirmed = payments.filter((p) => p.status === "confirmed");
    const sum = (arr: PaymentView[]) => arr.reduce((a, p) => a + p.amountUsd, 0);

    // ── Moliya ──
    const revenueAll = sum(confirmed);
    const revenueMonth = sum(confirmed.filter((p) => (p.createdAt ?? "").slice(0, 7) === curMonth));
    const revenueYear = sum(confirmed.filter((p) => (p.createdAt ?? "").slice(0, 4) === curYear));
    const avgCheck = confirmed.length ? revenueAll / confirmed.length : 0;

    // ── Kutilayotgan daromad ──
    let owedUsd = 0, renewalDueUsd = 0;
    if (pricing) {
      const OPEN = new Set(["due", "rejected", "submitted"]);
      for (const a of apps) {
        if (!isTerminalError(a.status) && a.status !== "transferred" && a.status !== "subscription_ended") {
          const adv = getInstallment(a.payment, "advance");
          const fin = getInstallment(a.payment, "final");
          if (adv && OPEN.has(adv.state)) owedUsd += Math.round(advanceUsdApp(a, pricing));
          if (fin && OPEN.has(fin.state)) owedUsd += Math.round(finalUsdApp(a, pricing));
        }
        if (a.status === "published" && a.subscription?.active && a.subscription.endDate?.slice(0, 7) === curMonth) {
          renewalDueUsd += Math.round(renewalUsd(a, pricing));
        }
      }
    }

    // ── Foydalanuvchilar ──
    const totalUsers = users.length;
    const tgLinked = users.filter((u) => u.telegramChats.length > 0).length;
    const tgNotify = users.filter((u) => u.telegramChats.length > 0 && u.telegramNotify).length;
    const activeUsers = users.filter((u) => (u.appCount ?? 0) > 0).length;
    const newUsersMonth = users.filter((u) => (u.createdAt ?? "").slice(0, 7) === curMonth).length;
    const newUsersPrev = users.filter((u) => (u.createdAt ?? "").slice(0, 7) === prevMonth).length;
    const walletTotal = users.reduce((a, u) => a + (u.walletUzs || 0), 0);
    const walletUsers = users.filter((u) => (u.walletUzs || 0) > 0).length;

    // Userlar o'sishi (12 oy)
    const userMonths = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      return { key: monthKey(d), label: UZ_MONTHS[d.getMonth()], value: 0 };
    });
    const umIdx = new Map(userMonths.map((m, i) => [m.key, i]));
    for (const u of users) {
      const i = umIdx.get((u.createdAt ?? "").slice(0, 7));
      if (i !== undefined) userMonths[i].value++;
    }

    // Top userlar (to'lov summasi bo'yicha)
    const payByUser = new Map<string, { name: string; sub: string; usd: number }>();
    for (const p of confirmed) {
      const e = payByUser.get(p.ownerUid) ?? { name: p.ownerName || "Noma'lum", sub: p.ownerPhone || "", usd: 0 };
      e.usd += p.amountUsd;
      payByUser.set(p.ownerUid, e);
    }
    const topUsersPay = [...payByUser.values()].sort((a, b) => b.usd - a.usd).slice(0, 5)
      .map((e) => ({ name: e.name, sub: e.sub, value: usd(e.usd) }));
    const topUsersApps = [...users].sort((a, b) => (b.appCount ?? 0) - (a.appCount ?? 0)).slice(0, 5)
      .filter((u) => (u.appCount ?? 0) > 0)
      .map((u) => ({ name: u.fullName || u.email || "—", sub: u.phone || undefined, value: `${u.appCount} ariza` }));

    // ── Ilovalar ──
    const totalApps = apps.length;
    const byStatus: Record<string, number> = {};
    const byService: Record<string, number> = {};
    let iosCount = 0, androidCount = 0;
    for (const a of apps) {
      byStatus[a.status] = (byStatus[a.status] ?? 0) + 1;
      byService[a.serviceType] = (byService[a.serviceType] ?? 0) + 1;
      if (platformOf(a.serviceType) === "ios") iosCount++; else androidCount++;
    }
    const publishedCount = apps.filter((a) => a.status === "published").length;
    const transferredCount = apps.filter((a) => a.status === "transferred").length;
    const conversion = pct(publishedCount + transferredCount, totalApps);

    const appMonths = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      return { key: monthKey(d), label: UZ_MONTHS[d.getMonth()], value: 0 };
    });
    const amIdx = new Map(appMonths.map((m, i) => [m.key, i]));
    for (const a of apps) {
      const i = amIdx.get((a.createdAt ?? "").slice(0, 7));
      if (i !== undefined) appMonths[i].value++;
    }

    // ── Obunalar ──
    const activeSubs = apps.filter((a) => a.subscription?.active && a.status === "published");
    const subsEndingMonth = activeSubs.filter((a) => a.subscription!.endDate?.slice(0, 7) === curMonth).length;
    const subsOverdue = activeSubs.filter((a) => {
      const e = a.subscription!.endDate ? new Date(a.subscription!.endDate).getTime() : 0;
      return e && e < nowMs;
    }).length;
    const totalRenewals = apps.reduce((a, x) => a + (x.subscription?.renewedCount ?? 0), 0);
    const renewalRevenue = sum(confirmed.filter((p) => p.kind === "renewal"));

    // ── So'rovlar ──
    const reqByType: Record<string, number> = {};
    for (const r of requests) reqByType[r.type] = (reqByType[r.type] ?? 0) + 1;
    const reqActive = requests.filter((r) => isRequestActive(r.status)).length;
    const reqDone = requests.filter((r) => r.status === "completed").length;
    const reqRejected = requests.filter((r) => r.status === "rejected" || r.status === "cancelled").length;

    // ── Update paketlari ──
    const pkgPayments = confirmed.filter((p) => p.kind === "update_package");
    const pkgSoldCount = pkgPayments.length;
    const pkgRevenue = sum(pkgPayments);
    const activePkgs = apps.filter((a) => a.updatePackage?.active);
    const pkgUsageAvg = activePkgs.length
      ? Math.round((activePkgs.reduce((s2, a) => s2 + (a.updatePackage!.quota ? a.updatePackage!.used / a.updatePackage!.quota : 0), 0) / activePkgs.length) * 100)
      : 0;

    // ── Sharhlar ──
    const totalReviews = reviews.length;
    const approvedReviews = reviews.filter((r) => r.approved).length;
    const avgRating = totalReviews ? reviews.reduce((a, r) => a + (r.rating || 0), 0) / totalReviews : 0;

    // ── Chegirmalar ──
    const discIssued = discounts.length;
    const discActive = discounts.filter((d) => d.status === "active").length;
    const discUsed = discounts.filter((d) => d.status === "used").length;
    const discExpired = discounts.filter((d) => d.status === "expired").length;

    // ── Kirim turi / xizmat ──
    const byKind: Record<string, number> = {};
    const revByService: Record<string, number> = {};
    for (const p of confirmed) {
      byKind[p.kind] = (byKind[p.kind] ?? 0) + p.amountUsd;
      revByService[p.serviceType] = (revByService[p.serviceType] ?? 0) + p.amountUsd;
    }

    return {
      revenueAll, revenueMonth, revenueYear, avgCheck, owedUsd, renewalDueUsd, expectedTotal: owedUsd + renewalDueUsd,
      totalUsers, tgLinked, tgNotify, activeUsers, newUsersMonth, newUsersPrev, walletTotal, walletUsers,
      userMonths, topUsersPay, topUsersApps,
      totalApps, byStatus, byService, iosCount, androidCount, publishedCount, transferredCount, conversion, appMonths,
      activeSubsCount: activeSubs.length, subsEndingMonth, subsOverdue, totalRenewals, renewalRevenue,
      reqByType, reqActive, reqDone, reqRejected,
      pkgSoldCount, pkgRevenue, activePkgsCount: activePkgs.length, pkgUsageAvg,
      totalReviews, approvedReviews, avgRating,
      discIssued, discActive, discUsed, discExpired,
      byKind, revByService,
    };
  }, [apps, users, payments, requests, reviews, discounts, pricing]);

  const SVC_COLORS: Record<string, string> = {
    "play-market": "bg-emerald-500", "app-store": "bg-blue-500", "google-transfer": "bg-orange-500",
    "apple-transfer": "bg-purple-500", account: "bg-rose-500",
  };
  const statusSegs: Seg[] = Object.entries(s.byStatus).map(([k, v]) => ({ label: STATUS_META[k as keyof typeof STATUS_META]?.label ?? k, value: v, color: "bg-slate-400" }));
  const serviceSegs: Seg[] = Object.entries(s.byService).map(([k, v]) => ({ label: SERVICE_LABELS[k as ServiceType] ?? k, value: v, color: SVC_COLORS[k] ?? "bg-slate-400" }));
  const kindLabels: Record<string, string> = { advance: "Avans", final: "Yakuniy", full: "To'liq", transfer: "Transfer", update: "Update", renewal: "Uzaytirish", push_certificate: "Push sertifikat", update_package: "Update paketi" };
  const kindSegs: Seg[] = Object.entries(s.byKind).map(([k, v]) => ({ label: kindLabels[k] ?? k, value: Math.round(v), color: "bg-indigo-500" }));
  const reqSegs: Seg[] = Object.entries(s.reqByType).map(([k, v]) => ({ label: REQUEST_TYPE_LABEL[k as keyof typeof REQUEST_TYPE_LABEL] ?? k, value: v, color: "bg-teal-500" }));

  return (
    <div className="flex flex-col gap-4">
      {/* Umumiy KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Umumiy daromad" value={usd(s.revenueAll)} sub={`Bu oy: ${usd(s.revenueMonth)}`} accent="text-emerald-600" />
        <Kpi label="Kutilayotgan daromad" value={usd(s.expectedTotal)} sub={`Qarz: ${usd(s.owedUsd)} · Uzaytirish: ${usd(s.renewalDueUsd)}`} accent="text-amber-600" />
        <Kpi label="Foydalanuvchilar" value={String(s.totalUsers)} sub={`Bu oy +${s.newUsersMonth}`} />
        <Kpi label="Ilovalar" value={String(s.totalApps)} sub={`Chiqarilgan: ${s.publishedCount}`} />
      </div>

      {/* Foydalanuvchilar */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Section title="Foydalanuvchilar" icon="👥">
          <div className="flex flex-col gap-3">
            <Progress value={s.tgLinked} total={s.totalUsers} label="Telegram ulaganlar" color="bg-sky-500" hint={`Xabarnoma yoqilgan: ${s.tgNotify}`} />
            <Progress value={s.activeUsers} total={s.totalUsers} label="Faol (ariza bergan)" color="bg-emerald-500" />
            <div className="grid grid-cols-3 gap-2 mt-1 text-center">
              <div className="rounded-xl bg-slate-50 p-2.5"><p className="text-lg font-bold text-slate-900">{s.newUsersMonth}</p><p className="text-[11px] text-slate-400">Bu oy</p></div>
              <div className="rounded-xl bg-slate-50 p-2.5"><p className="text-lg font-bold text-slate-900">{s.newUsersPrev}</p><p className="text-[11px] text-slate-400">O&apos;tgan oy</p></div>
              <div className="rounded-xl bg-slate-50 p-2.5"><p className="text-lg font-bold text-slate-900">{s.walletUsers}</p><p className="text-[11px] text-slate-400">Hamyonli</p></div>
            </div>
            <p className="text-xs text-slate-400">Hamyondagi umumiy balans: <span className="font-semibold text-slate-700">{uzs(s.walletTotal)}</span></p>
          </div>
        </Section>
        <Section title="Foydalanuvchilar o'sishi (12 oy)" icon="📈">
          <Bars data={s.userMonths} />
        </Section>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Section title="Eng ko'p to'laganlar" icon="🏆"><Ranks items={s.topUsersPay} /></Section>
        <Section title="Eng ko'p ariza berganlar" icon="📝"><Ranks items={s.topUsersApps} /></Section>
      </div>

      {/* Ilovalar */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Section title="Ilovalar — status bo'yicha" icon="📱"><Dist segs={statusSegs} /></Section>
        <Section title="Ilovalar — xizmat turi" icon="🧩"><Dist segs={serviceSegs} /></Section>
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Section title="Yangi arizalar (12 oy)" icon="📊"><Bars data={s.appMonths} /></Section>
        <Section title="Ilovalar — umumiy" icon="✅">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-xl font-bold text-emerald-600">{s.publishedCount}</p><p className="text-[11px] text-slate-400">Chiqarilgan</p></div>
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-xl font-bold text-violet-600">{s.transferredCount}</p><p className="text-[11px] text-slate-400">Transfer</p></div>
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-xl font-bold text-slate-900">{s.conversion}%</p><p className="text-[11px] text-slate-400">Konversiya</p></div>
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-xl font-bold text-slate-900">{s.iosCount}/{s.androidCount}</p><p className="text-[11px] text-slate-400">iOS / Android</p></div>
          </div>
        </Section>
      </div>

      {/* Obunalar + Paketlar */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Section title="Obunalar" icon="🔄">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-xl font-bold text-emerald-600">{s.activeSubsCount}</p><p className="text-[11px] text-slate-400">Faol obuna</p></div>
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-xl font-bold text-amber-600">{s.subsEndingMonth}</p><p className="text-[11px] text-slate-400">Bu oy tugaydi</p></div>
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-xl font-bold text-red-600">{s.subsOverdue}</p><p className="text-[11px] text-slate-400">Kechikkan</p></div>
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-xl font-bold text-slate-900">{s.totalRenewals}</p><p className="text-[11px] text-slate-400">Uzaytirishlar</p></div>
          </div>
          <p className="text-xs text-slate-400 mt-3">Uzaytirish daromadi: <span className="font-semibold text-slate-700">{usd(s.renewalRevenue)}</span></p>
        </Section>
        <Section title="Update paketlari" icon="📦">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-xl font-bold text-slate-900">{s.pkgSoldCount}</p><p className="text-[11px] text-slate-400">Sotilgan</p></div>
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-xl font-bold text-emerald-600">{usd(s.pkgRevenue)}</p><p className="text-[11px] text-slate-400">Daromad</p></div>
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-xl font-bold text-cyan-600">{s.activePkgsCount}</p><p className="text-[11px] text-slate-400">Faol</p></div>
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-xl font-bold text-slate-900">{s.pkgUsageAvg}%</p><p className="text-[11px] text-slate-400">O&apos;rtacha ishlatilish</p></div>
          </div>
        </Section>
      </div>

      {/* Moliya + So'rovlar */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Section title="Daromad — kirim turi bo'yicha" icon="💰"><Dist segs={kindSegs} /></Section>
        <Section title="So'rovlar" icon="🛠">
          <div className="grid grid-cols-3 gap-2 text-center mb-4">
            <div className="rounded-xl bg-slate-50 p-2.5"><p className="text-lg font-bold text-amber-600">{s.reqActive}</p><p className="text-[11px] text-slate-400">Faol</p></div>
            <div className="rounded-xl bg-slate-50 p-2.5"><p className="text-lg font-bold text-emerald-600">{s.reqDone}</p><p className="text-[11px] text-slate-400">Yakunlangan</p></div>
            <div className="rounded-xl bg-slate-50 p-2.5"><p className="text-lg font-bold text-red-600">{s.reqRejected}</p><p className="text-[11px] text-slate-400">Rad/bekor</p></div>
          </div>
          <Dist segs={reqSegs} />
        </Section>
      </div>

      {/* Sharhlar + Chegirmalar + Telegram */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Section title="Sharhlar" icon="⭐">
          <p className="text-3xl font-bold text-slate-900">{s.avgRating.toFixed(1)} <span className="text-lg text-amber-400">★</span></p>
          <p className="text-xs text-slate-400 mt-1">{s.totalReviews} sharh · {s.approvedReviews} tasdiqlangan</p>
        </Section>
        <Section title="Chegirmalar" icon="🎁">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-slate-50 p-2.5"><p className="text-lg font-bold text-slate-900">{s.discIssued}</p><p className="text-[11px] text-slate-400">Berilgan</p></div>
            <div className="rounded-xl bg-slate-50 p-2.5"><p className="text-lg font-bold text-emerald-600">{s.discActive}</p><p className="text-[11px] text-slate-400">Faol</p></div>
            <div className="rounded-xl bg-slate-50 p-2.5"><p className="text-lg font-bold text-blue-600">{s.discUsed}</p><p className="text-[11px] text-slate-400">Ishlatilgan</p></div>
            <div className="rounded-xl bg-slate-50 p-2.5"><p className="text-lg font-bold text-slate-400">{s.discExpired}</p><p className="text-[11px] text-slate-400">Muddati o&apos;tgan</p></div>
          </div>
        </Section>
        <Section title="Telegram bot" icon="📨">
          <div className="flex flex-col gap-3">
            <Progress value={s.tgLinked} total={s.totalUsers} label="Ulanganlar" color="bg-sky-500" />
            <p className="text-xs text-slate-400">Xabarnoma yoqilgan: <span className="font-semibold text-slate-700">{s.tgNotify}</span> · o&apos;chirilgan: <span className="font-semibold text-slate-700">{s.tgLinked - s.tgNotify}</span></p>
          </div>
        </Section>
      </div>
    </div>
  );
}
