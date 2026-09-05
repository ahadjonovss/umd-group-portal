"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RECURRING_START_LABEL, type CatalogService, type RecurringStart } from "@/lib/service-def";
import { actAssignService } from "@/app/admin/actions";

const field =
  "h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500";

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-slate-400">{hint}</span>}
    </label>
  );
}

// Adminning foydalanuvchiga maxsus xizmat biriktirish formasi.
// Narx/davr shu mijoz uchun o'zgartirilishi mumkin — kelishilgan shartlar
// arizaga nusxalanadi va katalog keyin o'zgarsa ham o'zgarmaydi.
export function AssignServiceForm({ uid, catalog }: { uid: string; catalog: CatalogService[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [catalogId, setCatalogId] = useState("");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Override qiymatlari (bo'sh = katalogdagidek)
  const [oneTimeUsd, setOneTimeUsd] = useState("");
  const [advancePercent, setAdvancePercent] = useState("");
  const [recurringOn, setRecurringOn] = useState<boolean | null>(null);
  const [recurringUsd, setRecurringUsd] = useState("");
  const [periodMonths, setPeriodMonths] = useState("");
  const [startsWhen, setStartsWhen] = useState<RecurringStart | "">("");
  const [etaDays, setEtaDays] = useState("");

  const svc = useMemo(() => catalog.find((c) => c.id === catalogId) ?? null, [catalog, catalogId]);

  function pick(id: string) {
    setCatalogId(id);
    const c = catalog.find((x) => x.id === id);
    setMsg(null);
    if (!c) return;
    if (!title.trim()) setTitle(c.name);
    setOneTimeUsd(c.pricing.oneTime.enabled ? String(c.pricing.oneTime.amountUsd) : "0");
    setAdvancePercent(String(c.pricing.oneTime.advancePercent));
    setRecurringOn(c.pricing.recurring.enabled);
    setRecurringUsd(String(c.pricing.recurring.amountUsd));
    setPeriodMonths(String(c.pricing.recurring.periodMonths));
    setStartsWhen(c.pricing.recurring.startsWhen);
    setEtaDays(String(c.etaDays));
  }

  function submit() {
    setMsg(null);
    start(async () => {
      const r = await actAssignService({
        catalogId,
        ownerUid: uid,
        title,
        note,
        oneTimeUsd: oneTimeUsd === "" ? null : parseFloat(oneTimeUsd) || 0,
        advancePercent: advancePercent === "" ? null : parseInt(advancePercent) || 0,
        recurringEnabled: recurringOn,
        recurringUsd: recurringUsd === "" ? null : parseFloat(recurringUsd) || 0,
        periodMonths: periodMonths === "" ? null : parseInt(periodMonths) || 1,
        startsWhen: startsWhen || null,
        etaDays: etaDays === "" ? null : parseInt(etaDays) || 0,
      });
      if (r.ok) {
        setMsg({ ok: true, text: "Xizmat biriktirildi — mijoz kabinetida ko'rinadi" });
        setCatalogId("");
        setTitle("");
        setNote("");
        setOpen(false);
        router.refresh();
      } else {
        setMsg({ ok: false, text: r.error || "Xatolik" });
      }
    });
  }

  const advPct = parseInt(advancePercent) || 0;
  const oneTime = parseFloat(oneTimeUsd) || 0;
  const advAmt = Math.round((oneTime * advPct) / 100);
  const finAmt = Math.round(oneTime - advAmt);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900 text-sm">Maxsus xizmat biriktirish</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Katalogdagi xizmatni shu foydalanuvchiga o&apos;z narxi bilan biriktiring</p>
        </div>
        {!open && (
          <button
            onClick={() => setOpen(true)}
            disabled={!catalog.length}
            className="h-9 px-4 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-40 flex-shrink-0"
          >
            + Biriktirish
          </button>
        )}
      </div>

      {!catalog.length && (
        <p className="text-xs text-amber-600 mt-3">
          Katalogda faol xizmat yo&apos;q. Avval Admin → <strong>Xizmatlar</strong> bo&apos;limida xizmat yarating.
        </p>
      )}

      {open && (
        <div className="mt-4 flex flex-col gap-3">
          <Row label="Xizmat">
            <select value={catalogId} onChange={(e) => pick(e.target.value)} className={field}>
              <option value="">— tanlang —</option>
              {catalog.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </Row>

          {svc && (
            <>
              <Row label="Ariza nomi" hint="Mijoz kabinetida shu nom ko'rinadi">
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="masalan: Alif Promoter mobil ilova" className={field} />
              </Row>

              <div className="grid sm:grid-cols-3 gap-3">
                <Row label="Bir martalik ish to'lovi ($)">
                  <input type="number" min={0} value={oneTimeUsd} onChange={(e) => setOneTimeUsd(e.target.value)} className={field} />
                </Row>
                <Row label="Avans (%)">
                  <input type="number" min={0} max={100} value={advancePercent} onChange={(e) => setAdvancePercent(e.target.value)} className={field} />
                </Row>
                <Row label="Muddat (ish kuni)">
                  <input type="number" min={0} value={etaDays} onChange={(e) => setEtaDays(e.target.value)} className={field} />
                </Row>
              </div>

              {oneTime > 0 && (
                <p className="text-[11px] text-slate-500 -mt-1">
                  Avans <strong>${advAmt}</strong>
                  {finAmt > 0 ? <> · yakuniy <strong>${finAmt}</strong> (ish topshirilgach)</> : <> · yakuniy to&apos;lov yo&apos;q</>}
                </p>
              )}

              <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={recurringOn ?? false} onChange={(e) => setRecurringOn(e.target.checked)} className="w-4 h-4" />
                Davriy to&apos;lov olinadi
              </label>

              {recurringOn && (
                <div className="grid sm:grid-cols-3 gap-3">
                  <Row label="Summa ($)">
                    <input type="number" min={0} value={recurringUsd} onChange={(e) => setRecurringUsd(e.target.value)} className={field} />
                  </Row>
                  <Row label="Davr (oy)">
                    <input type="number" min={1} max={24} value={periodMonths} onChange={(e) => setPeriodMonths(e.target.value)} className={field} />
                  </Row>
                  <Row label="Qachondan">
                    <select value={startsWhen} onChange={(e) => setStartsWhen(e.target.value as RecurringStart)} className={field}>
                      {(Object.keys(RECURRING_START_LABEL) as RecurringStart[]).map((k) => (
                        <option key={k} value={k}>{RECURRING_START_LABEL[k]}</option>
                      ))}
                    </select>
                  </Row>
                </div>
              )}

              <Row label="Izoh (ixtiyoriy)">
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ichki izoh yoki kelishuv sharti" className={field} />
              </Row>
            </>
          )}

          <div className="flex items-center gap-3 mt-1">
            <button
              onClick={submit}
              disabled={pending || !catalogId || !title.trim()}
              className="h-9 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {pending ? "Biriktirilmoqda…" : "Biriktirish"}
            </button>
            <button onClick={() => setOpen(false)} className="h-9 px-3 rounded-lg bg-slate-100 text-sm font-medium text-slate-600 hover:bg-slate-200">
              Bekor qilish
            </button>
          </div>
        </div>
      )}

      {msg && <p className={`text-xs mt-3 ${msg.ok ? "text-emerald-600" : "text-red-600"}`}>{msg.ok ? "✓ " : "❌ "}{msg.text}</p>}
    </div>
  );
}
