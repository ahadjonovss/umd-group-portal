import Link from "next/link";

export interface PublishedItem {
  id: string;
  label: string;
}

// Store'ga chiqqan, lekin hali baholanmagan ilovalar uchun eslatma banneri.
export function PublishedReviewAlert({ apps }: { apps: PublishedItem[] }) {
  if (!apps.length) return null;

  return (
    <div className="flex flex-col gap-2 mb-6">
      {apps.map((a) => (
        <div
          key={a.id}
          className="relative flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 animate-slide-down"
        >
          <div className="text-2xl flex-shrink-0">🎉</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-emerald-800">
              Sizning <span className="font-bold">{a.label}</span> ilovangiz store&apos;ga chiqdi!
            </p>
            <p className="text-xs text-emerald-700">Xizmatimizni baholab, fikringizni qoldiring.</p>
          </div>
          <Link
            href={`/panel?review=${a.id}`}
            className="flex-shrink-0 inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 active:scale-95 transition-all"
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
