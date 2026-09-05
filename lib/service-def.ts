// Maxsus (custom) xizmat ta'rifi — admin katalogidan (serviceCatalog) keladi.
//
// Muhim: xizmat userga biriktirilganda katalogdagi ta'rif ilova hujjatiga
// NUSXALANADI (`catalogSnapshot`). Keyin katalogda narx/oqim o'zgarsa,
// allaqachon biriktirilgan mijozning shartlari o'zgarmaydi.
//
// Bu fayl client'da ham ishlatiladi — "server-only" YO'Q.

import type { ServiceType } from "@/types";

// ── Rang temasi ────────────────────────────────
export type ThemeKey = "slate" | "blue" | "emerald" | "orange" | "purple" | "teal" | "cyan" | "indigo" | "rose" | "amber";

export const THEME_KEYS: ThemeKey[] = ["blue", "emerald", "purple", "indigo", "teal", "cyan", "orange", "rose", "amber", "slate"];

export const THEME_LABEL: Record<ThemeKey, string> = {
  slate: "Kulrang",
  blue: "Ko'k",
  emerald: "Yashil",
  orange: "To'q sariq",
  purple: "Binafsha",
  teal: "Ko'k-yashil",
  cyan: "Moviy",
  indigo: "Indigo",
  rose: "Pushti",
  amber: "Sariq",
};

// ── Oqim (statuslar) ───────────────────────────
// Custom xizmat bosqichlari mavjud AppStatus kalitlaridan tanlanadi:
// "submitted" (boshlanish) → stage1..stage8 (o'rta bosqichlar) → "completed" (yakun).
// Shu tufayli rad etish/bekor qilish, to'lov, statistika — hammasi o'zgarishsiz ishlaydi.
export const CUSTOM_STAGE_KEYS = ["stage1", "stage2", "stage3", "stage4", "stage5", "stage6", "stage7", "stage8"] as const;
export type CustomStageKey = (typeof CUSTOM_STAGE_KEYS)[number];

export interface FlowStep {
  key: string; // "submitted" | stage1..stage8 | "completed"
  label: string;
  desc: string;
}

// ── Narx modeli ────────────────────────────────
export interface OneTimePlan {
  enabled: boolean;
  amountUsd: number;
  advancePercent: number; // 100 bo'lsa — yakuniy to'lov yo'q
}

export type RecurringStart = "on_complete" | "on_advance_paid" | "on_assign";

export const RECURRING_START_LABEL: Record<RecurringStart, string> = {
  on_complete: "Ish topshirilgach",
  on_advance_paid: "Avans to'langach",
  on_assign: "Biriktirilgan kundan",
};

export interface RecurringPlan {
  enabled: boolean;
  amountUsd: number;
  periodMonths: number; // 1 = oylik, 3 = choraklik, 12 = yillik
  startsWhen: RecurringStart;
  firstPeriodFree: boolean;
  graceDays: number; // eslatma jadvali uchun ("qarzdor" deb belgilash muddati)
}

export interface ServicePricingModel {
  oneTime: OneTimePlan;
  recurring: RecurringPlan;
}

// ── Dinamik forma maydoni ──────────────────────
export type FieldType = "text" | "textarea" | "number" | "url" | "email" | "phone" | "select";

export const FIELD_TYPE_LABEL: Record<FieldType, string> = {
  text: "Matn",
  textarea: "Uzun matn",
  number: "Raqam",
  url: "Havola",
  email: "Email",
  phone: "Telefon",
  select: "Tanlov",
};

export interface ServiceField {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder: string;
  options: string[]; // faqat "select" uchun
}

// ── Xizmat ta'rifi (snapshot) ──────────────────
export interface ServiceDefSnapshot {
  key: string;
  name: string;
  shortName: string;
  theme: ThemeKey;
  icon: string; // emoji
  flow: FlowStep[];
  workStartKey: string; // avans tasdiqlangach o'tiladigan bosqich
  etaDays: number;
  pricing: ServicePricingModel;
}

// Katalogdagi to'liq hujjat (snapshot + katalogga xos maydonlar).
export interface CatalogService extends ServiceDefSnapshot {
  id: string;
  description: string;
  scope: "assigned" | "public"; // assigned = faqat admin biriktiradi
  active: boolean;
  fields: ServiceField[];
  terms: string;
  createdAt: string | null;
  updatedAt: string | null;
}

// ── Standart qiymatlar ─────────────────────────
export const DEFAULT_FLOW: FlowStep[] = [
  { key: "submitted", label: "Qabul qilindi", desc: "So'rovingiz qabul qilindi, tez orada ko'rib chiqamiz." },
  { key: "stage1", label: "Ishlanmoqda", desc: "Ish jarayoni boshlandi." },
  { key: "completed", label: "Topshirildi", desc: "Ish muvaffaqiyatli topshirildi! 🎉" },
];

export const DEFAULT_ONE_TIME: OneTimePlan = { enabled: true, amountUsd: 0, advancePercent: 50 };

export const DEFAULT_RECURRING: RecurringPlan = {
  enabled: false,
  amountUsd: 0,
  periodMonths: 1,
  startsWhen: "on_complete",
  firstPeriodFree: false,
  graceDays: 7,
};

export const DEFAULT_SNAPSHOT: ServiceDefSnapshot = {
  key: "",
  name: "Maxsus xizmat",
  shortName: "Maxsus",
  theme: "purple",
  icon: "🚀",
  flow: DEFAULT_FLOW,
  workStartKey: "stage1",
  etaDays: 0,
  pricing: { oneTime: DEFAULT_ONE_TIME, recurring: DEFAULT_RECURRING },
};

