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
      <div className="mb-4">
        <h2 className="font-semibold text-slate-900">Biz chiqargan ilovalar</h2>
        <p className="text-xs text-slate-400 mt-0.5">Store&apos;larda faol ilovalarimiz</p>
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
