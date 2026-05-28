import { ServiceCard } from "@/components/ServiceCard";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-primary flex items-center justify-center shadow-sm shadow-blue-200 animate-scale-in">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div className="animate-fade-in">
            <p className="text-sm font-bold text-slate-900 leading-tight">UMD GROUP</p>
            <p className="text-[10px] text-slate-500 leading-tight">Mijoz portali</p>
          </div>
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
        </div>

        {/* Features */}
        <div className="grid sm:grid-cols-3 gap-4 animate-slide-up delay-300">
          {[
            { icon: "🔒", title: "Xavfsiz", desc: "Ma'lumotlaringiz shifrlangan holda uzatiladi", color: "bg-emerald-50" },
            { icon: "⚡", title: "Tez", desc: "Forma to'ldirilgach darhol jamoamizga yetkaziladi", color: "bg-blue-50" },
            { icon: "✅", title: "Qulay", desc: "Ro'yxatdan o'tish shart emas", color: "bg-purple-50" },
          ].map((f, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200/80 p-4 text-center hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className={`w-10 h-10 ${f.color} rounded-xl flex items-center justify-center mx-auto mb-3 text-lg`}>
                {f.icon}
              </div>
              <p className="font-semibold text-slate-900 text-sm mb-1">{f.title}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="text-center py-6 text-xs text-slate-400 border-t border-slate-200/60 mt-4">
        © {new Date().getFullYear()} UMD GROUP. Barcha huquqlar himoyalangan.
      </footer>
    </div>
  );
}
