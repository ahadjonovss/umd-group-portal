import Link from "next/link";
import { Suspense } from "react";
import { ServiceCard } from "@/components/ServiceCard";
import { Logo } from "@/components/Logo";
import { ReviewsSection } from "@/components/ReviewsSection";
import { AuthButtons } from "@/components/auth/AuthButtons";
import { getApprovedReviews } from "@/lib/firestore/reviews";

// Reviewlar Firestore'dan (admin tasdiqlagani) request vaqtida o'qiladi.
export const dynamic = "force-dynamic";

async function getReviews() {
  try {
    return await getApprovedReviews();
  } catch {
    return [];
  }
}

export default async function Home() {
  const reviews = await getReviews();
  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center gap-3">
          <Logo size={34} color="#3a3733" className="animate-scale-in" />
          <div className="animate-fade-in">
            <p className="text-sm font-bold text-slate-900 leading-tight">UMD GROUP</p>
            <p className="text-[10px] text-slate-500 leading-tight">Mijoz portali</p>
          </div>

          <div className="flex-1" />

          <nav className="flex items-center gap-1">
            <Link
              href="/xizmat-narxlari"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden sm:inline">Xizmat narxlari</span>
            </Link>
            <Link
              href="/foydalanish-shartlari"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="hidden sm:inline">Foydalanish shartlari</span>
            </Link>
            <span className="w-px h-5 bg-slate-200 mx-1" />
            <AuthButtons showLogout={false} />
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12 animate-slide-up">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full mb-4 ring-1 ring-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Onlayn ariza tizimi
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3 tracking-tight">
            Xizmat turini{" "}
            <span className="text-gradient">tanlang</span>
          </h1>
          <p className="text-slate-500 max-w-md mx-auto text-sm leading-relaxed">
            Kerakli xizmatni tanlang va formani to&apos;ldiring. Barcha ma&apos;lumotlar
            avtomatik ravishda jamoamizga yuboriladi.
          </p>
        </div>

        {/* Service cards */}
        <div className="grid gap-3 sm:grid-cols-2 mb-12">
          <ServiceCard
            title="Play Market — Joylashtirish"
            description="Android ilovangizni Google Play Market-ga chiqarish uchun kerakli ma'lumot va fayllarni yuboring"
            href="/submit/play-market"
            badge="5 qadam"
            badgeColor="green"
            delay={0}
            icon={
              <svg className="w-5 h-5 text-emerald-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.18 23.76c.3.17.64.24.99.2l.1-.04 11.35-6.55-2.47-2.47-9.97 8.86zM.13 1.55C.05 1.8 0 2.06 0 2.35v19.3c0 .29.05.56.13.8l.07.07 10.82-10.82v-.26L.2 1.48l-.07.07zM19.82 9.65l-2.56-1.48-2.78 2.78 2.78 2.78 2.58-1.49c.74-.43.74-1.13-.02-1.59zm-16.64 14.1l.1-.06 12.06-6.96-2.47-2.47-9.69 9.49z"/>
              </svg>
            }
          />
          <ServiceCard
            title="App Store — Joylashtirish"
            description="iOS ilovangizni Apple App Store-ga chiqarish uchun sertifikatlar va materiallarni yuboring"
            href="/submit/app-store"
            badge="5 qadam"
            badgeColor="blue"
            delay={75}
            icon={
              <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
            }
          />
          <ServiceCard
            title="Google Play — App Transfer"
            description="Google Play developer akkauntingizdan ilovani bizning akkauntga o'tkazish"
            href="/submit/google-transfer"
            badge="1 qadam"
            badgeColor="orange"
            delay={150}
            icon={
              <svg className="w-5 h-5 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.18 23.76c.3.17.64.24.99.2l.1-.04 11.35-6.55-2.47-2.47-9.97 8.86zM.13 1.55C.05 1.8 0 2.06 0 2.35v19.3c0 .29.05.56.13.8l.07.07 10.82-10.82v-.26L.2 1.48l-.07.07zM19.82 9.65l-2.56-1.48-2.78 2.78 2.78 2.78 2.58-1.49c.74-.43.74-1.13-.02-1.59zm-16.64 14.1l.1-.06 12.06-6.96-2.47-2.47-9.69 9.49z"/>
              </svg>
            }
          />
          <ServiceCard
            title="Apple App Store — App Transfer"
            description="App Store Connect akkauntingizdan ilovani bizning akkauntga o'tkazish"
            href="/submit/apple-transfer"
            badge="1 qadam"
            badgeColor="purple"
            delay={225}
            icon={
              <svg className="w-5 h-5 text-purple-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
            }
          />
          <ServiceCard
            title="Developer akkaunt ochish"
            description="Google Play yoki App Store uchun rasmiy developer akkaunt ochib beramiz (shaxsiy yoki korporativ)"
            href="/submit/account"
            badge="Yangi"
            badgeColor="teal"
            delay={300}
            icon={
              <svg className="w-5 h-5 text-teal-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
          />
        </div>

        {/* Reviews */}
        <Suspense fallback={null}>
          <ReviewsSection initialReviews={reviews} />
        </Suspense>
      </main>

      <footer className="text-center py-6 text-xs text-slate-400 border-t border-slate-200/60 mt-4">
        © {new Date().getFullYear()} UMD GROUP. Barcha huquqlar himoyalangan.
      </footer>
    </div>
  );
}
