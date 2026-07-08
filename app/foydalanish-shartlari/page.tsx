import Link from "next/link";
import { Logo } from "@/components/Logo";
import type { Metadata } from "next";
import { getPricing } from "@/lib/firestore/settings";
import { TermsTabs } from "@/components/TermsTabs";

export const metadata: Metadata = { title: "Foydalanish shartlari — UMD GROUP" };
export const dynamic = "force-dynamic";

export default async function FoydalanishShartlariPage() {
  const p = await getPricing();
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium group">
            <span className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center transition-colors">
              <svg className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </span>
            Orqaga
          </Link>
          <div className="flex-1" />
          <Logo size={28} color="#3a3733" />
          <span className="text-sm font-bold text-slate-900 hidden sm:block">UMD GROUP</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-6 animate-slide-down">
          <h1 className="text-2xl font-bold text-slate-900">Foydalanish shartlari</h1>
          <p className="text-sm text-slate-500 mt-1">UMD GROUP xizmatlaridan foydalanish qoidalari</p>
        </div>

        {/* Diqqat banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 animate-slide-up">
          <div className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0">⚠️</span>
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-1">Diqqat</p>
              <p>
                2026-yildan boshlab <strong>UMD GROUP rasmiy faoliyat yuritishni boshlaganligi</strong> sababli,
                barcha to&apos;lovlar <strong>P2P (shaxsiy karta orqali) emas</strong>, balki{" "}
                <strong>maxsus to&apos;lov havolasi</strong> orqali (to&apos;lov ilovalari yordamida) amalga oshiriladi.
                Har bir to&apos;lov bo&apos;yicha mijozga <strong>Soliq idorasidan elektron chek</strong> taqdim etiladi.
              </p>
            </div>
          </div>
        </div>

        <div className="animate-slide-up">
          <TermsTabs pricing={p} />
        </div>

        {/* Contact */}
        <div className="mt-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 animate-slide-up flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-slate-900 text-sm">Savollaringiz bormi?</p>
            <p className="text-xs text-slate-500 mt-0.5">Shartlar bo&apos;yicha qo&apos;shimcha ma&apos;lumot olish uchun murojaat qiling</p>
          </div>
          <a
            href="https://t.me/umdgroupadmin"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 flex items-center gap-2 h-9 px-4 bg-[#2AABEE] text-white text-sm font-medium rounded-xl hover:bg-[#1a9bde] transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 13.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.496.969z"/>
            </svg>
            Telegram orqali yozing
          </a>
        </div>

        <p className="text-xs text-slate-400 text-center mt-6">
          Oxirgi yangilanish: Yanvar 2026 · UMD GROUP
        </p>
      </main>
    </div>
  );
}
