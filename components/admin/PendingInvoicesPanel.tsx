"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { RequestView } from "@/lib/firestore/requests";
import { formatDate } from "@/lib/labels";
import { actSendCustomInvoiceReminder } from "@/app/admin/actions";

function buildPlainMessage(title: string, amountUsd: number, published: boolean): string {
  const warning = published ? `⚠️ Vaqtida to'lamasangiz, ilovangiz store'dan olib tashlanishi mumkin.\n\n` : "";
  return (
    `⏰ Eslatma: to'lanmagan hisob-faktura mavjud\n\n` +
    `📌 ${title}\n💵 $${amountUsd}\n\n` +
    warning +
    `Iltimos, to'lovni "To'lov" bo'limida amalga oshiring 🙏`
  );
}

// Kutilayotgan (to'lanmagan) custom hisob-fakturalar ro'yxati — har biriga
// Telegram orqali qarz eslatmasi yuborish (yoki xabarni nusxalash) imkoni bilan.
// publishedAppIds — store'ga chiqarilgan ilovalar id'lari (xabarga ogohlantirish qo'shish uchun).
export function PendingInvoicesPanel({
  items,
  linkedUids = [],
  publishedAppIds = [],
}: {
  items: RequestView[];
  linkedUids?: string[];
  publishedAppIds?: string[];
}) {
  const [q, setQ] = useState("");
  const [sendingId, setSendingId] = useState("");
  const [sentId, setSentId] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const [errId, setErrId] = useState<{ id: string; msg: string } | null>(null);
  const linked = useMemo(() => new Set(linkedUids), [linkedUids]);
  const published = useMemo(() => new Set(publishedAppIds), [publishedAppIds]);

  const filtered = items.filter((r) => {
    if (!q.trim()) return true;
    const hay = `${r.appName ?? ""} ${r.ownerName} ${r.ownerPhone}`.toLowerCase();
    return hay.includes(q.trim().toLowerCase());
  });

  async function sendReminder(r: RequestView) {
    setSendingId(r.id);
    setErrId(null);
    try {
      const res = await actSendCustomInvoiceReminder(r.id);
      if (res.ok) {
        setSentId(r.id);
        setTimeout(() => setSentId(""), 2500);
      } else {
        setErrId({ id: r.id, msg: res.error || "Yuborilmadi" });
        setTimeout(() => setErrId(null), 3000);
      }
    } catch {
      setErrId({ id: r.id, msg: "Xato yuz berdi" });
      setTimeout(() => setErrId(null), 3000);
    } finally {
      setSendingId("");
    }
  }

  async function copyMessage(r: RequestView) {
    try {
      await navigator.clipboard.writeText(
        buildPlainMessage(r.appName || "Qo'shimcha to'lov", r.amountUsd, published.has(r.appId))
      );
      setCopiedId(r.id);
      setTimeout(() => setCopiedId(""), 2500);
    } catch {
      // clipboard bloklansa — jim
    }
  }

  if (!items.length) {
    return <p className="text-sm text-slate-400 py-10 text-center">Kutilayotgan hisob-faktura yo&apos;q.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
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

      {filtered.length ? (
        <div className="flex flex-col gap-2">
          {filtered.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3 bg-white rounded-xl border border-slate-200/80 p-3.5">
              <div className="min-w-0">
                <Link href={`/admin/app/${r.appId}`} className="font-semibold text-slate-900 text-sm truncate hover:text-blue-600 hover:underline">
                  {r.appName || "Qo'shimcha to'lov"}
                </Link>
                <p className="text-xs text-slate-500 truncate">
                  ${r.amountUsd} · {r.ownerName} · {r.ownerPhone}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Yaratilgan: {formatDate(r.createdAt)}</p>
              </div>
              <div className="flex-shrink-0 flex items-center gap-2">
                {linked.has(r.ownerUid) && (
                  <button
                    onClick={() => sendReminder(r)}
                    disabled={sendingId === r.id}
                    title="Foydalanuvchining Telegramiga qarz eslatmasini yuborish"
                    className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-sky-500 text-white text-sm font-semibold hover:bg-sky-600 disabled:opacity-60 transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
                    </svg>
                    {errId?.id === r.id ? "✕ " + errId.msg : sendingId === r.id ? "Yuborilmoqda…" : sentId === r.id ? "✓ Yuborildi" : "Eslatma yuborish"}
                  </button>
                )}
                <button
                  onClick={() => copyMessage(r)}
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2v-2m-6-12h6a2 2 0 012 2v6m-8-8V3m0 2h4" />
                  </svg>
                  {copiedId === r.id ? "✓ Nusxalandi" : "Nusxalash"}
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
