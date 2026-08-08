"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/labels";
import { actSendPaymentReminder } from "@/app/admin/actions";

// Har qanday to'lanmagan to'lov (avans/yakuniy/so'rov/custom hisob-faktura)
export interface PendingItem {
  key: string;
  appId: string;
  requestId?: string;
  title: string; // ilova nomi / hisob-faktura nomi
  kindLabel: string; // Avans / Yakuniy / Transfer / Hisob-faktura ...
  amountUsd: number;
  ownerUid: string;
  ownerName: string;
  ownerPhone: string;
  createdAt: string | null;
  published: boolean;
}

function buildPlainMessage(it: PendingItem): string {
  const warning = it.published ? `⚠️ Vaqtida to'lamasangiz, ilovangiz store'dan olib tashlanishi mumkin.\n\n` : "";
  return (
    `⏰ Eslatma: to'lanmagan to'lovingiz bor\n\n` +
    `📌 ${it.title} — ${it.kindLabel}\n💵 $${it.amountUsd}\n\n` +
    warning +
    `Iltimos, to'lovni "To'lov" bo'limida amalga oshiring 🙏`
  );
}

// To'lovi kutilayotgan (to'lanmagan) barcha to'lovlar — Telegram eslatmasi / nusxalash bilan.
export function PendingInvoicesPanel({ items, linkedUids = [] }: { items: PendingItem[]; linkedUids?: string[] }) {
  const [q, setQ] = useState("");
  const [sendingId, setSendingId] = useState("");
  const [sentId, setSentId] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const [errId, setErrId] = useState<{ id: string; msg: string } | null>(null);
  const linked = useMemo(() => new Set(linkedUids), [linkedUids]);

  const total = items.reduce((s, i) => s + i.amountUsd, 0);
  const filtered = items.filter((i) => {
    if (!q.trim()) return true;
    return `${i.title} ${i.ownerName} ${i.ownerPhone}`.toLowerCase().includes(q.trim().toLowerCase());
  });

  async function sendReminder(it: PendingItem) {
    setSendingId(it.key);
    setErrId(null);
    try {
      const res = await actSendPaymentReminder({ appId: it.appId, requestId: it.requestId, title: it.title, amountUsd: it.amountUsd });
      if (res.ok) {
        setSentId(it.key);
        setTimeout(() => setSentId(""), 2500);
      } else {
        setErrId({ id: it.key, msg: res.error || "Yuborilmadi" });
        setTimeout(() => setErrId(null), 3000);
      }
    } catch {
      setErrId({ id: it.key, msg: "Xato yuz berdi" });
      setTimeout(() => setErrId(null), 3000);
    } finally {
      setSendingId("");
    }
  }

  async function copyMessage(it: PendingItem) {
    try {
      await navigator.clipboard.writeText(buildPlainMessage(it));
      setCopiedId(it.key);
      setTimeout(() => setCopiedId(""), 2500);
    } catch {
      // clipboard bloklansa — jim
    }
  }

  if (!items.length) {
    return <p className="text-sm text-slate-400 py-10 text-center">To&apos;lovi kutilayotgan hech narsa yo&apos;q.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ilova nomi yoki mijoz bo'yicha qidirish…"
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
          />
        </div>
        <div className="text-sm text-slate-500">
          Jami: <span className="font-bold text-amber-600">${Math.round(total).toLocaleString("en-US")}</span> · {items.length} ta
        </div>
      </div>

      {filtered.length ? (
        <div className="flex flex-col gap-2">
          {filtered.map((it) => (
            <div key={it.key} className="flex items-center justify-between gap-3 bg-white rounded-xl border border-slate-200/80 p-3.5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Link href={`/admin/app/${it.appId}`} className="font-semibold text-slate-900 text-sm truncate hover:text-blue-600 hover:underline">
                    {it.title}
                  </Link>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200 text-[10px] font-medium flex-shrink-0">
                    {it.kindLabel}
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate">
                  ${it.amountUsd} · {it.ownerName}{it.ownerPhone ? ` · ${it.ownerPhone}` : ""}
                </p>
                {it.createdAt && <p className="text-[11px] text-slate-400 mt-0.5">Yaratilgan: {formatDate(it.createdAt)}</p>}
              </div>
              <div className="flex-shrink-0 flex items-center gap-2">
                {linked.has(it.ownerUid) && (
                  <button
                    onClick={() => sendReminder(it)}
                    disabled={sendingId === it.key}
                    title="Foydalanuvchining Telegramiga eslatma yuborish"
                    className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-sky-500 text-white text-sm font-semibold hover:bg-sky-600 disabled:opacity-60 transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
                    </svg>
                    {errId?.id === it.key ? "✕ " + errId.msg : sendingId === it.key ? "Yuborilmoqda…" : sentId === it.key ? "✓ Yuborildi" : "Eslatma yuborish"}
                  </button>
                )}
                <button
                  onClick={() => copyMessage(it)}
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2v-2m-6-12h6a2 2 0 012 2v6m-8-8V3m0 2h4" />
                  </svg>
                  {copiedId === it.key ? "✓ Nusxalandi" : "Nusxalash"}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400 py-10 text-center">Topilmadi.</p>
      )}
    </div>
  );
}
