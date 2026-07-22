import type { ActivityView } from "@/lib/firestore/activity";

const ACTOR_STYLE: Record<string, { dot: string; label: string }> = {
  admin: { dot: "bg-blue-500", label: "Admin" },
  user: { dot: "bg-emerald-500", label: "Mijoz" },
  system: { dot: "bg-slate-400", label: "Tizim" },
};

function fmt(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function ActivityTimeline({ items, forUser = false }: { items: ActivityView[]; forUser?: boolean }) {
  if (!items.length) {
    return <p className="text-sm text-slate-400">Hali amaliyotlar yo&apos;q.</p>;
  }
  return (
    <ol className="flex flex-col">
      {items.map((a, i) => {
        const s = ACTOR_STYLE[a.actorType] ?? ACTOR_STYLE.system;
        const last = i === items.length - 1;

        // Mijoz tomonida admin/tizim shaxsini oshkor qilmaymiz — "UMD GROUP".
        let dot = s.dot;
        let actorText: string;
        if (forUser) {
          if (a.actorType === "user") {
            actorText = "Siz";
            dot = "bg-emerald-500";
          } else {
            actorText = "UMD GROUP";
            dot = "bg-blue-500";
          }
        } else {
          actorText = `${a.actorName || s.label} · ${s.label}`;
        }

        return (
          <li key={a.id} className="relative flex gap-3">
            <div className="flex flex-col items-center flex-shrink-0">
              <span className={`w-2.5 h-2.5 rounded-full ${dot} mt-1.5`} />
              {!last && <span className="w-px flex-1 bg-slate-200 my-1" />}
            </div>
            <div className={`min-w-0 ${last ? "" : "pb-4"}`}>
              <p className="text-sm text-slate-800 leading-snug">{a.message}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {fmt(a.createdAt)} · {actorText}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
