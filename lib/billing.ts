// Takrorlanuvchi (oylik/davriy) to'lov — maxsus xizmatlar uchun.
// Client'da ham ishlatiladi — "server-only" YO'Q.

export type RecurringStatus = "pending" | "active" | "past_due" | "cancelled";

export const RECURRING_STATUS_LABEL: Record<RecurringStatus, string> = {
  pending: "Kutilmoqda",
  active: "Faol",
  past_due: "Qarzdor",
  cancelled: "Bekor qilingan",
};

export const RECURRING_STATUS_BADGE: Record<RecurringStatus, string> = {
  pending: "bg-slate-100 text-slate-600 ring-slate-200",
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  past_due: "bg-red-50 text-red-700 ring-red-200",
  cancelled: "bg-slate-100 text-slate-500 ring-slate-200",
};

// Panel/admin uchun seriyalashtirilgan ko'rinish (Timestamp -> ISO).
export interface RecurringView {
  active: boolean;
  status: RecurringStatus;
  amountUsd: number;
  periodMonths: number;
  graceDays: number;
  startDate: string | null;
  nextChargeAt: string | null;
  lastInvoiceAt: string | null;
  invoicesCount: number;
  paidCount: number;
  periodNo: number; // oxirgi yaratilgan davr raqami
  cancelledAt: string | null;
}

export interface BillingView {
  recurring: RecurringView | null;
}

const DAY = 24 * 60 * 60 * 1000;

// Sanaga N oy qo'shadi (oy oxiri chegaralarini hisobga oladi: 31-yanvar + 1 oy = 28/29-fevral).
export function addMonths(d: Date, months: number): Date {
  const out = new Date(d.getTime());
  const day = out.getDate();
  out.setDate(1);
  out.setMonth(out.getMonth() + months);
  const lastDay = new Date(out.getFullYear(), out.getMonth() + 1, 0).getDate();
  out.setDate(Math.min(day, lastDay));
  return out;
}

// Keyingi to'lovgacha necha kun (manfiy = kechikkan).
export function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / DAY);
}

// Davr oralig'i matni: "05.09.2026 — 05.10.2026"
export function periodLabel(startIso: string | null, endIso: string | null): string {
  const f = (iso: string | null) => {
    if (!iso) return "—";
    const d = new Date(iso);
    const p = (n: number) => String(n).padStart(2, "0");
    return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
  };
  return `${f(startIso)} — ${f(endIso)}`;
}

// Davr uzunligi yorlig'i: 1 -> "oylik", 3 -> "3 oyda bir", 12 -> "yillik"
export function periodName(months: number): string {
  if (months === 1) return "oylik";
  if (months === 12) return "yillik";
  return `${months} oyda bir`;
}

// Obuna hozir hisob chiqarishga tayyormi (cron uchun).
export function isDue(r: RecurringView | null | undefined, now = Date.now()): boolean {
  if (!r || !r.active || r.status === "cancelled") return false;
  if (!r.nextChargeAt) return false;
  return new Date(r.nextChargeAt).getTime() <= now;
}
