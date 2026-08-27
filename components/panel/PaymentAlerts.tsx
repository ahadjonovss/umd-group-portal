"use client";

import { useState } from "react";
import Link from "next/link";
import { PaymentView } from "@/components/panel/PaymentView";

// Har bir to'lov qayerdan kelib chiqqanini bildiradi — "hammasini birga to'lash"
// so'rovida serverga aynan shu ma'lumot yuboriladi.
export type PaymentAlertKey =
  | { type: "app"; appId: string; kind: "advance" | "final" }
  | { type: "request"; requestId: string }
  | { type: "renewal_pending"; appId: string }; // obunasi tugagan, so'rov hali yaratilmagan

export interface PaymentAlertItem {
  appId: string;
  title: string;
  label: string; // Avans to'lovi / Yakuniy to'lov / Update to'lovi ...
  usd: number;
  key?: PaymentAlertKey; // bo'lmasa — to'lov yozuvi yo'q, faqat ilovaga o'tish mumkin
}

interface GroupedItem {
  label: string;
  usd: number;
  key?: PaymentAlertKey;
}

interface GroupedAlert {
  appId: string;
  title: string;
  items: GroupedItem[];
  total: number;
}

// Bir xil ilovaning bir nechta to'lovini bitta qatorga birlashtiradi.
function groupByApp(items: PaymentAlertItem[]): GroupedAlert[] {
  const map = new Map<string, GroupedAlert>();
  for (const it of items) {
    const g = map.get(it.appId) ?? { appId: it.appId, title: it.title, items: [], total: 0 };
    g.items.push({ label: it.label, usd: it.usd, key: it.key });
    g.total += it.usd;
    map.set(it.appId, g);
  }
  return Array.from(map.values());
}

