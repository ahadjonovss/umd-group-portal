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
  | "completed";

// Chiqarish xizmatlari oqimi (6 bosqich).
export const PUBLISH_FLOW: AppStatus[] = [
  "submitted",
  "review",
  "payment_pending",
  "preparing",
  "store_review",
  "published",
];

// Transfer xizmatlari oqimi (4 bosqich).
export const TRANSFER_FLOW: AppStatus[] = [
  "submitted",
  "payment_pending",
  "transferring",
  "completed",
];

// Oqimdan tashqari maxsus (terminal) holatlar.
export const TERMINAL_ERROR: AppStatus[] = ["rejected", "cancelled"];

const TRANSFER_SERVICES: ServiceType[] = ["google-transfer", "apple-transfer"];

export function getStatusFlow(serviceType: ServiceType): AppStatus[] {
  return TRANSFER_SERVICES.includes(serviceType) ? TRANSFER_FLOW : PUBLISH_FLOW;
}

export function isTerminalError(status: AppStatus): boolean {
  return TERMINAL_ERROR.includes(status);
}

// Xizmat muvaffaqiyatli yakunlandimi (chiqarildi yoki transfer yakunlandi).
export function isTerminalSuccess(status: AppStatus): boolean {
  return status === "published" || status === "completed";
}
