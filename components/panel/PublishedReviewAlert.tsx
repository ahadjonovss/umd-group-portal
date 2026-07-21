import Link from "next/link";
import type { ServiceType } from "@/types";

export interface PublishedItem {
  id: string;
  label: string;
  serviceType: ServiceType;
}

function doneText(serviceType: ServiceType): string {
  if (serviceType === "account") return "developer akkauntingiz tayyor bo'ldi";
  if (serviceType === "google-transfer" || serviceType === "apple-transfer") return "transferi yakunlandi";
  return "store'ga chiqdi";
}

// Yakunlangan, lekin hali baholanmagan xizmatlar uchun eslatma banneri.
export function PublishedReviewAlert({ apps }: { apps: PublishedItem[] }) {
  if (!apps.length) return null;

  return (
    <div className="flex flex-col gap-2 mb-6">
      {apps.map((a) => (
        <div
          key={a.id}
          className="relative flex items-center gap-3.5 rounded-2xl ring-1 ring-emerald-200/70 bg-gradient-to-r from-emerald-50 to-teal-50 shadow-sm shadow-emerald-100/60 px-4 py-3.5 animate-slide-down"
        >
          <span className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-xl flex-shrink-0">🎉</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-emerald-800">
              Sizning <span className="font-bold">{a.label}</span> {doneText(a.serviceType)}!
            </p>
            <p className="text-xs text-emerald-700">Xizmatimizni baholab, fikringizni qoldiring.</p>
          </div>
          <Link
            href={`/panel?review=${a.id}`}
            className="flex-shrink-0 inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 active:scale-95 transition-all shadow-sm shadow-emerald-600/20"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            Baholash
          </Link>
        </div>
      ))}
    </div>
  );
}
