import type { ServiceType } from "@/types";
import type { AppStatus } from "@/lib/app-status";

export const SERVICE_LABELS: Record<ServiceType, string> = {
  "play-market": "Play Market — Joylashtirish",
  "app-store": "App Store — Joylashtirish",
  "google-transfer": "Google Play — Transfer",
  "apple-transfer": "Apple App Store — Transfer",
};

// Platforma: App Store / Apple transfer -> iOS, qolgani -> Android
export type Platform = "android" | "ios";

export function platformOf(s: ServiceType): Platform {
  return s === "app-store" || s === "apple-transfer" ? "ios" : "android";
}

export const PLATFORM_LABEL: Record<Platform, string> = {
  android: "Android",
  ios: "iOS",
};

// Qisqa nom (chiplar uchun)
export const SERVICE_SHORT: Record<ServiceType, string> = {
  "play-market": "Play Market",
  "app-store": "App Store",
  "google-transfer": "Google Transfer",
  "apple-transfer": "Apple Transfer",
};

// Xizmat rangi (chip)
export const SERVICE_BADGE: Record<ServiceType, string> = {
  "play-market": "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "app-store": "bg-blue-50 text-blue-700 ring-blue-200",
  "google-transfer": "bg-orange-50 text-orange-700 ring-orange-200",
  "apple-transfer": "bg-purple-50 text-purple-700 ring-purple-200",
};

export const STATUS_META: Record<
  AppStatus,
  { label: string; badge: string; dot: string; text: string; desc: string }
> = {
  submitted: {
    label: "Yuborildi",
    badge: "bg-slate-100 text-slate-700 ring-slate-200",
    dot: "bg-slate-400",
    text: "text-slate-500",
    desc: "Arizangiz qabul qilindi. Tez orada ko'rib chiqamiz.",
  },
  review: {
    label: "Ko'rib chiqilmoqda",
    badge: "bg-sky-50 text-sky-700 ring-sky-200",
    dot: "bg-sky-500",
    text: "text-sky-600",
    desc: "Ma'lumot va materiallaringiz jamoamiz tomonidan tekshirilmoqda.",
  },
  payment_pending: {
    label: "To'lov kutilmoqda",
    badge: "bg-amber-50 text-amber-700 ring-amber-200",
    dot: "bg-amber-500",
    text: "text-amber-600",
    desc: "Xizmatni davom ettirish uchun to'lov kutilmoqda.",
  },
  preparing: {
    label: "Tayyorlanmoqda",
    badge: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    dot: "bg-indigo-500",
    text: "text-indigo-600",
    desc: "Ilova store talablariga moslab tayyorlanmoqda.",
  },
  store_review: {
    label: "Store ko'rigida",
    badge: "bg-violet-50 text-violet-700 ring-violet-200",
    dot: "bg-violet-500",
    text: "text-violet-600",
    desc: "Ilova rasmiy store (Google/Apple) ko'rigiga yuborildi.",
  },
  published: {
    label: "Chiqarildi",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
    text: "text-emerald-600",
    desc: "Ilova store'da muvaffaqiyatli chiqarildi! 🎉",
  },
  transferring: {
    label: "O'tkazilmoqda",
    badge: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    dot: "bg-indigo-500",
    text: "text-indigo-600",
    desc: "Akkaunt o'tkazish jarayoni ketmoqda.",
  },
  completed: {
    label: "Yakunlandi",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
    text: "text-emerald-600",
    desc: "Transfer muvaffaqiyatli yakunlandi! 🎉",
  },
  rejected: {
    label: "Rad etildi",
    badge: "bg-red-50 text-red-700 ring-red-200",
    dot: "bg-red-500",
    text: "text-red-600",
    desc: "Ariza rad etildi. Batafsil ma'lumot uchun biz bilan bog'laning.",
  },
  cancelled: {
    label: "Bekor qilindi",
    badge: "bg-slate-100 text-slate-500 ring-slate-200",
    dot: "bg-slate-400",
    text: "text-slate-500",
    desc: "Ariza bekor qilindi.",
  },
  transferred: {
    label: "Transfer qilingan",
    badge: "bg-violet-50 text-violet-700 ring-violet-200",
    dot: "bg-violet-500",
    text: "text-violet-600",
    desc: "Ilova boshqa akkauntga o'tkazildi.",
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
