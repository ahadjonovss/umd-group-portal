import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/Logo";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Ariza Qabul Qilindi — UMD GROUP" };

const serviceNames: Record<string, string> = {
  "play-market":      "Play Market Joylashtirish",
  "app-store":        "App Store Joylashtirish",
  "google-transfer":  "Google Play Transfer",
  "apple-transfer":   "Apple App Store Transfer",
};

function SuccessContent({ service }: { service: string | null }) {
  const serviceName = service ? (serviceNames[service] ?? service) : "Xizmat";

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center px-4">
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
          <p className="text-slate-400 text-xs mb-8">Jamoamiz tez orada siz bilan bog&apos;lanadi.</p>

          {/* Steps */}
          <div className="bg-slate-50 rounded-2xl p-4 mb-6 text-left space-y-3">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">Keyingi qadamlar</p>
            {[
              "Jamoamiz arizangizni ko'rib chiqadi (1-2 ish kuni)",
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

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 h-11 px-6 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-sm shadow-blue-200 hover:shadow-md hover:shadow-blue-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
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

async function SuccessPageContent({ searchParams }: { searchParams: Promise<{ service?: string }> }) {
  const params = await searchParams;
  return <SuccessContent service={params.service || null} />;
}

export default function SuccessPage({ searchParams }: { searchParams: Promise<{ service?: string }> }) {
  return (
    <Suspense fallback={<SuccessContent service={null} />}>
      <SuccessPageContent searchParams={searchParams} />
    </Suspense>
  );
}
