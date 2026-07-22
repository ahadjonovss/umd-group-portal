import type { ServiceType } from "@/types";

// Barcha mumkin bo'lgan holatlar.
export type AppStatus =
  // umumiy
  | "submitted"
  | "payment_pending"
  | "rejected"
  | "cancelled"
  // chiqarish (play-market, app-store)
  | "review"
  | "preparing"
  | "store_review"
  | "published"
  // transfer (google, apple)
  | "transferring"
  | "completed"
  // ilova boshqa akkauntga transfer qilingan (terminal)
  | "transferred"
  // obuna to'xtatildi — ilova store'dan olib tashlandi (terminal)
  | "subscription_ended";

// Chiqarish xizmatlari oqimi. To'lov birinchi bosqichlarda amalga oshadi,
// tasdiqlangach "preparing" (ish) bosqichiga o'tiladi — alohida "to'lov kutilmoqda" yo'q.
export const PUBLISH_FLOW: AppStatus[] = [
  "submitted",
  "review",
  "preparing",
  "store_review",
  "published",
];

// Transfer xizmatlari oqimi.
export const TRANSFER_FLOW: AppStatus[] = [
  "submitted",
  "transferring",
  "completed",
];

// Developer akkaunt ochish oqimi.
export const ACCOUNT_FLOW: AppStatus[] = [
  "submitted",
  "review",
  "preparing",
  "completed",
];

// Oqimdan tashqari maxsus (terminal) holatlar.
export const TERMINAL_ERROR: AppStatus[] = ["rejected", "cancelled"];

const TRANSFER_SERVICES: ServiceType[] = ["google-transfer", "apple-transfer"];

export function getStatusFlow(serviceType: ServiceType): AppStatus[] {
  if (serviceType === "account") return ACCOUNT_FLOW;
  return TRANSFER_SERVICES.includes(serviceType) ? TRANSFER_FLOW : PUBLISH_FLOW;
}

// Avans to'lovi tasdiqlangach o'tiladigan birinchi "ish" bosqichi.
// To'lov shu bosqichdan OLDINGI holatlarda (submitted / review) amalga oshadi.
export function workStartStatus(serviceType: ServiceType): AppStatus {
  return TRANSFER_SERVICES.includes(serviceType) ? "transferring" : "preparing";
}

// Ilova hali to'lov-oldi (ish boshlanmagan) bosqichdami — avans shu yerda to'lanadi.
export function isPreWork(serviceType: ServiceType, status: AppStatus): boolean {
  const flow = getStatusFlow(serviceType);
  const cur = flow.indexOf(status);
  const work = flow.indexOf(workStartStatus(serviceType));
  return cur >= 0 && work >= 0 && cur < work;
}

export function isTerminalError(status: AppStatus): boolean {
  return TERMINAL_ERROR.includes(status);
}

// Xizmat muvaffaqiyatli yakunlandimi (chiqarildi yoki transfer yakunlandi).
export function isTerminalSuccess(status: AppStatus): boolean {
  return status === "published" || status === "completed";
}
