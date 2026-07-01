import Link from "next/link";
import { Logo } from "@/components/Logo";
import type { Metadata } from "next";
import { getPricing } from "@/lib/firestore/settings";

export const metadata: Metadata = { title: "Xizmat narxlari — UMD GROUP" };
export const dynamic = "force-dynamic";

interface PriceCardProps {
  platform: string;
  icon: React.ReactNode;
  price: string;
  color: string;
  features: string[];
}

function PriceCard({ platform, icon, price, color, features }: PriceCardProps) {
  return (
    <div className={`bg-white rounded-2xl border ${color} p-5 flex flex-col gap-4`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-semibold text-slate-900">{platform}</span>
        </div>
        <span className="text-2xl font-bold text-slate-900">{price}</span>
      </div>
      <ul className="space-y-1.5">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
            <svg className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function XizmatNarxlariPage() {
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

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-5">
        <div className="animate-slide-down">
          <h1 className="text-2xl font-bold text-slate-900">Xizmat narxlari</h1>
          <p className="text-sm text-slate-500 mt-1">UMD GROUP taklif etadigan xizmatlar va narxlar</p>
        </div>

        {/* 1. Chiqarish narxlari */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 animate-slide-up space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-7 h-7 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center">1</span>
            <h2 className="font-semibold text-slate-900">Ilovani Store-ga chiqarish</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <PriceCard
              platform="App Store (iOS)"
              icon={
                <svg className="w-5 h-5 text-slate-800" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
              }
              price={`$${p.appStorePublish}`}
              color="border-slate-200"
              features={[
                "9 oylik kafolat muddati",
                `To'lov: ${p.publishAdvance}% oldindan, ${100 - p.publishAdvance}% chiqarilgandan keyin`,
                "9 oy tugasa chegirmali yangilash imkoni",
              ]}
            />
            <PriceCard
              platform="Google Play (Android)"
              icon={
                <svg className="w-5 h-5 text-emerald-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.18 23.76c.3.17.64.24.99.2l.1-.04 11.35-6.55-2.47-2.47-9.97 8.86zM.13 1.55C.05 1.8 0 2.06 0 2.35v19.3c0 .29.05.56.13.8l.07.07 10.82-10.82v-.26L.2 1.48l-.07.07zM19.82 9.65l-2.56-1.48-2.78 2.78 2.78 2.78 2.58-1.49c.74-.43.74-1.13-.02-1.59zm-16.64 14.1l.1-.06 12.06-6.96-2.47-2.47-9.69 9.49z"/>
                </svg>
              }
              price={`$${p.playMarketPublish}`}
              color="border-slate-200"
              features={[
                "9 oylik kafolat muddati",
                `To'lov: ${p.publishAdvance}% oldindan, ${100 - p.publishAdvance}% chiqarilgandan keyin`,
                "9 oy tugasa chegirmali yangilash imkoni",
              ]}
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
            270 kunlik muddat ilova store&apos;ga rasmiy chiqqan kundan boshlab hisoblanadi.
            Muddat tugagach obunani <strong>50% chegirma</strong> bilan uzaytirish mumkin.
          </div>
        </div>

        {/* 2 & 3. Update narxlari */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 animate-slide-up space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-7 h-7 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center">2</span>
            <h2 className="font-semibold text-slate-900">Yangilanish (Update) chiqarish</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
              <p className="text-xs text-slate-500 mb-1">Android (har bir update)</p>
              <p className="text-2xl font-bold text-slate-900">${p.updateAndroid}</p>
            </div>
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
              <p className="text-xs text-slate-500 mb-1">iOS (har bir update)</p>
              <p className="text-2xl font-bold text-slate-900">${p.updateIos}</p>
            </div>
          </div>
          <p className="text-xs text-slate-500">⚠️ Update chiqarish ilovaning store&apos;da turish muddatini uzaytirmaydi.</p>

          <div className="border-t border-slate-100 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-7 h-7 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center">3</span>
              <h2 className="font-semibold text-slate-900">Oylik update paketlari</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                <p className="text-xs text-slate-500 mb-1">Android — oyiga 5 tagacha</p>
                <p className="text-2xl font-bold text-slate-900">$10 <span className="text-sm font-normal text-slate-500">/ oy</span></p>
              </div>
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                <p className="text-xs text-slate-500 mb-1">iOS — oyiga 5 tagacha</p>
                <p className="text-2xl font-bold text-slate-900">$15 <span className="text-sm font-normal text-slate-500">/ oy</span></p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">5 tadan oshgan yangilanishlar oddiy narxlarda davom etadi.</p>
          </div>
        </div>

        {/* 4. Transfer */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 animate-slide-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center">4</span>
              <div>
                <h2 className="font-semibold text-slate-900">Ilovani transfer qilish</h2>
                <p className="text-xs text-slate-500">Google Play va App Store uchun</p>
              </div>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 mt-3 ml-10">
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-3">
              <p className="text-xs text-slate-500 mb-0.5">Google Play</p>
              <p className="text-xl font-bold text-slate-900">${p.googleTransfer}</p>
            </div>
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-3">
              <p className="text-xs text-slate-500 mb-0.5">App Store</p>
              <p className="text-xl font-bold text-slate-900">${p.appleTransfer}</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3 ml-10">
            To&apos;lov <strong>{p.transferAdvance}% oldindan</strong>
            {p.transferAdvance < 100 ? `, ${100 - p.transferAdvance}% keyin` : ""} amalga oshiriladi.
          </p>
        </div>

        {/* 5. Obuna yangilash */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 animate-slide-up space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center">5</span>
            <h2 className="font-semibold text-slate-900">Obunani uzaytirish (+9 oy)</h2>
          </div>
          <p className="ml-10 text-sm text-slate-600">
            Obunani uzaytirish narxi ilova <strong>chiqarilgan paytdagi narxning 50%</strong>i.
          </p>
          <div className="grid sm:grid-cols-2 gap-3 ml-10">
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-3">
              <p className="text-xs text-slate-500 mb-0.5">Android (Play Market)</p>
              <p className="text-xl font-bold text-slate-900">${Math.round(p.playMarketPublish / 2)}</p>
            </div>
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-3">
              <p className="text-xs text-slate-500 mb-0.5">iOS (App Store)</p>
              <p className="text-xl font-bold text-slate-900">${Math.round(p.appStorePublish / 2)}</p>
            </div>
          </div>
          <ul className="ml-10 space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 flex-shrink-0">•</span>
              Obuna tugamasidan oldin yangilansa — keyingi obuna uchun <strong>10% gacha chegirma</strong> beriladi.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 flex-shrink-0">•</span>
              Yangilash uchun <strong>3 kunlik muddat</strong> beriladi. 3 kun ichida to&apos;lov bo&apos;lmasa, chegirma bekor qilinadi.
            </li>
          </ul>
        </div>

        {/* 6. Umumiy qoida */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 animate-slide-up space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center">6</span>
            <h2 className="font-semibold text-slate-900">To&apos;lov bo&apos;yicha umumiy qoida</h2>
          </div>
          <div className="ml-10 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
            <p className="font-semibold mb-1">⚠️ Diqqat</p>
            <ul className="space-y-1">
              <li>Faqat <strong>&quot;Ilovani Store-ga chiqarish&quot;</strong> xizmatida avans ({p.publishAdvance}/{100 - p.publishAdvance}) qo&apos;llaniladi.</li>
              <li>Boshqa barcha xizmatlarda to&apos;lov <strong>100% oldindan</strong> amalga oshiriladi.</li>
            </ul>
          </div>
        </div>

        {/* 7. Valyuta */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 animate-slide-up space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center">7</span>
            <h2 className="font-semibold text-slate-900">Valyuta kursi bo&apos;yicha hisob-kitob</h2>
          </div>
          <div className="ml-10 text-sm text-slate-600 space-y-2">
            <p>Dollar ($) ko&apos;rinishidagi narxlar so&apos;mga (UZS) konvertatsiya qilinayotganda
              to&apos;lov amalga oshirilayotgan kundagi <strong>Kapital bank ilovasidagi &quot;Sotish&quot; kursi</strong> asos qilib olinadi.</p>
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 text-xs space-y-1">
              <p className="font-semibold text-slate-700">Misol:</p>
              <p>Xizmat narxi: <strong>$10</strong></p>
              <p>Kapital bank &quot;Sotish&quot; kursi: <strong>1$ = 12 800 so&apos;m</strong></p>
              <p>To&apos;lov miqdori: <strong>10 × 12 800 = 128 000 so&apos;m</strong></p>
            </div>
          </div>
        </div>

        {/* Eslatma */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 text-xs text-slate-500 text-center animate-slide-up">
          ℹ️ Barcha narx va shartlar UMD GROUP tomonidan belgilanadi va o&apos;zgarishi mumkin.
          <br/>Oxirgi yangilanish: Yanvar 2026
        </div>
      </main>
    </div>
  );
}
