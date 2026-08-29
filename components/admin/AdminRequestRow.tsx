"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import type { RequestView } from "@/lib/firestore/requests";
import {
  REQUEST_STATUS_META,
  REQUEST_TYPE_LABEL,
  requestStatusLabel,
  requestNextStatus,
  isRequestActive,
  isRequestPreWork,
} from "@/lib/request-status";
import { SERVICE_SHORT, formatDate } from "@/lib/labels";
import { actSetRequestStatus, actSetRequestNote, actDeleteRequest, actConfirmRequestPayment, actRejectRequest } from "@/app/admin/actions";

const IS_DEV = process.env.NODE_ENV === "development";

const DATA_LABELS: Record<string, string> = {
  developerAccountId: "Developer Account ID",
  googlePaymentsProfileId: "Payments Profile ID",
  transactionId: "Transaction ID",
  appStoreConnectTeamId: "App Store Connect Team ID",
  appleDevAccountEmail: "Apple Dev email",
  releaseNotes: "Relizdagi o'zgarishlar",
  months: "Muddat (oy)",
  note: "Izoh (mijoz)",
};

const TYPE_COLOR: Record<string, string> = {
  transfer: "bg-violet-100 text-violet-700",
  update: "bg-blue-100 text-blue-700",
  subscription_renewal: "bg-teal-100 text-teal-700",
  push_certificate: "bg-sky-100 text-sky-700",
};

