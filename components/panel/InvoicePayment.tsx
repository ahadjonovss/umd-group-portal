"use client";

import { useState } from "react";
import { PaymentView } from "@/components/panel/PaymentView";
import type { PayState } from "@/lib/payment-state";

interface Invoice {
  key: "advance" | "final";
  label: string;
  usd: number;
  uzs: number | null;
  state: PayState; // due | submitted | confirmed | rejected | locked
}

const STATE_BADGE: Record<string, { text: string; cls: string; dot: string }> = {
  due: { text: "To'lanmagan", cls: "bg-amber-50 text-amber-700 ring-amber-200", dot: "bg-amber-500" },
  rejected: { text: "Rad etilgan — qayta yuboring", cls: "bg-red-50 text-red-700 ring-red-200", dot: "bg-red-500" },
  submitted: { text: "Yuborildi — tekshiruvda", cls: "bg-blue-50 text-blue-700 ring-blue-200", dot: "bg-blue-500" },
  confirmed: { text: "To'langan", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500" },
  locked: { text: "Keyinroq", cls: "bg-slate-100 text-slate-500 ring-slate-200", dot: "bg-slate-400" },
};

type Choice = "full" | "advance" | "final";

export function InvoicePayment({
  appId,
  invoices,
  rate,
  cardNumber,
  cardHolder,
  walletUzs,
  discountPercent,
}: {
  appId: string;
  invoices: Invoice[];
  rate: number | null;
  cardNumber: string;
  cardHolder: string;
  walletUzs: number;
  discountPercent: number;
}) {
  const advInv = invoices.find((i) => i.key === "advance");
  const finInv = invoices.find((i) => i.key === "final");
  const isPayable = (i?: Invoice) => !!i && (i.state === "due" || i.state === "rejected");
  const advPayable = isPayable(advInv);
  const finPayable = isPayable(finInv);
  const advDone = !advInv || advInv.state === "confirmed"; // avans to'langanmi (yoki avans yo'q)

  // Alohida tanlanadigan invoicelar — YAKUNIY faqat avans to'langach chiqadi
  const selectable: Invoice[] = [];
  if (advPayable) selectable.push(advInv!);
  if (finPayable && advDone) selectable.push(finInv!);

  const canFull = advPayable && finPayable; // ikkalasi ham to'lanmagan -> "to'liq to'lash"

  // Default: avans (agar to'lanadigan bo'lsa), aks holda to'liq/birinchi mavjud qism
  const [choice, setChoice] = useState<Choice>(advPayable ? "advance" : canFull ? "full" : (selectable[0]?.key ?? "advance"));

  const fullUsd = invoices.reduce((s, i) => s + (i.state === "due" || i.state === "rejected" ? i.usd : 0), 0);
  const fullUzs = rate ? Math.round(fullUsd * rate) : null;

  // Tanlangan invoice(lar) uchun PaymentView parametrlari
  let payProps: { usd: number; uzs: number | null; kind?: string; label: string } | null = null;
  if (choice === "full" && canFull) {
    payProps = { usd: fullUsd, uzs: fullUzs, kind: "full", label: "To'liq to'lov" };
  } else {
    const inv = invoices.find((i) => i.key === choice && (i.state === "due" || i.state === "rejected"));
    if (inv) payProps = { usd: inv.usd, uzs: inv.uzs, kind: inv.key === "final" ? "final" : undefined, label: inv.label };
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Invoice ro'yxati */}
      <div className="flex flex-col gap-2">
        {invoices.map((i) => {
          // Yakuniy avans to'langunча "keyinroq" ko'rinishida turadi
          const effState = i.key === "final" && !advDone && i.state !== "confirmed" ? "locked" : i.state;
          const b = STATE_BADGE[effState] ?? STATE_BADGE.due;
          return (
            <div key={i.key} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 ring-1 ring-slate-100 px-3.5 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800">{i.label}</p>
                <p className="text-xs text-slate-500">
                  ${i.usd}
                  {i.uzs ? <span className="text-slate-400"> · ~{i.uzs.toLocaleString("en-US")} so&apos;m</span> : null}
                </p>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 flex-shrink-0 ${b.cls}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${b.dot}`} />
                {b.text}
              </span>
            </div>
          );
        })}
      </div>

      {/* To'lov */}
      {payProps && (
        <div className="flex flex-col gap-3">
          {/* Tanlov — bir nechta to'lanadigan invoice bo'lsa */}
          {(canFull) && (
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit">
              <button
                onClick={() => setChoice("full")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${choice === "full" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
              >
                To&apos;liq to&apos;lash
              </button>
              {selectable.map((i) => (
                <button
                  key={i.key}
                  onClick={() => setChoice(i.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${choice === i.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
                >
                  {i.label}
                </button>
              ))}
            </div>
          )}

          <PaymentView
            endpoint="/api/payment/receipt"
            idPayload={payProps.kind ? { appId, kind: payProps.kind } : { appId }}
            amountLabel={payProps.label}
            usd={payProps.usd}
            uzs={payProps.uzs}
            rate={rate}
            cardNumber={cardNumber}
            cardHolder={cardHolder}
            receiptSent={false}
            askTaxPhone={choice === "full" || choice === "final" || (choice === "advance" && !invoices.some((i) => i.key === "final"))}
            discountPercent={discountPercent}
            walletUzs={walletUzs}
          />
        </div>
      )}
    </div>
  );
}
