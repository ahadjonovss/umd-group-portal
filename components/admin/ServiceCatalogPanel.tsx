"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CUSTOM_STAGE_KEYS,
  DEFAULT_FLOW,
  DEFAULT_ONE_TIME,
  DEFAULT_RECURRING,
  FIELD_TYPE_LABEL,
  RECURRING_START_LABEL,
  THEME_KEYS,
  THEME_LABEL,
  type CatalogService,
  type FieldType,
  type FlowStep,
  type RecurringStart,
  type ServiceField,
  type ThemeKey,
} from "@/lib/service-def";
import { actSaveCatalogService, actSetCatalogActive, actDeleteCatalogService } from "@/app/admin/actions";

const field =
  "h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500";
const area =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500";

const THEME_DOT: Record<ThemeKey, string> = {
  slate: "bg-slate-500",
  blue: "bg-blue-500",
  emerald: "bg-emerald-500",
  orange: "bg-orange-500",
  purple: "bg-purple-500",
  teal: "bg-teal-500",
  cyan: "bg-cyan-500",
  indigo: "bg-indigo-500",
  rose: "bg-rose-500",
  amber: "bg-amber-500",
};

// Bo'sh (yangi) xizmat shabloni — client tomonda.
function emptyDraft(): Draft {
  return {
    id: null,
    name: "",
    shortName: "",
    key: "",
    description: "",
    icon: "🚀",
    theme: "purple",
    scope: "assigned",
    active: true,
    etaDays: 0,
    flow: DEFAULT_FLOW.map((s) => ({ ...s })),
    workStartKey: "stage1",
    oneTime: { ...DEFAULT_ONE_TIME },
    recurring: { ...DEFAULT_RECURRING },
    fields: [],
    terms: "",
  };
}

interface Draft {
  id: string | null;
  name: string;
  shortName: string;
  key: string;
  description: string;
  icon: string;
  theme: ThemeKey;
  scope: "assigned" | "public";
  active: boolean;
  etaDays: number;
  flow: FlowStep[];
  workStartKey: string;
  oneTime: { enabled: boolean; amountUsd: number; advancePercent: number; cancelFeePercent: number };
  recurring: {
    enabled: boolean;
    amountUsd: number;
    periodMonths: number;
    startsWhen: RecurringStart;
    firstPeriodFree: boolean;
    graceDays: number;
  };
  fields: ServiceField[];
  terms: string;
}

function toDraft(c: CatalogService): Draft {
  return {
    id: c.id,
    name: c.name,
    shortName: c.shortName,
    key: c.key,
    description: c.description,
    icon: c.icon,
    theme: c.theme,
    scope: c.scope,
    active: c.active,
    etaDays: c.etaDays,
    flow: c.flow.map((s) => ({ ...s })),
    workStartKey: c.workStartKey,
    oneTime: { ...c.pricing.oneTime },
    recurring: { ...c.pricing.recurring },
    fields: c.fields.map((f) => ({ ...f })),
    terms: c.terms,
  };
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-slate-400">{hint}</span>}
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">{title}</h4>
      {children}
    </div>
  );
}

