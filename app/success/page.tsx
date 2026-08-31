import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/Logo";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/dal";
import { getAppDetail } from "@/lib/firestore/apps";
import { getPricing } from "@/lib/firestore/settings";
import { getUsdRate } from "@/lib/cbu";
import { advanceUsdApp } from "@/lib/payment";
import { getActiveDiscount } from "@/lib/firestore/discounts";
import { categoryForServiceType, applyDiscount } from "@/lib/discount";

export const metadata: Metadata = { title: "Ariza Qabul Qilindi — UMD GROUP" };
export const dynamic = "force-dynamic";

const serviceNames: Record<string, string> = {
  "play-market":      "Play Market Joylashtirish",
  "app-store":        "App Store Joylashtirish",
  "google-transfer":  "Google Play Transfer",
  "apple-transfer":   "Apple App Store Transfer",
  "duns":             "DUNS Raqami Ochish",
};

interface PaymentDue {
  appId: string;
  usd: number;
  uzs: number | null;
}

function SuccessContent({ service, payment }: { service: string | null; payment: PaymentDue | null }) {
  const serviceName = service ? (serviceNames[service] ?? service) : "Xizmat";

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">

        {/* Confetti dots (decorative) */}
        <div className="relative mb-6 flex justify-center">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full opacity-70 animate-float"
              style={{
                background: ["#3b82f6","#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6"][i],
                left: `${10 + i * 14}%`,
                top: `${-20 + (i % 2) * 10}px`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50 p-8 text-center animate-bounce-in">
          {/* Icon */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-2xl bg-emerald-100 animate-ping opacity-30" />
            <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200 animate-success">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">Ariza qabul qilindi!</h1>
          <p className="text-slate-500 text-sm mb-1">
            <span className="font-semibold text-slate-700">{serviceName}</span> bo&apos;yicha
            arizangiz muvaffaqiyatli yuborildi.
          </p>
          <p className="text-slate-400 text-xs mb-6">Jamoamiz tez orada siz bilan bog&apos;lanadi.</p>

          {/* To'lov — katta va diqqatni tortadigan */}
          {payment && (
            <div className="mb-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 p-5 text-left shadow-lg shadow-slate-900/20 animate-slide-up">
              <p className="text-xs text-slate-300 mb-1">Davom etish uchun to&apos;lov kerak</p>
              <p className="text-4xl font-bold text-white tracking-tight">
                {payment.uzs ? `${payment.uzs.toLocaleString("en-US")} so'm` : `$${payment.usd}`}
              </p>
              {payment.uzs && <p className="text-sm text-slate-300 mt-0.5">≈ ${payment.usd}</p>}
              <Link
                href={`/panel/app/${payment.appId}`}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 h-12 bg-white text-slate-900 text-sm font-bold rounded-xl hover:bg-slate-100 active:scale-95 transition-all shadow-sm"
              >
                To&apos;lovga o&apos;tish
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          )}

          {/* Steps */}
          <div className="bg-slate-50 rounded-2xl p-4 mb-6 text-left space-y-3">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">Keyingi qadamlar</p>
            {[
              payment ? "To'lovni amalga oshiring va chekni yuklang" : "Jamoamiz arizangizni ko'rib chiqadi (1-2 ish kuni)",
              "Email yoki telefon orqali siz bilan bog'lanamiz",
              "Ilovangiz joylashtirilishi haqida xabar beramiz",
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 shadow-sm shadow-blue-200">
                  {i + 1}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>

          {service === "play-market" && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800 text-center">
              <span className="font-semibold">.aab</span> faylni Telegram orqali yuboring:
              <a
                href="https://t.me/umdgroupadmin"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center justify-center gap-2 h-10 bg-[#2AABEE] text-white text-sm font-medium rounded-xl hover:bg-[#1a9bde] active:scale-95 transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 13.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.496.969z"/>
                </svg>
                Telegram
              </a>
            </div>
          )}

          <Link
            href="/"
            className={
              payment
                ? "inline-flex items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                : "inline-flex items-center justify-center gap-2 h-11 px-6 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-sm shadow-blue-200"
            }
          >
            {!payment && (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            )}
            Bosh sahifaga qaytish
          </Link>
        </div>

        <div className="flex items-center justify-center gap-2 mt-5">
          <Logo size={18} color="#94a3b8" />
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} UMD GROUP</p>
        </div>
      </div>
    </div>
  );
}

async function getPaymentDue(appId: string): Promise<PaymentDue | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const detail = await getAppDetail(appId);
  if (!detail || detail.app.ownerUid !== user.uid) return null;
  const app = detail.app;

  const [pricing, rate] = await Promise.all([getPricing(), getUsdRate()]);
  const category = categoryForServiceType(app.serviceType);
  const discount = category ? await getActiveDiscount(user.uid, category, appId) : null;
  const pct = discount?.percent ?? 0;
  const usd = Math.round(applyDiscount(advanceUsdApp(app, pricing), pct));
  if (usd <= 0) return null;
  const uzs = rate ? Math.round(usd * rate) : null;
  return { appId, usd, uzs };
}

async function SuccessPageContent({ searchParams }: { searchParams: Promise<{ service?: string; appId?: string }> }) {
  const params = await searchParams;
  const payment = params.appId ? await getPaymentDue(params.appId) : null;
  return <SuccessContent service={params.service || null} payment={payment} />;
}

export default function SuccessPage({ searchParams }: { searchParams: Promise<{ service?: string; appId?: string }> }) {
  return (
    <Suspense fallback={<SuccessContent service={null} payment={null} />}>
      <SuccessPageContent searchParams={searchParams} />
    </Suspense>
  );
}
