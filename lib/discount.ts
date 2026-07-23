import type { ServiceType } from "@/types";
import type { RequestType } from "@/lib/request-status";

// Chegirma qamrab oladigan servis kategoriyalari
export type DiscountService = "publish" | "account" | "transfer" | "update" | "renewal" | "push_certificate";

export const DISCOUNT_SERVICE_LABEL: Record<DiscountService, string> = {
  publish: "Store'ga chiqarish",
  account: "Akkaunt ochish",
  transfer: "Transfer",
  update: "Update",
  renewal: "Obuna uzaytirish",
  push_certificate: "Push sertifikat",
};

// Ilova (ariza) serviceType -> chegirma kategoriyasi (publish yoki account)
export function categoryForServiceType(s: ServiceType): DiscountService | null {
  if (s === "play-market" || s === "app-store") return "publish";
  if (s === "account") return "account";
  return null; // transfer/apple-transfer ilova serviceType'lari chegirma bermaydi (so'rov orqali)
}

// So'rov turi -> chegirma kategoriyasi
export function categoryForRequest(t: RequestType): DiscountService {
  if (t === "subscription_renewal") return "renewal";
  return t; // "transfer" | "update" | "push_certificate"
}

// Foizli chegirmani qo'llaydi (summani kamaytiradi)
export function applyDiscount(usd: number, percent: number): number {
  if (!percent || percent <= 0) return usd;
  return usd * (1 - Math.min(percent, 100) / 100);
}
