// To'lov holati — statusdan mustaqil. Har servis (app/request) `payment` obyektiga ega:
// installments (qismlar) map ko'rinishida, har biri o'z holatiga ega.
import type { ServiceType } from "@/types";
import { defOf, type HasServiceDef } from "@/lib/service-def";

export type PayState = "locked" | "due" | "submitted" | "confirmed" | "rejected";
export type InstallmentKey = "advance" | "final" | "full";

export interface Installment {
  state: PayState;
  paymentId: string | null; // -> payments kolleksiyasi (ledger) yozuvi
  taxPhone: string | null;
  taxReceiptUrl: string | null;
}

export interface PaymentState {
  installments: Partial<Record<InstallmentKey, Installment>>;
}

function inst(state: PayState): Installment {
  return { state, paymentId: null, taxPhone: null, taxReceiptUrl: null };
}

// Ilova qaysi qismlarga ega: publish/account -> avans + yakuniy; transfer -> faqat to'liq (avans 100%).
export function appInstallmentKeys(serviceType: ServiceType): InstallmentKey[] {
  if (serviceType === "play-market" || serviceType === "app-store" || serviceType === "account") {
    return ["advance", "final"];
  }
  return ["advance"]; // google-transfer / apple-transfer — 100% avans (yakuniy yo'q)
}

// App-aware variant. Maxsus xizmatda avans foizi 100 bo'lsa — bitta qism.
export function installmentKeysFor(app: HasServiceDef): InstallmentKey[] {
  const def = defOf(app);
  if (def) {
    if (!def.pricing.oneTime.enabled) return [];
    return def.pricing.oneTime.advancePercent >= 100 ? ["advance"] : ["advance", "final"];
  }
  return appInstallmentKeys(app.serviceType);
}

// Yangi ilova uchun boshlang'ich payment obyekti — barcha qismlar "due"
// (mijoz avansni ham, yakuniyni ham istalgan payt to'lay oladi).
export function newAppPayment(app: HasServiceDef): PaymentState {
  const keys = installmentKeysFor(app);
  const installments: Partial<Record<InstallmentKey, Installment>> = {};
  for (const k of keys) installments[k] = inst("due");
  return { installments };
}

// Yangi so'rov uchun (transfer/update/renewal/push) — bitta "full" qism, "due".
export function newRequestPayment(): PaymentState {
  return { installments: { full: inst("due") } };
}

// To'lov turi (payment kind) -> installment kaliti.
export function kindToInstallment(kind: string): InstallmentKey {
  if (kind === "advance") return "advance";
  if (kind === "final") return "final";
  return "full"; // transfer/update/renewal/push_certificate
}

export function getInstallment(p: PaymentState | null | undefined, key: InstallmentKey): Installment | null {
  return p?.installments?.[key] ?? null;
}

// Qism hozir to'lanishi mumkinmi (forma ko'rsatiladi).
export function isPayable(i: Installment | null | undefined): boolean {
  return !!i && (i.state === "due" || i.state === "rejected");
}

// Barcha mavjud qismlar tasdiqlangan (to'liq to'langan).
export function fullyPaid(p: PaymentState | null | undefined): boolean {
  if (!p || !p.installments) return false;
  const vals = Object.values(p.installments).filter(Boolean) as Installment[];
  return vals.length > 0 && vals.every((i) => i.state === "confirmed");
}

// Umumiy holat.
// ── Update paketi ──────────────────────────────
export interface UpdatePackage {
  active: boolean;
  startDate: string | null;
  endDate: string | null;
  quota: number;
  used: number;
  priceUsd: number;
  reminded?: boolean;
}

// Paket hozir amaldami (faol + kvota bor + muddati o'tmagan).
export function pkgActive(pkg: UpdatePackage | null | undefined): boolean {
  if (!pkg || !pkg.active) return false;
  if (pkg.used >= pkg.quota) return false;
  if (pkg.endDate && new Date(pkg.endDate).getTime() < Date.now()) return false;
  return true;
}

export function pkgDaysLeft(pkg: UpdatePackage | null | undefined): number {
  if (!pkg || !pkg.endDate) return 0;
  return Math.ceil((new Date(pkg.endDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

export function paymentStatus(p: PaymentState | null | undefined): "unpaid" | "partial" | "paid" {
  if (!p || !p.installments) return "unpaid";
  const vals = Object.values(p.installments).filter(Boolean) as Installment[];
  if (!vals.length) return "unpaid";
  const confirmed = vals.filter((i) => i.state === "confirmed").length;
  if (confirmed === vals.length) return "paid";
  if (confirmed > 0 || vals.some((i) => i.state === "submitted")) return "partial";
  return "unpaid";
}