function NoteDialog({
  initial,
  saving,
  onSave,
  onClose,
}: {
  initial: string;
  saving: boolean;
  onSave: (v: string) => void;
  onClose: () => void;
}) {
  const [val, setVal] = useState(initial);
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-bold text-slate-900 mb-3">Izoh (admin uchun)</h3>
        <textarea
          autoFocus
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="Izoh yozing…"
          rows={4}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
        />
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="h-9 px-4 rounded-lg bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200">
            Bekor
          </button>
          <button
            disabled={saving}
            onClick={() => onSave(val)}
            className="h-9 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saqlanmoqda…" : "Saqlash"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function ReceiptUrlDialog({
  usd,
  uzs,
  saving,
  onConfirm,
  onClose,
}: {
  usd: number;
  uzs: number | null;
  saving: boolean;
  onConfirm: (url: string, actualPaidUzs: number) => void;
  onClose: () => void;
}) {
  const [url, setUrl] = useState("");
  const [paid, setPaid] = useState(uzs ? String(uzs) : "");
  const paidNum = Math.round(Number(paid) || 0);
  const overpay = uzs != null ? paidNum - uzs : 0;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-bold text-slate-900 mb-1">To&apos;lovni tasdiqlash</h3>
        <p className="text-xs text-slate-500 mb-3">
          So&apos;rov summasi: <span className="font-semibold text-slate-800">${usd}</span>
          {uzs ? <span className="text-slate-500"> (~{uzs.toLocaleString("en-US")} so&apos;m)</span> : null}
        </p>

        <label className="block text-xs font-medium text-slate-600 mb-1">Mijoz aslida qancha to&apos;ladi? (so&apos;m)</label>
        <input
          autoFocus
          type="number"
          inputMode="numeric"
          value={paid}
          onChange={(e) => setPaid(e.target.value)}
          placeholder="masalan 13000"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
        />
        {overpay > 0 && <p className="text-xs font-semibold text-emerald-600 mt-1.5">🪙 Ortiqcha +{overpay.toLocaleString("en-US")} so&apos;m hamyonga tushadi</p>}

        <label className="block text-xs font-medium text-slate-600 mb-1 mt-3">Soliq cheki havolasi (URL)</label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
        />
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="h-9 px-4 rounded-lg bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200">
            Bekor
          </button>
          <button
            disabled={saving || paidNum <= 0}
            onClick={() => onConfirm(url, paidNum)}
            className="h-9 px-4 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? "Tasdiqlanmoqda…" : "Tasdiqlash"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function RejectCompensationDialog({
  requestId,
  totalUsd,
  totalUzs,
  cancelFeePct,
  onClose,
  onDone,
}: {
  requestId: string;
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

  const commissionOn = initiator === "user" && hold;
  const keptUsd = commissionOn ? Math.round((totalUsd * cancelFeePct) / 100) : 0;
  const refundUsd = Math.max(0, totalUsd - keptUsd);
  const rate = totalUsd > 0 && totalUzs ? totalUzs / totalUsd : 0;
  const refundUzs = rate ? Math.round(refundUsd * rate) : 0;
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
      fd.append("requestId", requestId);
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
        <h3 className="text-sm font-bold text-slate-900 mb-1">So&apos;rovni bekor qilish</h3>
        <p className="text-xs text-slate-500 mb-3">To&apos;langan: <strong>${totalUsd}</strong>{totalUzs ? ` · ~${totalUzs.toLocaleString("en-US")} so'm` : ""}</p>

        {/* Kim tashabbusi bilan */}
        <label className="text-xs text-slate-500">Bekor qilish tashabbusi</label>
        <div className="grid grid-cols-2 gap-2 mt-1 mb-3">
          <button
            onClick={() => setInitiator("user")}
            className={`h-9 rounded-lg text-xs font-semibold border ${initiator === "user" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200"}`}
          >
            Mijoz so&apos;rovi bilan
          </button>
          <button
            onClick={() => setInitiator("umd")}
            className={`h-9 rounded-lg text-xs font-semibold border ${initiator === "umd" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200"}`}
          >
            Biz (UMD) bekor qilyapmiz
          </button>
        </div>

        {/* Komissiya (faqat mijoz so'rovida) */}
        {initiator === "user" && (
          <label className="flex items-center gap-2 mb-3 text-sm text-slate-700">
            <input type="checkbox" checked={hold} onChange={(e) => setHold(e.target.checked)} className="w-4 h-4" />
            Komissiya ushlansin ({cancelFeePct}% = ${Math.round((totalUsd * cancelFeePct) / 100)})
          </label>
        )}

        {/* Xulosa */}
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 mb-3 text-sm">
          {keptUsd > 0 && <p className="text-slate-700">🧾 Komissiya (daromadда qoladi): <strong>${keptUsd}</strong></p>}
          <p className="text-emerald-700 font-semibold mt-0.5">↩️ Mijozga qaytariladi: ${refundUsd}{refundUzs ? ` · ~${refundUzs.toLocaleString("en-US")} so'm` : ""}</p>
        </div>

        {/* Karta + skrinshot (qaytarish bo'lsa) */}
        {needProof && (
          <>
            <label className="text-xs text-slate-500">Pul qaytarilgan karta raqami</label>
            <input
              value={card}
              onChange={(e) => setCard(e.target.value)}
              placeholder="8600 1234 5678 9012"
              className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm mt-1 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
            <label className="text-xs text-slate-500">To&apos;lov skrinshoti</label>
            <input type="file" accept="image/*" onChange={(e) => pick(e.target.files?.[0] ?? null)} className="w-full text-xs mt-1" />
            {preview && <img src={preview} alt="" className="mt-2 max-h-40 rounded-lg border border-slate-200" />}
          </>
        )}

        {err && <p className="text-xs text-red-600 mt-2">❌ {err}</p>}

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="h-9 px-4 rounded-lg bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200">Bekor</button>
          <button
            disabled={busy}
            onClick={submit}
            className="h-9 px-4 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
          >
            {busy ? "Bajarilmoqda…" : "Tasdiqlash va qaytarish"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function AdminRequestRow({ request, cancelFeePct = 20 }: { request: RequestView; cancelFeePct?: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [note, setNote] = useState(request.note);
  const [noteOpen, setNoteOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  // To'lov qilinganmi (confirmed) — rad etishda kompensatsiya so'raladi
  const paidConfirmed = request.payment?.installments?.full?.state === "confirmed";

  // To'lov-oldi bosqich + chek yuborilgan bo'lsa: keyingi bosqich = to'lovni tasdiqlash (soliq URL bilan)
  const isPaymentConfirm = isRequestPreWork(request.status) && request.receiptSent;

  const meta = REQUEST_STATUS_META[request.status];
  const next = requestNextStatus(request.type, request.status);
  const active = isRequestActive(request.status);
  const title = request.appName || SERVICE_SHORT[request.serviceType];
  const entries = Object.entries(request.data).filter(([, v]) => v && String(v).trim() !== "");
  const typeColor = TYPE_COLOR[request.type] ?? "bg-slate-100 text-slate-700";

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 flex flex-col gap-2">
      {/* Yuqori: tur + ilova | status */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`inline-flex flex-shrink-0 items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${typeColor}`}>
              {REQUEST_TYPE_LABEL[request.type]}
            </span>
            <p className="font-semibold text-slate-900 text-sm truncate">{title}</p>
          </div>
          <p className="text-xs text-slate-500 truncate mt-1">
            {request.ownerName} · {request.ownerPhone}
          </p>
        </div>
        <div className="flex flex-col items-end flex-shrink-0">
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 ${meta.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
            {requestStatusLabel(request.type, request.status)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1">{formatDate(request.createdAt)}</span>
        </div>
      </div>

      {/* Summa */}
      <div className="flex items-center gap-2 text-xs">
        <span className="font-semibold text-slate-900">${request.amountUsd}</span>
        {request.amountUzs ? <span className="text-slate-400">~{request.amountUzs.toLocaleString("en-US")} so&apos;m</span> : null}
        {isRequestPreWork(request.status) && (
          <span className={request.receiptSent ? "text-emerald-600" : "text-amber-600"}>
            · Chek: {request.receiptSent ? "✓" : "kutilmoqda"}
          </span>
        )}
      </div>

      {/* Ma'lumotlar (doim ko'rinadi) */}
      {entries.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1.5 bg-slate-50 rounded-lg p-3">
          {entries.map(([k, v]) => (
            <div key={k} className="min-w-0">
              <p className="text-[10px] text-slate-400">{DATA_LABELS[k] ?? k}</p>
              <p className="text-sm text-slate-800 break-words">{v}</p>
            </div>
          ))}
        </div>
      )}

      {/* Izoh (mavjud bo'lsa) */}
      {note && (
        <p className="text-xs text-slate-600 bg-slate-50 rounded-lg px-2.5 py-1.5">
          <span className="text-slate-400">Izoh: </span>{note}
        </p>
      )}

      {/* Amallar */}
      <div className="flex items-center gap-2 flex-wrap">
        {next && isPaymentConfirm && (
          <button
            disabled={pending}
            onClick={() => setPayOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
          >
            To&apos;lovni tasdiqlash → soliq cheki
          </button>
        )}
        {next && !isPaymentConfirm && (
          <button
            disabled={pending}
            onClick={() => start(() => actSetRequestStatus(request.id, next))}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white ${meta.dot} hover:opacity-90 disabled:opacity-50`}
          >
            {requestStatusLabel(request.type, next)} ga o&apos;tkazish →
          </button>
        )}
        {active && (
          <>
            <button
              disabled={pending}
              onClick={() => {
                if (paidConfirmed) setRejectOpen(true);
                else start(() => { void actRejectRequest(request.id, 0); });
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
            >
              Rad etish
            </button>
            {!paidConfirmed && (
              <button
                disabled={pending}
                onClick={() => start(() => { void actRejectRequest(request.id, 0, "cancelled"); })}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:opacity-50"
              >
                Bekor qilish
              </button>
            )}
          </>
        )}
        <button
          onClick={() => setNoteOpen(true)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200"
        >
          {note ? "Izohni tahrirlash" : "Izoh qo'shish"}
        </button>
        <div className="flex-1" />
        {IS_DEV && (
          <button
            disabled={pending}
            onClick={() => { if (confirm("Bu so'rovni o'chirasizmi?")) start(() => actDeleteRequest(request.id)); }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
          >
            O&apos;chirish
          </button>
        )}
      </div>

      {payOpen && (
        <ReceiptUrlDialog
          usd={request.amountUsd}
          uzs={request.amountUzs}
          saving={pending}
          onClose={() => setPayOpen(false)}
          onConfirm={(url, actualPaidUzs) =>
            start(async () => {
              await actConfirmRequestPayment(request.id, url || undefined, actualPaidUzs);
              setPayOpen(false);
            })
          }
        />
      )}

      {rejectOpen && (
        <RejectCompensationDialog
          requestId={request.id}
          totalUsd={request.amountUsd}
          totalUzs={request.amountUzs}
          cancelFeePct={cancelFeePct}
          onClose={() => setRejectOpen(false)}
          onDone={() => { setRejectOpen(false); router.refresh(); }}
        />
      )}

      {noteOpen && (
        <NoteDialog
          initial={note}
          saving={pending}
          onClose={() => setNoteOpen(false)}
          onSave={(v) =>
            start(async () => {
              await actSetRequestNote(request.id, v);
              setNote(v);
              setNoteOpen(false);
            })
          }
        />
      )}
    </div>
  );
}
