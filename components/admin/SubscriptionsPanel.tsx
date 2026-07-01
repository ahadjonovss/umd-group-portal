"use client";

import { useMemo, useState } from "react";
import type { AppView } from "@/lib/firestore/apps";
import { SERVICE_SHORT } from "@/lib/labels";

const SITE_URL = "https://umdgroup.uz";
const UZ_MONTHS = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];

function dmy(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-");
  return `${UZ_MONTHS[parseInt(m, 10) - 1]} ${y}`;
}

// Mijozga yuboriladigan xabar matni (havola bilan)
function buildMessage(app: AppView, endIso: string): string {
  const appName = app.appName || SERVICE_SHORT[app.serviceType];
  const deeplink = `${SITE_URL}/panel/app/${app.id}`;
  return (
    `Assalomu alaykum, salomatmisiz? Sizning ${appName} ilovangizning UMD GROUP bilan shartnoma muddati ${dmy(endIso)}da o'z yakuniga yetgan.\n\n` +
    `Foydalanish shartlarimizga ko'ra obunani yangilashingiz kerak. Aks holatda ilova ogohlantirishsiz storelardan olib tashlanadi.\n\n` +
    `Quyidagi havola orqali to'lovni amalga oshiring:\n${deeplink}`
  );
}

export function SubscriptionsPanel({
  apps,
  telegramByUid,
}: {
  apps: AppView[];
  telegramByUid: Record<string, string>;
}) {
  const [month, setMonth] = useState("");
  const [sentId, setSentId] = useState("");

  const groups = useMemo(() => {
    const now = Date.now();
    const items = apps
      .filter((a) => a.status === "published" && a.subscription?.endDate)
      .map((a) => {
        const end = a.subscription!.endDate as string;
        return { app: a, end, monthKey: end.slice(0, 7), expired: new Date(end).getTime() < now };
      })
      .sort((a, b) => a.end.localeCompare(b.end));

    const filtered = month ? items.filter((i) => i.monthKey === month) : items;

    const map = new Map<string, typeof filtered>();
    for (const it of filtered) {
      const arr = map.get(it.monthKey) ?? [];
      arr.push(it);
      map.set(it.monthKey, arr);
    }
    const grouped = Array.from(map.entries())
      .map(([key, list]) => ({ key, label: monthLabel(key), list }))
      .sort((a, b) => a.key.localeCompare(b.key));

    const monthOptions = Array.from(new Set(items.map((i) => i.monthKey)))
      .sort()
      .map((k) => ({ value: k, label: monthLabel(k) }));

    return { grouped, monthOptions, total: items.length };
  }, [apps, month]);

  async function send(app: AppView, endIso: string) {
    const msg = buildMessage(app, endIso);
    const tg = telegramByUid[app.ownerUid];
    try {
      await navigator.clipboard.writeText(msg);
    } catch {
      // clipboard bloklansa — jim
    }
    const deeplink = `${SITE_URL}/panel/app/${app.id}`;
    const url = tg
      ? `https://t.me/${tg}` // to'g'ridan-to'g'ri mijoz chati
      : `https://t.me/share/url?url=${encodeURIComponent(deeplink)}&text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setSentId(app.id);
    setTimeout(() => setSentId(""), 3000);
  }

  if (!groups.total) {
    return <p className="text-sm text-slate-400 py-10 text-center">Obunali ilova yo&apos;q.</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
        >
          <option value="">Barcha oylar</option>
          {groups.monthOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {groups.grouped.map((g) => (
        <div key={g.key}>
          <h3 className="text-sm font-bold text-slate-900 mb-2">
            {g.label} <span className="text-slate-400 font-normal">· {g.list.length} ta</span>
          </h3>
          <div className="flex flex-col gap-2">
            {g.list.map(({ app, end, expired }) => {
              const tg = telegramByUid[app.ownerUid];
              return (
                <div
                  key={app.id}
                  className="flex items-center justify-between gap-3 bg-white rounded-xl border border-slate-200/80 p-3.5"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">
                      {app.appName || SERVICE_SHORT[app.serviceType]}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {SERVICE_SHORT[app.serviceType]}
                      {app.contact ? ` · ${app.contact.fullName}` : ""}
                      {tg ? ` · @${tg}` : " · (Telegram yo'q)"}
                    </p>
                    <p className={`text-xs font-medium mt-0.5 ${expired ? "text-red-600" : "text-amber-600"}`}>
                      Tugash sanasi: {dmy(end)} {expired ? "· muddati tugagan" : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => send(app, end)}
                    title={tg ? `@${tg} ga yuborish` : "Xabarni nusxalab, Telegram tanlash"}
                    className="flex-shrink-0 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
                    </svg>
                    {sentId === app.id ? "✓ Nusxalandi" : "Xabar yuborish"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