// Obunasi tugagan ilova uchun — bosilganda so'rovni (agar yo'q bo'lsa) yaratadi va
// darhol to'lov oynasini shu yerning o'zida ochadi, ilovaga kirish shart emas.
function RenewalInlinePay({
  appId,
  usd,
  rate,
  cardNumber,
  cardHolder,
  walletUzs,
}: {
  appId: string;
  usd: number;
  rate: number | null;
  cardNumber: string;
  cardHolder: string;
  walletUzs: number;
}) {
  const [requestId, setRequestId] = useState<string | null>(null);
  const [actual, setActual] = useState<{ usd: number; uzs: number | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function start() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/requests/renewal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Xato yuz berdi");
      setRequestId(json.id);
      if (typeof json.usd === "number") setActual({ usd: json.usd, uzs: typeof json.uzs === "number" ? json.uzs : null });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xato yuz berdi");
    } finally {
      setLoading(false);
    }
  }

  if (requestId) {
    const payUsd = actual?.usd ?? usd;
    const payUzs = actual ? actual.uzs : rate ? Math.round(usd * rate) : null;
    return (
      <PaymentView
        endpoint="/api/requests/receipt"
        idPayload={{ requestId }}
        usd={payUsd}
        uzs={payUzs}
        rate={rate}
        cardNumber={cardNumber}
        cardHolder={cardHolder}
        walletUzs={walletUzs}
        amountLabel="Obunani uzaytirish (+9 oy)"
        receiptSent={false}
        askTaxPhone
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={start}
        disabled={loading}
        className="self-start inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors"
      >
        {loading ? "Boshlanmoqda…" : `To'lash — $${usd}`}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function PaymentAlerts({
  items,
  cardNumber,
  cardHolder,
  rate,
  walletUzs = 0,
}: {
  items: PaymentAlertItem[];
  cardNumber: string;
  cardHolder: string;
  rate: number | null;
  walletUzs?: number;
}) {
  const [open, setOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [renewalOpenAppId, setRenewalOpenAppId] = useState<string | null>(null);
  if (!items.length) return null;

  const total = items.reduce((s, i) => s + i.usd, 0);
  const groups = groupByApp(items);

  // Bittada to'lash mumkin bo'lgan to'lovlar (haqiqiy yozuvi bor bo'lganlar —
  // obunani uzaytirish eslatmasi hali so'rov yaratmagani uchun bunga kirmaydi).
  const bulkItems = items.filter((i) => i.key && i.key.type !== "renewal_pending");
  const bulkTotal = bulkItems.reduce((s, i) => s + i.usd, 0);
  const bulkUzs = rate ? Math.round(bulkTotal * rate) : null;
  const canBulkPay = bulkItems.length > 1;

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 rounded-2xl ring-1 ring-amber-200/70 bg-gradient-to-r from-amber-50 to-orange-50 shadow-sm shadow-amber-100/60 px-4 py-3.5 hover:ring-amber-300 transition-colors"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <span className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </span>
          <div className="min-w-0 text-left">
            <p className="text-sm font-bold text-slate-900">To&apos;lov kutilmoqda</p>
            <p className="text-xs text-amber-700">
              {items.length} ta to&apos;lov{groups.length > 1 ? ` · ${groups.length} ta ilova` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <span className="text-base font-bold text-slate-900">${total}</span>
          <svg
            className={`w-4 h-4 text-amber-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="flex flex-col gap-2 mt-2">
          {/* Hammasini birga to'lash */}
          {canBulkPay && (
            <div className="rounded-xl ring-1 ring-slate-200 bg-white p-3.5">
              <button
                onClick={() => setBulkOpen((v) => !v)}
                className="w-full flex items-center justify-between gap-3"
              >
                <span className="text-sm font-semibold text-slate-800">
                  💳 Hammasini birga to&apos;lash <span className="text-slate-400 font-normal">({bulkItems.length} ta)</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600">
                  ${bulkTotal}
                  <svg className={`w-3.5 h-3.5 transition-transform ${bulkOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </button>
              {bulkOpen && (
                <div className="mt-3">
                  <PaymentView
                    endpoint="/api/payment/bulk-receipt"
                    idPayload={{ items: JSON.stringify(bulkItems.map((i) => i.key)) }}
                    usd={bulkTotal}
                    uzs={bulkUzs}
                    rate={rate}
                    cardNumber={cardNumber}
                    cardHolder={cardHolder}
                    walletUzs={walletUzs}
                    amountLabel={`Hammasi — ${bulkItems.length} ta to'lov`}
                    receiptSent={false}
                    askTaxPhone
                  />
                </div>
              )}
            </div>
          )}

          {groups.map((g) => {
            // Obunasi tugagan, hali so'rovi yo'q ilova — bosilganda shu yerning o'zida to'lash
            const renewal = g.items.length === 1 && g.items[0].key?.type === "renewal_pending" ? g.items[0] : null;
            if (renewal) {
              const isOpen = renewalOpenAppId === g.appId;
              return (
                <div key={g.appId} className="rounded-xl ring-1 ring-amber-200/60 bg-white px-4 py-3">
                  <button
                    onClick={() => setRenewalOpenAppId(isOpen ? null : g.appId)}
                    className="w-full flex items-center gap-3.5"
                  >
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-semibold text-slate-900 truncate">{g.title}</p>
                      <p className="text-xs text-amber-700">{renewal.label}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-bold text-slate-900">${g.total}</span>
                      <svg className={`w-4 h-4 text-amber-400 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  {isOpen && (
                    <div className="mt-3">
                      <RenewalInlinePay appId={g.appId} usd={g.total} rate={rate} cardNumber={cardNumber} cardHolder={cardHolder} walletUzs={walletUzs} />
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={g.appId}
                href={`/panel/app/${g.appId}`}
                className="group relative flex items-center gap-3.5 rounded-xl ring-1 ring-amber-200/60 bg-white px-4 py-3 hover:ring-amber-300 hover:bg-amber-50/40 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{g.title}</p>
                  <p className="text-xs text-amber-700 truncate">
                    {g.items.length > 1 ? `${g.items.length} ta to'lov: ${g.items.map((i) => i.label).join(", ")}` : g.items[0].label}
                    {" · to'lash uchun bosing"}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-bold text-slate-900">${g.total}</span>
                  <svg className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
