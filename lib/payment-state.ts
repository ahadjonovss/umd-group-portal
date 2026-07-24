// To'lov holati — statusdan mustaqil. Har servis (app/request) `payment` obyektiga ega:
// installments (qismlar) map ko'rinishida, har biri o'z holatiga ega.
import type { ServiceType } from "@/types";

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

// Yangi ilova uchun boshlang'ich payment obyekti (avans "due", yakuniy "locked").
export function newAppPayment(serviceType: ServiceType): PaymentState {
  const keys = appInstallmentKeys(serviceType);
  const installments: Partial<Record<InstallmentKey, Installment>> = {};
  for (const k of keys) installments[k] = inst(k === "advance" ? "due" : "locked");
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
export function paymentStatus(p: PaymentState | null | undefined): "unpaid" | "partial" | "paid" {
  if (!p || !p.installments) return "unpaid";
  const vals = Object.values(p.installments).filter(Boolean) as Installment[];
  if (!vals.length) return "unpaid";
  const confirmed = vals.filter((i) => i.state === "confirmed").length;
  if (confirmed === vals.length) return "paid";
  if (confirmed > 0 || vals.some((i) => i.state === "submitted")) return "partial";
  return "unpaid";
}
