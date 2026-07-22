"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AppView } from "@/lib/firestore/apps";
import { getStatusFlow, isPreWork, type AppStatus } from "@/lib/app-status";
import { STATUS_META, SERVICE_LABELS, accountLabel, formatDate } from "@/lib/labels";
import { SERVICE_THEME, ServiceLogo } from "@/components/serviceTheme";
import { RENEWAL_FACTOR } from "@/lib/payment";
import { actSetStatus, actPublish, actMarkTransferred, actEndSubscription, actRenewSubscription, actDeleteApp } from "@/app/admin/actions";

const SITE_URL = "https://umdgroup.uz";
const IS_DEV = process.env.NODE_ENV === "development";

function storeName(serviceType: AppView["serviceType"]): string {
  return serviceType === "app-store" || serviceType === "apple-transfer" ? "App Store" : "Play Market";
}

export function AdminAppRow({ app }: { app: AppView }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const theme = SERVICE_THEME[app.serviceType];
  const status = STATUS_META[app.status];
  const title = app.appName || SERVICE_LABELS[app.serviceType];

  const [date, setDate] = useState("");
  const [url, setUrl] = useState(app.publication.storeUrl ?? "");
  const [copied, setCopied] = useState(false);
  const [reviewCopied, setReviewCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [renewOpen, setRenewOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
    setRenewOpen(false);
  }

  async function copyReviewLink() {
    try {
      await navigator.clipboard.writeText(`${SITE_URL}/review/${app.id}`);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // jim
    }
  }

  async function copyPaymentMessage() {
    const name = app.contact?.fullName || "mijoz";
    const link = `${SITE_URL}/panel/app/${app.id}`;
    const msg =
      `Hurmatli ${name}, quyidagi havola orqali to'lovni amalga oshiring va ilovangiz keyingi bosqichga o'tadi:\n\n${link}`;
    try {
      await navigator.clipboard.writeText(msg);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard bloklangan bo'lsa — jim
    }
  }

  async function copyReviewMessage() {
    const name = app.contact?.fullName || "mijoz";
    const link = `${SITE_URL}/review/${app.id}`;
    const store = storeName(app.serviceType);
    const pubDate = formatDate(app.publication.publishedAt);
    const endDate = app.subscription?.endDate ? formatDate(app.subscription.endDate) : null;
    const discount = Math.round((1 - RENEWAL_FACTOR) * 100);
    const msg =
      `Assalomu alaykum, ${name}! Sizning "${title}" ilovangiz ${pubDate} sanasida ${store}ga muvaffaqiyatli chiqarildi. ` +
      `Iltimos, xizmatimizni quyidagi havola orqali baholang:\n${link}` +
      (endDate
        ? `\n\nEslatib o'tamiz: ilova ${endDate} gacha store'da turishi kafolatlanadi. ` +
          `Muddatni istalgan vaqt platformamiz orqali ${discount}% chegirma bilan uzaytirishingiz mumkin.`
        : "");
    try {
      await navigator.clipboard.writeText(msg);
      setReviewCopied(true);
      setTimeout(() => setReviewCopied(false), 2000);
    } catch {
      // jim
    }
  }

  // Faqat keyingi status ko'rsatiladi (barcha statuslar ishlatiladi).
  const flow = getStatusFlow(app.serviceType);
  const idx = flow.indexOf(app.status);
  const nextStatus: AppStatus | null = idx >= 0 && idx < flow.length - 1 ? flow[idx + 1] : null;
  const nextMeta = nextStatus ? STATUS_META[nextStatus] : null;
  const inProgress = !["published", "completed", "rejected", "cancelled", "transferred", "subscription_ended"].includes(app.status);
  const nextIsPublish = nextStatus === "published";

  // Avans chek yuborilgan va hali ish bosqichiga o'tmagan bo'lsa — to'lov tasdiqlanishini
  // kutmoqda. Bu holatda "keyingi status" tugmasi emas, "tasdiqlang" ogohlantirishi chiqadi.
  const preWork = isPreWork(app.serviceType, app.status);
  const awaitingPaymentConfirm = app.receiptSent && preWork;
  const showPaymentNote = awaitingPaymentConfirm;

  return (
    <div className="group relative overflow-hidden bg-white rounded-2xl border border-slate-200/80 shadow-sm shadow-slate-200/40">
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${theme.accent}`} />

      <div className="p-4 pl-5 flex gap-4">
        <ServiceLogo serviceType={app.serviceType} iconUrl={app.iconUrl} appName={app.appName} />

        <div className="flex-1 min-w-0 flex flex-col gap-3">
          {/* Sarlavha + joriy status */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 truncate">{title}</p>
              <p className={`text-xs font-medium truncate ${theme.text}`}>
                {SERVICE_LABELS[app.serviceType]}
                {app.serviceType === "account" && app.accountPlatform ? ` · ${accountLabel(app.accountPlatform, app.accountType)}` : ""}
              </p>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {app.ownerEmail || "—"}
                {app.contact ? ` · ${app.contact.fullName} · ${app.contact.phone}` : ""}
              </p>
              {app.taxPhone && (
                <p className="text-xs text-teal-600 truncate mt-0.5">📇 Soliq cheki tel: {app.taxPhone}</p>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ${status.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                {status.label}
              </span>

              {/* 3 nuqta menyu — chiqarilgan ilova amallari */}
              {app.status === "published" && (
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen((o) => !o)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    title="Amallar"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 5a2 2 0 110-4 2 2 0 010 4zm0 9a2 2 0 110-4 2 2 0 010 4zm0 9a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                  {menuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={closeMenu} />
                      <div className="absolute right-0 top-full mt-1 z-20 w-64 rounded-xl border border-slate-200 bg-white shadow-lg py-1">
                        {/* Obunani uzaytirish — bosilгач variantlar ochiladi */}
                        <button
                          onClick={() => setRenewOpen((o) => !o)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <svg className="w-4 h-4 text-teal-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Obunani uzaytirish (+9 oy)
                          <svg className={`w-3.5 h-3.5 ml-auto text-slate-400 transition-transform ${renewOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {renewOpen && (
                          <div className="bg-slate-50/70">
                            <button
                              disabled={pending}
                              onClick={() => {
                                closeMenu();
                                if (confirm("Obuna TUGAGAN kundan boshlab 9 oy (270 kun) qo'shilsinmi?"))
                                  start(() => actRenewSubscription(app.id, "end"));
                              }}
                              className="w-full flex items-center gap-2 pl-9 pr-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                            >
                              Tugagan kundan
                            </button>
                            <button
                              disabled={pending}
                              onClick={() => {
                                closeMenu();
                                if (confirm("BUGUNDAN boshlab 9 oy (270 kun) qo'shilsinmi?"))
                                  start(() => actRenewSubscription(app.id, "today"));
                              }}
                              className="w-full flex items-center gap-2 pl-9 pr-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                            >
                              Bugundan
                            </button>
                          </div>
                        )}
                        <div className="my-1 border-t border-slate-100" />
                        <button
                          disabled={pending}
                          onClick={() => {
                            closeMenu();
                            if (confirm("Ilovani 'transfer qilingan' deb belgilaysizmi? Obuna to'xtaydi."))
                              start(() => actMarkTransferred(app.id));
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          <svg className="w-4 h-4 text-violet-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Transfer qilingan deb belgilash
                        </button>
                        <button
                          disabled={pending}
                          onClick={() => {
                            closeMenu();
                            if (confirm("Obunani to'xtatasizmi? Ilova store'dan olib tashlangan hisoblanadi."))
                              start(() => actEndSubscription(app.id));
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                        >
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                          Obuna to&apos;xtatildi
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Keyingi status: chiqarish bosqichi bo'lsa — sana+url forma, aks holda tugma */}
          {nextStatus && nextMeta && nextIsPublish && (
            <div className="flex flex-col gap-2 rounded-xl bg-emerald-50/60 ring-1 ring-emerald-100 p-3">
              <p className="text-xs font-medium text-emerald-700">Store&apos;ga chiqarish (obuna 9 oy boshlanadi)</p>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-9 rounded-lg border border-slate-200 px-2 text-sm"
                />
                <input
                  type="url"
                  placeholder="Store havolasi (ixtiyoriy)"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1 min-w-40 h-9 rounded-lg border border-slate-200 px-2 text-sm"
                />
                <button
                  disabled={pending}
                  onClick={() => start(() => actPublish(app.id, date, url))}
                  className="h-9 px-3 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
                >
                  Chiqarildi →
                </button>
              </div>
            </div>
          )}

          {/* To'lov kutilmoqda — keyingi bosqichga faqat to'lov tasdiqlangach o'tiladi */}
          {showPaymentNote && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-50 ring-1 ring-amber-200 p-2.5 text-xs text-amber-700">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {awaitingPaymentConfirm
                ? "To'lov yuborilgan — Keyingi bosqichga o'tish uchun To'lovlar bo'limidan tasdiqlang."
                : "To'lov kutilmoqda. To'lov tasdiqlangach keyingi bosqichga o'tiladi."}
            </div>
          )}

          {/* Keyingi status tugmasi (oddiy) + terminal amallar */}
          {((nextStatus && !nextIsPublish && !showPaymentNote) || inProgress) && (
            <div className="flex flex-wrap items-center gap-2">
              {nextStatus && nextMeta && !nextIsPublish && !showPaymentNote && (
                <button
                  disabled={pending}
                  onClick={() => start(() => actSetStatus(app.id, nextStatus))}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white ${nextMeta.dot} hover:opacity-90 disabled:opacity-50 transition-all`}
                >
                  {nextMeta.label} ga o&apos;tkazish →
                </button>
              )}
              {inProgress && (
                <>
                  <button
                    disabled={pending}
                    onClick={() => start(() => actSetStatus(app.id, "rejected"))}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
                  >
                    Rad etish
                  </button>
                  <button
                    disabled={pending}
                    onClick={() => start(() => actSetStatus(app.id, "cancelled"))}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:opacity-50"
                  >
                    Bekor qilish
                  </button>
                </>
              )}
            </div>
          )}

          {/* Obuna ma'lumoti (uzaytirish user so'rovi orqali) */}
          {app.subscription?.startDate && (
            <div className="rounded-xl bg-slate-50 ring-1 ring-slate-100 p-3">
              <span className="text-xs text-slate-600">
                Obuna: {formatDate(app.subscription.startDate)} → {formatDate(app.subscription.endDate)}
                {app.subscription.renewedCount > 0 && ` · ${app.subscription.renewedCount}× uzaytirilgan`}
              </span>
            </div>
          )}


          <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100">
            <p className="text-[11px] text-slate-400">
              Yuborilgan: {formatDate(app.createdAt)} · {app.telegramSent ? "Telegram ✓" : "Telegram ✗"}
            </p>
            <div className="flex items-center gap-3 flex-shrink-0">
              {preWork && !app.receiptSent && (
                <button
                  onClick={copyPaymentMessage}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                >
                  {copied ? "✓ Nusxalandi" : "Xabar nusxalash"}
                </button>
              )}
              {app.status === "published" && (
                <button
                  onClick={copyReviewMessage}
                  className="text-xs font-medium text-amber-600 hover:text-amber-700 hover:underline"
                >
                  {reviewCopied ? "✓ Nusxalandi" : "Review uchun so'rov xabarini ko'chirish"}
                </button>
              )}
              <button
                onClick={copyReviewLink}
                className="text-xs font-medium text-slate-500 hover:text-slate-700 hover:underline"
              >
                {linkCopied ? "✓ Nusxalandi" : "Review havolasi"}
              </button>
            {IS_DEV && (
              <button
                disabled={pending}
                onClick={() => {
                  if (confirm("Bu arizani va unga bog'liq to'lov/sharhlarni butunlay o'chirasizmi?"))
                    start(async () => { await actDeleteApp(app.id); router.push("/admin"); });
                }}
                className="text-xs font-medium text-red-600 hover:text-red-700 hover:underline disabled:opacity-50 flex-shrink-0"
              >
                O&apos;chirish
              </button>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
