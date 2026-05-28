import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ariza Qabul Qilindi — UMD GROUP",
};

const serviceNames: Record<string, string> = {
  "play-market": "Play Market Joylashtirish",
  "app-store": "App Store Joylashtirish",
  "google-transfer": "Google Play Transfer",
  "apple-transfer": "Apple App Store Transfer",
};

function SuccessContent({ service }: { service: string | null }) {
  const serviceName = service ? serviceNames[service] : "Xizmat";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          {/* Success icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Ariza qabul qilindi!</h1>
          <p className="text-gray-500 mb-2">
            <span className="font-medium text-gray-700">{serviceName}</span> bo&apos;yicha arizangiz muvaffaqiyatli yuborildi.
          </p>
          <p className="text-sm text-gray-400 mb-8">
            Jamoamiz tez orada siz bilan bog&apos;lanadi.
          </p>

          {/* Steps */}
          <div className="text-left bg-gray-50 rounded-xl p-4 mb-6 space-y-3">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Keyingi qadamlar:</p>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">1</div>
              <p className="text-sm text-gray-600">Jamoamiz arizangizni ko&apos;rib chiqadi (1-2 ish kuni)</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">2</div>
              <p className="text-sm text-gray-600">Email yoki telefon orqali siz bilan bog&apos;lanamiz</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">3</div>
              <p className="text-sm text-gray-600">Ilovangiz joylashtirilishi haqida xabar beramiz</p>
            </div>
          </div>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 h-10 px-6 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Bosh sahifaga qaytish
          </Link>
        </div>

        <p className="text-xs text-gray-400 mt-4">© {new Date().getFullYear()} UMD GROUP</p>
      </div>
    </div>
  );
}

export default function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  return (
    <Suspense fallback={<SuccessContent service={null} />}>
      <SuccessPageContent searchParams={searchParams} />
    </Suspense>
  );
}

async function SuccessPageContent({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const params = await searchParams;
  return <SuccessContent service={params.service || null} />;
}