export function ServiceCatalogPanel({ items }: { items: CatalogService[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));

  // ── Oqim bosqichlari ──
  function addStage() {
    if (!draft) return;
    const used = new Set(draft.flow.map((s) => s.key));
    const free = CUSTOM_STAGE_KEYS.find((k) => !used.has(k));
    if (!free) return;
    // Yangi bosqich oxirgi (completed) dan oldin qo'shiladi
    const flow = [...draft.flow];
    const lastIdx = flow.length - 1;
    flow.splice(lastIdx, 0, { key: free, label: "Yangi bosqich", desc: "" });
    set("flow", flow);
  }

  function removeStage(i: number) {
    if (!draft || draft.flow.length <= 2) return;
    const flow = draft.flow.filter((_, idx) => idx !== i);
    const workOk = flow.some((s) => s.key === draft.workStartKey);
    setDraft({ ...draft, flow, workStartKey: workOk ? draft.workStartKey : flow[1]?.key ?? flow[0].key });
  }

  function moveStage(i: number, dir: -1 | 1) {
    if (!draft) return;
    const j = i + dir;
    // Birinchi va oxirgi bosqich joyida qoladi
    if (i === 0 || i === draft.flow.length - 1) return;
    if (j <= 0 || j >= draft.flow.length - 1) return;
    const flow = [...draft.flow];
    [flow[i], flow[j]] = [flow[j], flow[i]];
    set("flow", flow);
  }

  function setStage(i: number, patch: Partial<FlowStep>) {
    if (!draft) return;
    const flow = draft.flow.map((s, idx) => (idx === i ? { ...s, ...patch } : s));
    set("flow", flow);
  }

  // ── Forma maydonlari ──
  function addField() {
    if (!draft) return;
    set("fields", [...draft.fields, { key: `field${draft.fields.length + 1}`, label: "", type: "text", required: false, placeholder: "", options: [] }]);
  }
  function setField(i: number, patch: Partial<ServiceField>) {
    if (!draft) return;
    set("fields", draft.fields.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  }
  function removeField(i: number) {
    if (!draft) return;
    set("fields", draft.fields.filter((_, idx) => idx !== i));
  }

  function save() {
    if (!draft) return;
    setMsg(null);
    start(async () => {
      const r = await actSaveCatalogService(draft.id, {
        key: draft.key || draft.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        name: draft.name.trim(),
        shortName: draft.shortName.trim() || draft.name.trim(),
        description: draft.description,
        icon: draft.icon || "🚀",
        theme: draft.theme,
        scope: draft.scope,
        active: draft.active,
        etaDays: draft.etaDays,
        flow: draft.flow,
        workStartKey: draft.workStartKey,
        pricing: { oneTime: draft.oneTime, recurring: draft.recurring },
        fields: draft.fields,
        terms: draft.terms,
      });
      if (r.ok) {
        setMsg({ ok: true, text: "Saqlandi" });
        setDraft(null);
        router.refresh();
      } else {
        setMsg({ ok: false, text: r.error || "Xatolik" });
      }
    });
  }

  function toggleActive(c: CatalogService) {
    start(async () => {
      await actSetCatalogActive(c.id, !c.active);
      router.refresh();
    });
  }

  function remove(c: CatalogService) {
    if (!confirm(`"${c.name}" xizmatini katalogdan o'chirasizmi?\n\nBiriktirilgan arizalar o'chmaydi — ular o'z shartlari bilan ishlashda davom etadi.`)) return;
    start(async () => {
      await actDeleteCatalogService(c.id);
      router.refresh();
    });
  }

  // ══ Editor ══
  if (draft) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">{draft.id ? "Xizmatni tahrirlash" : "Yangi xizmat"}</h3>
          <button onClick={() => setDraft(null)} className="text-sm text-slate-500 hover:text-slate-700">
            ← Ro&apos;yxatga qaytish
          </button>
        </div>

        <Section title="Asosiy">
          <div className="grid sm:grid-cols-2 gap-3">
            <Row label="Xizmat nomi">
              <input value={draft.name} onChange={(e) => set("name", e.target.value)} placeholder="masalan: Loyiha ishlab chiqish" className={field} />
            </Row>
            <Row label="Qisqa nom" hint="Chiplarda va ro'yxatlarda ko'rinadi">
              <input value={draft.shortName} onChange={(e) => set("shortName", e.target.value)} placeholder="Loyiha" className={field} />
            </Row>
            <Row label="Ikona (emoji)">
              <input value={draft.icon} onChange={(e) => set("icon", e.target.value.slice(0, 4))} className={field} />
            </Row>
            <Row label="Rang">
              <select value={draft.theme} onChange={(e) => set("theme", e.target.value as ThemeKey)} className={field}>
                {THEME_KEYS.map((t) => (
                  <option key={t} value={t}>{THEME_LABEL[t]}</option>
                ))}
              </select>
            </Row>
            <Row label="Taxminiy muddat (ish kuni)" hint="0 = ko'rsatilmaydi">
              <input type="number" min={0} value={draft.etaDays} onChange={(e) => set("etaDays", parseInt(e.target.value) || 0)} className={field} />
            </Row>
            <Row label="Ko'rinish">
              <select value={draft.scope} onChange={(e) => set("scope", e.target.value as "assigned" | "public")} className={field}>
                <option value="assigned">Faqat admin biriktiradi</option>
                <option value="public">Ochiq — mijoz o&apos;zi buyurtma qiladi</option>
              </select>
            </Row>
          </div>
          <div className="mt-3">
            <Row label="Tavsif">
              <textarea rows={2} value={draft.description} onChange={(e) => set("description", e.target.value)} className={area} />
            </Row>
          </div>
          <label className="mt-3 inline-flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={draft.active} onChange={(e) => set("active", e.target.checked)} className="w-4 h-4" />
            Faol (biriktirish uchun mavjud)
          </label>
        </Section>

        <Section title="Bir martalik to'lov">
          <label className="inline-flex items-center gap-2 text-sm text-slate-600 mb-3">
            <input
              type="checkbox"
              checked={draft.oneTime.enabled}
              onChange={(e) => set("oneTime", { ...draft.oneTime, enabled: e.target.checked })}
              className="w-4 h-4"
            />
            Bir martalik ish to&apos;lovi olinadi
          </label>
          {draft.oneTime.enabled && (
            <div className="grid sm:grid-cols-2 gap-3">
              <Row label="Narx ($)" hint="Biriktirishda har mijoz uchun o'zgartirsa bo'ladi">
                <input
                  type="number" min={0}
                  value={draft.oneTime.amountUsd}
                  onChange={(e) => set("oneTime", { ...draft.oneTime, amountUsd: parseFloat(e.target.value) || 0 })}
                  className={field}
                />
              </Row>
              <Row label="Avans (%)" hint="100 = to'liq oldindan, yakuniy to'lov bo'lmaydi">
                <input
                  type="number" min={0} max={100}
                  value={draft.oneTime.advancePercent}
                  onChange={(e) => set("oneTime", { ...draft.oneTime, advancePercent: parseInt(e.target.value) || 0 })}
                  className={field}
                />
              </Row>
              <Row label="Bekor qilish komissiyasi (%)" hint="Mijoz voz kechsa to'langan summadan ushlab qolinadi">
                <input
                  type="number" min={0} max={100}
                  value={draft.oneTime.cancelFeePercent}
                  onChange={(e) => set("oneTime", { ...draft.oneTime, cancelFeePercent: parseInt(e.target.value) || 0 })}
                  className={field}
                />
              </Row>
            </div>
          )}
        </Section>

        <Section title="Davriy (oylik) to'lov">
          <label className="inline-flex items-center gap-2 text-sm text-slate-600 mb-3">
            <input
              type="checkbox"
              checked={draft.recurring.enabled}
              onChange={(e) => set("recurring", { ...draft.recurring, enabled: e.target.checked })}
              className="w-4 h-4"
            />
            Davriy to&apos;lov olinadi
          </label>
          {draft.recurring.enabled && (
            <div className="grid sm:grid-cols-2 gap-3">
              <Row label="Summa ($)">
                <input
                  type="number" min={0}
                  value={draft.recurring.amountUsd}
                  onChange={(e) => set("recurring", { ...draft.recurring, amountUsd: parseFloat(e.target.value) || 0 })}
                  className={field}
                />
              </Row>
              <Row label="Davr (oy)" hint="1 = oylik, 3 = choraklik, 12 = yillik">
                <input
                  type="number" min={1} max={24}
                  value={draft.recurring.periodMonths}
                  onChange={(e) => set("recurring", { ...draft.recurring, periodMonths: parseInt(e.target.value) || 1 })}
                  className={field}
                />
              </Row>
              <Row label="Qachondan boshlanadi">
                <select
                  value={draft.recurring.startsWhen}
                  onChange={(e) => set("recurring", { ...draft.recurring, startsWhen: e.target.value as RecurringStart })}
                  className={field}
                >
                  {(Object.keys(RECURRING_START_LABEL) as RecurringStart[]).map((k) => (
                    <option key={k} value={k}>{RECURRING_START_LABEL[k]}</option>
                  ))}
                </select>
              </Row>
              <Row label="Muhlat (kun)" hint="Shu kundan keyin 'qarzdor' belgisi + eslatmalar">
                <input
                  type="number" min={0} max={90}
                  value={draft.recurring.graceDays}
                  onChange={(e) => set("recurring", { ...draft.recurring, graceDays: parseInt(e.target.value) || 0 })}
                  className={field}
                />
              </Row>
              <label className="inline-flex items-center gap-2 text-sm text-slate-600 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={draft.recurring.firstPeriodFree}
                  onChange={(e) => set("recurring", { ...draft.recurring, firstPeriodFree: e.target.checked })}
                  className="w-4 h-4"
                />
                Birinchi davr bepul (birinchi hisob keyingi davr boshida chiqadi)
              </label>
            </div>
          )}
        </Section>

        <Section title="Bosqichlar (oqim)">
          <div className="flex flex-col gap-2">
            {draft.flow.map((s, i) => {
              const fixed = i === 0 || i === draft.flow.length - 1;
              return (
                <div key={`${s.key}-${i}`} className="flex items-start gap-2 rounded-lg bg-slate-50 p-2.5">
                  <span className="mt-2 w-6 h-6 flex-shrink-0 rounded-full bg-white ring-1 ring-slate-200 text-[11px] font-semibold text-slate-500 flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div className="flex-1 grid sm:grid-cols-2 gap-2">
                    <input value={s.label} onChange={(e) => setStage(i, { label: e.target.value })} placeholder="Bosqich nomi" className={field} />
                    <input value={s.desc} onChange={(e) => setStage(i, { desc: e.target.value })} placeholder="Mijozga tushuntirish (ixtiyoriy)" className={field} />
                  </div>
                  <div className="flex flex-col gap-1 pt-0.5">
                    {!fixed && (
                      <>
                        <button onClick={() => moveStage(i, -1)} className="w-6 h-6 rounded bg-white ring-1 ring-slate-200 text-xs text-slate-500 hover:bg-slate-100">↑</button>
                        <button onClick={() => moveStage(i, 1)} className="w-6 h-6 rounded bg-white ring-1 ring-slate-200 text-xs text-slate-500 hover:bg-slate-100">↓</button>
                        <button onClick={() => removeStage(i)} className="w-6 h-6 rounded bg-white ring-1 ring-red-200 text-xs text-red-500 hover:bg-red-50">×</button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap items-end gap-3 mt-3">
            <button
              onClick={addStage}
              disabled={draft.flow.length >= CUSTOM_STAGE_KEYS.length + 2}
              className="h-9 px-3 rounded-lg bg-slate-100 text-sm font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-40"
            >
              + Bosqich qo&apos;shish
            </button>
            <div className="flex-1 min-w-[220px]">
              <Row label="Avans to'langach qaysi bosqichga o'tadi">
                <select value={draft.workStartKey} onChange={(e) => set("workStartKey", e.target.value)} className={field}>
                  {draft.flow.slice(1).map((s, i) => (
                    <option key={`${s.key}-${i}`} value={s.key}>{s.label}</option>
                  ))}
                </select>
              </Row>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Birinchi va oxirgi bosqich o&apos;zgarmaydi: birinchisi — ariza qabul qilinishi, oxirgisi — yakunlanishi.
            Rad etish / bekor qilish har doim mavjud.
          </p>
        </Section>

        <Section title="Ariza formasi (ochiq xizmatlar uchun)">
          {draft.fields.length === 0 && (
            <p className="text-xs text-slate-400 mb-3">Maydon qo&apos;shilmagan — mijoz faqat izoh yozadi.</p>
          )}
          <div className="flex flex-col gap-2">
            {draft.fields.map((f, i) => (
              <div key={i} className="grid sm:grid-cols-[1fr_1fr_130px_auto] gap-2 items-center rounded-lg bg-slate-50 p-2.5">
                <input value={f.label} onChange={(e) => setField(i, { label: e.target.value })} placeholder="Maydon nomi" className={field} />
                <input value={f.key} onChange={(e) => setField(i, { key: e.target.value.replace(/[^a-zA-Z0-9_]/g, "") })} placeholder="kalit (lotin)" className={field} />
                <select value={f.type} onChange={(e) => setField(i, { type: e.target.value as FieldType })} className={field}>
                  {(Object.keys(FIELD_TYPE_LABEL) as FieldType[]).map((t) => (
                    <option key={t} value={t}>{FIELD_TYPE_LABEL[t]}</option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                    <input type="checkbox" checked={f.required} onChange={(e) => setField(i, { required: e.target.checked })} className="w-3.5 h-3.5" />
                    majburiy
                  </label>
                  <button onClick={() => removeField(i)} className="w-6 h-6 rounded bg-white ring-1 ring-red-200 text-xs text-red-500 hover:bg-red-50">×</button>
                </div>
                {f.type === "select" && (
                  <input
                    value={f.options.join(", ")}
                    onChange={(e) => setField(i, { options: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })}
                    placeholder="Variantlar: birinchi, ikkinchi, uchinchi"
                    className={`${field} sm:col-span-4`}
                  />
                )}
              </div>
            ))}
          </div>
          <button onClick={addField} className="mt-3 h-9 px-3 rounded-lg bg-slate-100 text-sm font-medium text-slate-700 hover:bg-slate-200">
            + Maydon qo&apos;shish
          </button>
        </Section>

        <Section title="Shartlar (ixtiyoriy)">
          <textarea rows={4} value={draft.terms} onChange={(e) => set("terms", e.target.value)} placeholder="Mijozga ko'rsatiladigan shartlar matni" className={area} />
        </Section>

        <div className="flex items-center gap-3">
          <button
            onClick={save}
            disabled={pending || !draft.name.trim()}
            className="h-10 px-5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {pending ? "Saqlanmoqda…" : "Saqlash"}
          </button>
          <button onClick={() => setDraft(null)} className="h-10 px-4 rounded-lg bg-slate-100 text-sm font-medium text-slate-600 hover:bg-slate-200">
            Bekor qilish
          </button>
          {msg && <span className={`text-xs ${msg.ok ? "text-emerald-600" : "text-red-600"}`}>{msg.ok ? "✓ " : "❌ "}{msg.text}</span>}
        </div>
      </div>
    );
  }

  // ══ Ro'yxat ══
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900">Maxsus xizmatlar katalogi</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Bu yerda yaratilgan xizmatni istalgan foydalanuvchiga biriktirasiz — narx, bosqichlar va oylik to&apos;lov o&apos;zingiz belgilaysiz.
          </p>
        </div>
        <button
          onClick={() => setDraft(emptyDraft())}
          className="h-9 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 flex-shrink-0"
        >
          + Yangi xizmat
        </button>
      </div>

      {msg && <span className={`text-xs ${msg.ok ? "text-emerald-600" : "text-red-600"}`}>{msg.ok ? "✓ " : "❌ "}{msg.text}</span>}

      {!items.length ? (
        <p className="text-sm text-slate-400 py-10 text-center">Hali xizmat qo&apos;shilmagan.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((c) => (
            <div key={c.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5">
              <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${c.active ? "bg-slate-50" : "bg-slate-100 opacity-50"}`}>
                {c.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-900 text-sm truncate">{c.name}</p>
                  <span className={`w-1.5 h-1.5 rounded-full ${THEME_DOT[c.theme]}`} />
                  {!c.active && <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">nofaol</span>}
                  {c.scope === "public" && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">ochiq</span>}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {c.pricing.oneTime.enabled ? `$${c.pricing.oneTime.amountUsd} (avans ${c.pricing.oneTime.advancePercent}%)` : "Bir martalik yo'q"}
                  {c.pricing.recurring.enabled && ` · $${c.pricing.recurring.amountUsd}/${c.pricing.recurring.periodMonths === 1 ? "oy" : `${c.pricing.recurring.periodMonths} oy`}`}
                  {` · ${c.flow.length} bosqich`}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={() => setDraft(toDraft(c))} className="h-8 px-3 rounded-lg bg-slate-100 text-xs font-medium text-slate-700 hover:bg-slate-200">
                  Tahrirlash
                </button>
                <button onClick={() => toggleActive(c)} disabled={pending} className="h-8 px-3 rounded-lg bg-slate-100 text-xs font-medium text-slate-600 hover:bg-slate-200">
                  {c.active ? "O'chirish" : "Yoqish"}
                </button>
                <button onClick={() => remove(c)} disabled={pending} className="h-8 px-2.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50">
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
