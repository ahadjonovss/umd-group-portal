import type { ServiceType } from "@/types";
import type { AppStatus } from "@/lib/app-status";

export const SERVICE_LABELS: Record<ServiceType, string> = {
  "play-market": "Play Market — Joylashtirish",
  "app-store": "App Store — Joylashtirish",
  "google-transfer": "Google Play — Transfer",
  "apple-transfer": "Apple App Store — Transfer",
};

export const STATUS_META: Record<
  AppStatus,
  { label: string; badge: string; dot: string }
> = {
  submitted: {
    label: "Yuborildi",
    badge: "bg-slate-100 text-slate-700 ring-slate-200",
    dot: "bg-slate-400",
  },
  review: {
    label: "Ko'rib chiqilmoqda",
    badge: "bg-amber-50 text-amber-700 ring-amber-200",
    dot: "bg-amber-500",
  },
  payment_pending: {
    label: "To'lov kutilmoqda",
    badge: "bg-orange-50 text-orange-700 ring-orange-200",
    dot: "bg-orange-500",
  },
  preparing: {
    label: "Tayyorlanmoqda",
    badge: "bg-blue-50 text-blue-700 ring-blue-200",
    dot: "bg-blue-500",
  },
  store_review: {
    label: "Store ko'rigida",
    badge: "bg-violet-50 text-violet-700 ring-violet-200",
    dot: "bg-violet-500",
  },
  published: {
    label: "Chiqarildi",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
  },
  transferring: {
    label: "O'tkazilmoqda",
    badge: "bg-blue-50 text-blue-700 ring-blue-200",
    dot: "bg-blue-500",
  },
  completed: {
    label: "Yakunlandi",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
  },
  rejected: {
    label: "Rad etildi",
    badge: "bg-red-50 text-red-700 ring-red-200",
    dot: "bg-red-500",
  },
  cancelled: {
    label: "Bekor qilindi",
    badge: "bg-slate-100 text-slate-500 ring-slate-200",
    dot: "bg-slate-400",
  },
};

// ISO -> DD.MM.YYYY
export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${d.getFullYear()}`;
}

// Bugundan endDate gacha qancha kun qolgani.
export function daysLeft(endIso: string | null): number | null {
  if (!endIso) return null;
  const ms = new Date(endIso).getTime() - Date.now();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}
