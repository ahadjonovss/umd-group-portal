import type { ShowcaseApp } from "@/lib/firestore/apps";

// Chiqarilgan ilovalar logolari — uzluksiz aylanadigan karusel (marquee).
export function AppsShowcase({ apps }: { apps: ShowcaseApp[] }) {
  if (!apps.length) return null;

  // Uzluksiz aylanish uchun ro'yxatni yetarlicha takrorlaymiz.
  const MIN = 10;
  const repeats = Math.max(2, Math.ceil(MIN / apps.length));
  const items = Array.from({ length: repeats }).flatMap(() => apps);

  return (
    <div className="animate-slide-up delay-200">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-1.5 rounded-full mb-3 ring-1 ring-emerald-200">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3.18 23.76c.3.17.64.24.99.2l.1-.04 11.35-6.55-2.47-2.47-9.97 8.86zM.13 1.55C.05 1.8 0 2.06 0 2.35v19.3c0 .29.05.56.13.8l.07.07 10.82-10.82v-.26L.2 1.48l-.07.07zM19.82 9.65l-2.56-1.48-2.78 2.78 2.78 2.78 2.58-1.49c.74-.43.74-1.13-.02-1.59zm-16.64 14.1l.1-.06 12.06-6.96-2.47-2.47-9.69 9.49z" />
          </svg>
          Portfolio
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Biz chiqargan ilovalar</h2>
        <p className="text-slate-500 text-sm mt-1.5">Google Play&apos;da faol {apps.length}+ ilovamiz</p>
      </div>

      <div
        className="relative overflow-hidden w-screen left-1/2 -ml-[50vw]"
        style={{
          maskImage: "linear-gradient(to right, transparent, #000 5%, #000 95%, transparent)",
          WebkitMaskImage: "linear-gradient(to right, transparent, #000 5%, #000 95%, transparent)",
        }}
      >
        <div
          className="flex w-max will-change-transform animate-marquee"
          style={{ ["--marquee-duration" as string]: `${Math.max(items.length * 5, 20)}s` }}
        >
          {[...items, ...items].map((a, i) => {
            const card = (
              <div className="flex flex-col items-center gap-2 w-[104px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={a.iconUrl}
                  alt={a.appName}
                  loading="lazy"
                  className="w-[72px] h-[72px] rounded-[20px] object-cover ring-1 ring-slate-200/70 shadow-sm bg-white"
                />
                <span className="text-xs font-medium text-slate-600 text-center leading-tight line-clamp-2 w-full">
                  {a.appName}
                </span>
              </div>
            );
            return (
              <div key={i} className="flex-shrink-0 px-3">
                {a.storeUrl ? (
                  <a href={a.storeUrl} target="_blank" rel="noopener noreferrer" className="block hover:opacity-80 transition-opacity">
                    {card}
                  </a>
                ) : (
                  card
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