// ── Normalizatsiya (Firestore'dan kelgan xom ma'lumot uchun) ──
function str(v: unknown, f = ""): string {
  return typeof v === "string" ? v : f;
}
function num(v: unknown, f = 0): number {
  return typeof v === "number" && isFinite(v) ? v : f;
}
function pct(v: unknown, f: number): number {
  return Math.max(0, Math.min(100, Math.round(num(v, f))));
}
function bool(v: unknown, f = false): boolean {
  return typeof v === "boolean" ? v : f;
}

export function normalizeFlow(v: unknown): FlowStep[] {
  const arr = Array.isArray(v) ? v : [];
  const steps = arr
    .map((s) => {
      const o = (s ?? {}) as Record<string, unknown>;
      return { key: str(o.key), label: str(o.label), desc: str(o.desc) };
    })
    .filter((s) => s.key && s.label);
  return steps.length >= 2 ? steps : DEFAULT_FLOW;
}

export function normalizePricing(v: unknown): ServicePricingModel {
  const o = (v ?? {}) as Record<string, unknown>;
  const one = (o.oneTime ?? {}) as Record<string, unknown>;
  const rec = (o.recurring ?? {}) as Record<string, unknown>;
  const startsWhen = str(rec.startsWhen, DEFAULT_RECURRING.startsWhen) as RecurringStart;
  return {
    oneTime: {
      enabled: bool(one.enabled, DEFAULT_ONE_TIME.enabled),
      amountUsd: Math.max(0, num(one.amountUsd, 0)),
      advancePercent: pct(one.advancePercent, DEFAULT_ONE_TIME.advancePercent),
    },
    recurring: {
      enabled: bool(rec.enabled, false),
      amountUsd: Math.max(0, num(rec.amountUsd, 0)),
      periodMonths: Math.max(1, Math.round(num(rec.periodMonths, 1))),
      startsWhen: RECURRING_START_LABEL[startsWhen] ? startsWhen : DEFAULT_RECURRING.startsWhen,
      firstPeriodFree: bool(rec.firstPeriodFree, false),
      graceDays: Math.max(0, Math.round(num(rec.graceDays, DEFAULT_RECURRING.graceDays))),
    },
  };
}

export function normalizeFields(v: unknown): ServiceField[] {
  const arr = Array.isArray(v) ? v : [];
  return arr
    .map((f) => {
      const o = (f ?? {}) as Record<string, unknown>;
      const type = str(o.type, "text") as FieldType;
      return {
        key: str(o.key),
        label: str(o.label),
        type: FIELD_TYPE_LABEL[type] ? type : ("text" as FieldType),
        required: bool(o.required),
        placeholder: str(o.placeholder),
        options: Array.isArray(o.options) ? (o.options as unknown[]).map((x) => str(x)).filter(Boolean) : [],
      };
    })
    .filter((f) => f.key && f.label);
}

export function normalizeSnapshot(v: unknown): ServiceDefSnapshot {
  const o = (v ?? {}) as Record<string, unknown>;
  const theme = str(o.theme, DEFAULT_SNAPSHOT.theme) as ThemeKey;
  const flow = normalizeFlow(o.flow);
  const workStartKey = str(o.workStartKey);
  return {
    key: str(o.key),
    name: str(o.name, DEFAULT_SNAPSHOT.name),
    shortName: str(o.shortName) || str(o.name, DEFAULT_SNAPSHOT.shortName),
    theme: THEME_LABEL[theme] ? theme : DEFAULT_SNAPSHOT.theme,
    icon: str(o.icon, DEFAULT_SNAPSHOT.icon),
    flow,
    workStartKey: flow.some((s) => s.key === workStartKey) ? workStartKey : (flow[1]?.key ?? flow[0].key),
    etaDays: Math.max(0, Math.round(num(o.etaDays, 0))),
    pricing: normalizePricing(o.pricing),
  };
}

// Katalog hujjatidan biriktirish uchun snapshot ajratib oladi.
export function snapshotOf(c: ServiceDefSnapshot): ServiceDefSnapshot {
  return {
    key: c.key,
    name: c.name,
    shortName: c.shortName,
    theme: c.theme,
    icon: c.icon,
    flow: c.flow.map((s) => ({ ...s })),
    workStartKey: c.workStartKey,
    etaDays: c.etaDays,
    pricing: {
      oneTime: { ...c.pricing.oneTime },
      recurring: { ...c.pricing.recurring },
    },
  };
}

// ── Resolverlar ────────────────────────────────
// Har qanday "ilovasimon" obyekt (AppView, Firestore data, ...) shu shaklga tushadi.
export interface HasServiceDef {
  serviceType: ServiceType;
  catalogSnapshot?: ServiceDefSnapshot | null;
}

export function isCustomService(a: HasServiceDef | ServiceType | null | undefined): boolean {
  if (!a) return false;
  return typeof a === "string" ? a === "custom" : a.serviceType === "custom";
}

// Custom xizmat bo'lsa snapshot, aks holda null.
export function defOf(a: HasServiceDef | null | undefined): ServiceDefSnapshot | null {
  if (!a || a.serviceType !== "custom") return null;
  return a.catalogSnapshot ?? DEFAULT_SNAPSHOT;
}
