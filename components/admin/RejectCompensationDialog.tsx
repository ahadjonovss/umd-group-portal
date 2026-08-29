"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

// So'rov yoki ilova arizasini kompensatsiya bilan rad etish dialogi.
// requestId YOKI appId beriladi. Karta orqali qaytarish + skrinshot + Telegram xabar.
export function RejectCompensationDialog({
  requestId,
  appId,
  label,
  totalUsd,
  totalUzs,
  cancelFeePct,
  onClose,
  onDone,
}: {
  requestId?: string;
  appId?: string;
  label: string; // "Update so'rovi" / "Ariza" ...
  totalUsd: number;
  totalUzs: number | null;
  cancelFeePct: number;
  onClose: () => void;
  onDone: () => void;
}) {
  const [initiator, setInitiator] = useState<"user" | "umd">("user");
  const [hold, setHold] = useState(true);
  const [card, setCard] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const commissionOn = initiator === "user" && hold && cancelFeePct > 0;
  const keptUsd = commissionOn ? Math.round((totalUsd * cancelFeePct) / 100) : 0;
  const refundUsd = Math.max(0, totalUsd - keptUsd);
  // So'mda (asosiy ko'rsatkich)
  const paidUzs = totalUzs ?? 0;
  const keptUzs = commissionOn ? Math.round((paidUzs * cancelFeePct) / 100) : 0;
  const refundUzs = Math.max(0, paidUzs - keptUzs);
  const som = (n: number) => n.toLocaleString("en-US") + " so'm";
  const needProof = refundUsd > 0;

  function pick(f: File | null) {
    setFile(f);
    setErr("");
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : "");
  }

  async function submit() {
    if (needProof && !card.trim()) return setErr("Karta raqamini kiriting");
    if (needProof && !file) return setErr("To'lov skrinshotini yuklang");
    setBusy(true);
    setErr("");
    try {
      const fd = new FormData();
      if (requestId) fd.append("requestId", requestId);
      if (appId) fd.append("appId", appId);
      fd.append("initiator", initiator);
      fd.append("hold", commissionOn ? "1" : "0");
      fd.append("cardNumber", card.trim());
      if (file) fd.append("screenshot", file);
      const res = await fetch("/api/admin/reject-request", { method: "POST", body: fd });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Xato");
      onDone();
    } catch (e) {
      setBusy(false);
      setErr(e instanceof Error ? e.message : "Xato yuz berdi");
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-bold text-slate-900 mb-1">{label}ni bekor qilish</h3>
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 mb-3">
          <p className="text-xs text-slate-500">Mijoz to&apos;lagan:</p>
          <p className="text-lg font-bold text-slate-900">{paidUzs > 0 ? som(paidUzs) : `$${totalUsd}`}{paidUzs > 0 ? <span className="text-sm font-normal text-slate-400"> · ${totalUsd}</span> : null}</p>
        </div>

        <label className="text-xs text-slate-500">Bekor qilish tashabbusi</label>
        <div className="grid grid-cols-2 gap-2 mt-1 mb-3">
          <button onClick={() => setInitiator("user")} className={`h-9 rounded-lg text-xs font-semibold border ${initiator === "user" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200"}`}>
            Mijoz so&apos;rovi bilan
          </button>
          <button onClick={() => setInitiator("umd")} className={`h-9 rounded-lg text-xs font-semibold border ${initiator === "umd" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200"}`}>
            Biz (UMD) bekor qilyapmiz
          </button>
        </div>

        {initiator === "user" && cancelFeePct > 0 && (
          <label className="flex items-center gap-2 mb-3 text-sm text-slate-700">
            <input type="checkbox" checked={hold} onChange={(e) => setHold(e.target.checked)} className="w-4 h-4" />
            Komissiya ushlansin ({cancelFeePct}%{paidUzs > 0 ? ` = ${som(Math.round((paidUzs * cancelFeePct) / 100))}` : ` = $${Math.round((totalUsd * cancelFeePct) / 100)}`})
          </label>
        )}

        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 mb-3 text-sm">
          {keptUsd > 0 && <p className="text-slate-700">🧾 Komissiya (daromadда qoladi): <strong>{paidUzs > 0 ? som(keptUzs) : `$${keptUsd}`}</strong></p>}
          <p className="text-emerald-700 font-bold mt-1 text-base">↩️ Qaytarilishi kerak: {paidUzs > 0 ? som(refundUzs) : `$${refundUsd}`}</p>
          {paidUzs > 0 && <p className="text-[11px] text-slate-400 mt-0.5">≈ ${refundUsd}</p>}
        </div>

        {needProof && (
          <>
            <label className="text-xs text-slate-500">Pul qaytarilgan karta raqami</label>
            <input value={card} onChange={(e) => setCard(e.target.value)} placeholder="8600 1234 5678 9012" className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm mt-1 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
            <label className="text-xs text-slate-500">To&apos;lov skrinshoti</label>
            <input type="file" accept="image/*" onChange={(e) => pick(e.target.files?.[0] ?? null)} className="w-full text-xs mt-1" />
            {preview && <img src={preview} alt="" className="mt-2 max-h-40 rounded-lg border border-slate-200" />}
          </>
        )}

        {err && <p className="text-xs text-red-600 mt-2">❌ {err}</p>}

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="h-9 px-4 rounded-lg bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200">Bekor</button>
          <button disabled={busy} onClick={submit} className="h-9 px-4 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
            {busy ? "Bajarilmoqda…" : "Tasdiqlash va qaytarish"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
