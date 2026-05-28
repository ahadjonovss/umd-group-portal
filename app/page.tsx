import { ServiceCard } from "@/components/ServiceCard";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-5 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">UMD GROUP</h1>
            <p className="text-xs text-gray-500">Mijoz portali</p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Xizmat turini tanlang</h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Kerakli xizmatni tanlang va formani to&apos;ldiring. Barcha ma&apos;lumotlar avtomatik ravishda
            bizning jamoamizga yuboriladi.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <ServiceCard
            title="Play Market — Joylashtirish"
            description="Android ilovangizni Google Play Market-ga chiqarish uchun kerakli ma'lumot va fayllarni yuboring"
            href="/submit/play-market"
            badge="5 qadam"
            badgeColor="green"
            icon={
              <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
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
            icon={
              <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
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
            icon={
              <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
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
            icon={
              <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
            }
          />
        </div>

        {/* Info section */}
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          <div className="text-center p-4">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 text-sm">Xavfsiz</h3>
            <p className="text-xs text-gray-500 mt-1">Ma&apos;lumotlaringiz shifrlangan holda uzatiladi</p>
          </div>
          <div className="text-center p-4">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 text-sm">Tez</h3>
            <p className="text-xs text-gray-500 mt-1">Forma to&apos;ldirilgach darhol jamoamizga yetkaziladi</p>
          </div>
          <div className="text-center p-4">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 text-sm">Qulay</h3>
            <p className="text-xs text-gray-500 mt-1">Ro&apos;yxatdan o&apos;tish shart emas</p>
          </div>
        </div>
      </main>

      <footer className="text-center py-6 text-xs text-gray-400 border-t border-gray-200 mt-8">
        © {new Date().getFullYear()} UMD GROUP. Barcha huquqlar himoyalangan.
      </footer>
    </div>
  );
}
