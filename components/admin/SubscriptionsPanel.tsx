"use client";

import { useMemo, useState } from "react";
import type { AppView } from "@/lib/firestore/apps";
import { appShort } from "@/lib/labels";
import { actSendSubscriptionMessage } from "@/app/admin/actions";

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

function buildMessage(app: AppView, endIso: string): string {
  const appName = app.appName || appShort(app);
  const deeplink = `${SITE_URL}/panel/app/${app.id}`;
  return (
    `Assalomu alaykum, salomatmisiz? Sizning ${appName} ilovangizning UMD GROUP bilan shartnoma muddati ${dmy(endIso)}da o'z yakuniga yetgan.\n\n` +
    `Foydalanish shartlarimizga ko'ra obunani yangilashingiz kerak. Aks holatda ilova ogohlantirishsiz storelardan olib tashlanadi.\n\n` +
    `Quyidagi havola orqali to'lovni amalga oshiring:\n${deeplink}`
  );
}

export function SubscriptionsPanel({ apps, linkedUids = [] }: { apps: AppView[]; linkedUids?: string[] }) {
  const [month, setMonth] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const [sentId, setSentId] = useState("");
  const [sendingId, setSendingId] = useState("");
  const [errId, setErrId] = useState<{ id: string; msg: string } | null>(null);
  const linked = useMemo(() => new Set(linkedUids), [linkedUids]);

  async function sendTg(app: AppView) {
    setSendingId(app.id);
    setErrId(null);
    try {
      const r = await actSendSubscriptionMessage(app.id);
      if (r.ok) {
        setSentId(app.id);
        setTimeout(() => setSentId(""), 2500);
      } else {
        setErrId({ id: app.id, msg: r.error || "Yuborilmadi" });
        setTimeout(() => setErrId(null), 3000);
      }
    } catch {
      setErrId({ id: app.id, msg: "Xato yuz berdi" });
      setTimeout(() => setErrId(null), 3000);
    } finally {
      setSendingId("");
    }
  }

  const now = new Date();
  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const groups = useMemo(() => {
    const nowMs = Date.now();
    // Obunasi bor barcha ilovalar (kelajakdagilar ham). "Muddati tugagan"
    // belgisi FAQAT haqiqiy tugash sanasi o'tganlarga qo'yiladi.
    const items = apps
      .filter((a) => a.status === "published" && a.subscription?.endDate)
      .map((a) => {
        const end = a.subscription!.endDate as string;
        return { app: a, end, monthKey: end.slice(0, 7), expired: new Date(end).getTime() < nowMs };
      })
      .sort((a, b) => a.end.localeCompare(b.end));

    const filtered = month ? items.filter((i) => i.monthKey === month) : items;

    const map = new Map<string, typeof filtered>();
    for (const it of filtered) {
      const arr = map.get(it.monthKey) ?? [];
      arr.push(it);
      map.set(it.monthKey, arr);
    }
    let grouped = Array.from(map.entries())
      .map(([key, list]) => ({ key, label: monthLabel(key), list }))
      .sort((a, b) => a.key.localeCompare(b.key));

    // Joriy oyni doim eng tepaga (alohida)
    grouped = grouped.sort((a, b) => {
      if (a.key === currentKey) return -1;
      if (b.key === currentKey) return 1;
      return a.key.localeCompare(b.key);
    });

    const monthOptions = Array.from(new Set(items.map((i) => i.monthKey)))
      .sort()
      .map((k) => ({ value: k, label: monthLabel(k) }));

    return { grouped, monthOptions, total: items.length };
  }, [apps, month, currentKey]);

  async function copyMessage(app: AppView, endIso: string) {
    try {
      await navigator.clipboard.writeText(buildMessage(app, endIso));
      setCopiedId(app.id);
      setTimeout(() => setCopiedId(""), 2500);
    } catch {
      // clipboard bloklansa — jim
    }
  }

  if (!groups.total) {
    return <p className="text-sm text-slate-400 py-10 text-center">Muddati tugayotgan obuna yo&apos;q.</p>;
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
          <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
            {g.label}
            {g.key === currentKey && (
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-semibold">Joriy oy</span>
            )}
            <span className="text-slate-400 font-normal">· {g.list.length} ta</span>
          </h3>
          <div className="flex flex-col gap-2">
            {g.list.map(({ app, end, expired }) => (
              <div
                key={app.id}
                className="flex items-center justify-between gap-3 bg-white rounded-xl border border-slate-200/80 p-3.5"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 text-sm truncate">
                    {app.appName || appShort(app)}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {appShort(app)}
                    {app.contact ? ` · ${app.contact.fullName} · ${app.contact.phone}` : ""}
                  </p>
                  <p className={`text-xs font-medium mt-0.5 ${expired ? "text-red-600" : "text-amber-600"}`}>
                    Tugash sanasi: {dmy(end)} {expired ? "· muddati tugagan" : ""}
                  </p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-2">
                  {linked.has(app.ownerUid) && (
                    <button
                      onClick={() => sendTg(app)}
                      disabled={sendingId === app.id}
                      title="Foydalanuvchining Telegramiga yuborish"
                      className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-sky-500 text-white text-sm font-semibold hover:bg-sky-600 disabled:opacity-60 transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
                      </svg>
                      {errId?.id === app.id ? "✕ " + errId.msg : sendingId === app.id ? "Yuborilmoqda…" : sentId === app.id ? "✓ Yuborildi" : "Telegramga yuborish"}
                    </button>
                  )}
                  <button
                    onClick={() => copyMessage(app, end)}
                    className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2v-2m-6-12h6a2 2 0 012 2v6m-8-8V3m0 2h4" />
                    </svg>
                    {copiedId === app.id ? "✓ Nusxalandi" : "Xabarni nusxalash"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
