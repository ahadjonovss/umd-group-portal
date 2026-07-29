import Link from "next/link";
import type { AppView } from "@/lib/firestore/apps";
import { pkgActive, pkgDaysLeft } from "@/lib/payment-state";
import { SERVICE_LABELS } from "@/lib/labels";

const WARN_WITHIN_DAYS = 3;

// Update paketi tez orada tugaydigan ilovalar bo'yicha eslatma.
export function PackageExpiryAlert({ apps }: { apps: AppView[] }) {
  const expiring = apps.filter((a) => {
    if (!pkgActive(a.updatePackage)) return false;
    const d = pkgDaysLeft(a.updatePackage);
    return d > 0 && d <= WARN_WITHIN_DAYS;
  });
  if (!expiring.length) return null;

  return (
    <div className="flex flex-col gap-2 mb-6">
      {expiring.map((a) => {
        const days = pkgDaysLeft(a.updatePackage);
        const name = a.appName || SERVICE_LABELS[a.serviceType];
        return (
          <Link
            key={a.id}
            href={`/panel/app/${a.id}`}
            className="relative flex items-center gap-3.5 rounded-2xl ring-1 ring-cyan-200/70 bg-gradient-to-r from-cyan-50 to-sky-50 shadow-sm shadow-cyan-100/60 px-4 py-3.5 animate-slide-down hover:ring-cyan-300 transition-colors"
          >
            <span className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center text-xl flex-shrink-0">⏳</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-cyan-800">
                <span className="font-bold">{name}</span> update paketi{" "}
                <span className="font-bold">{days} kun</span>dan so&apos;ng tugaydi
              </p>
              <p className="text-xs text-cyan-700">
                Qolgan updatelar: {a.updatePackage!.quota - a.updatePackage!.used} ta · paketni yangilash mumkin
              </p>
            </div>
            <svg className="w-4 h-4 text-cyan-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        );
      })}
    </div>
  );
}
