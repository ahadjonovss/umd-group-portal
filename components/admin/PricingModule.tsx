"use client";

import { useState, useTransition } from "react";
import type { Pricing } from "@/lib/firestore/settings";
import { actSavePricing } from "@/app/admin/actions";

type SubKey = "publish" | "transfer" | "update" | "account";

function NumField({
  label,
  value,
  onChange,
  unit,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  unit: "$" | "%";
  max?: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-700">{label}</span>
      <div className="relative">
        {unit === "$" && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>}
        <input
          type="number"
          min={0}
          max={max}
          step={1}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className={`w-28 h-9 rounded-lg border border-slate-200 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${
            unit === "$" ? "pl-6 pr-2" : "pl-2 pr-7"
          }`}
        />
        {unit === "%" && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>}
      </div>
    </div>
  );
}

export function PricingModule({ pricing }: { pricing: Pricing }) {
  const [sub, setSub] = useState<SubKey>("publish");
  const [p, setP] = useState<Pricing>(pricing);
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  const set = (k: keyof Pricing, v: number) => {
    setP((prev) => ({ ...prev, [k]: v }));
    setSaved(false);
  };

  const tabs: { key: SubKey; label: string }[] = [
    { key: "publish", label: "Store'ga chiqarish" },
    { key: "transfer", label: "Transfer" },
    { key: "update", label: "Update" },
    { key: "account", label: "Akkaunt ochish" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 max-w-xl">
      <h3 className="font-semibold text-slate-900 mb-1">Narxlar moduli</h3>
      <p className="text-xs text-slate-400 mb-4">
        Barcha narxlar dollarda ($). O&apos;zgartirilsa, xizmat narxlari sahifasi yangilanadi.
      </p>

      {/* Sub-tablar */}
      <div className="inline-flex rounded-xl bg-slate-100 p-1 mb-3">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setSub(t.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              sub === t.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mb-4">
        {sub === "publish" && (
          <>
            <NumField unit="$" label="App Store (iOS)" value={p.appStorePublish} onChange={(v) => set("appStorePublish", v)} />
            <NumField unit="$" label="Play Market (Android)" value={p.playMarketPublish} onChange={(v) => set("playMarketPublish", v)} />
            <NumField unit="%" max={100} label="Avans (oldindan to'lov)" value={p.publishAdvance} onChange={(v) => set("publishAdvance", v)} />
            <NumField unit="%" max={100} label="Voz kechish jarimasi (umumiy narxdan)" value={p.publishCancelFee} onChange={(v) => set("publishCancelFee", v)} />
          </>
        )}
        {sub === "transfer" && (
          <>
            <NumField unit="$" label="Google Play transfer" value={p.googleTransfer} onChange={(v) => set("googleTransfer", v)} />
            <NumField unit="$" label="App Store transfer" value={p.appleTransfer} onChange={(v) => set("appleTransfer", v)} />
            <NumField unit="%" max={100} label="Avans (oldindan to'lov)" value={p.transferAdvance} onChange={(v) => set("transferAdvance", v)} />
          </>
        )}
        {sub === "update" && (
          <>
            <NumField unit="$" label="Android update (har biri)" value={p.updateAndroid} onChange={(v) => set("updateAndroid", v)} />
            <NumField unit="$" label="iOS update (har biri)" value={p.updateIos} onChange={(v) => set("updateIos", v)} />
            <NumField unit="$" label="Push sertifikat (Apple)" value={p.pushCertificate} onChange={(v) => set("pushCertificate", v)} />
            <NumField unit="%" max={100} label="Avans (oldindan to'lov)" value={p.updateAdvance} onChange={(v) => set("updateAdvance", v)} />
          </>
        )}
        {sub === "account" && (
          <>
            <NumField unit="$" label="Google Play — shaxsiy" value={p.accountGooglePersonal} onChange={(v) => set("accountGooglePersonal", v)} />
            <NumField unit="$" label="Google Play — korporativ" value={p.accountGoogleCorporate} onChange={(v) => set("accountGoogleCorporate", v)} />
            <NumField unit="$" label="App Store — shaxsiy" value={p.accountApplePersonal} onChange={(v) => set("accountApplePersonal", v)} />
            <NumField unit="$" label="App Store — korporativ" value={p.accountAppleCorporate} onChange={(v) => set("accountAppleCorporate", v)} />
            <NumField unit="%" max={100} label="Avans (oldindan to'lov)" value={p.accountAdvance} onChange={(v) => set("accountAdvance", v)} />
            <NumField unit="%" max={100} label="Voz kechish jarimasi (umumiy narxdan)" value={p.accountCancelFee} onChange={(v) => set("accountCancelFee", v)} />
          </>
        )}
      </div>

      <p className="text-xs text-slate-400 -mt-2 mb-4">
        Obunani uzaytirish narxi ilova store&apos;ga chiqarilgan paytdagi narxning <strong>50%</strong>i sifatida
        avtomatik hisoblanadi.
      </p>

      <div className="flex items-center gap-3">
        <button
          disabled={pending}
          onClick={() =>
            start(async () => {
              await actSavePricing(p);
              setSaved(true);
            })
          }
          className="h-9 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "Saqlanmoqda…" : "Saqlash"}
        </button>
        {saved && !pending && <span className="text-sm text-emerald-600">✓ Saqlandi</span>}
      </div>
    </div>
  );
}
