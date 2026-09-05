// App atrofidagi so'rovlar (transfer, update, obuna uzaytirish...) uchun umumiy oqim.
export type RequestType = "transfer" | "update" | "subscription_renewal" | "push_certificate" | "custom" | "recurring";

export type RequestStatus =
  | "requested" // So'rov yuborildi
  | "review" // Ko'rib chiqilmoqda
  | "payment_pending" // To'lov kutilmoqda
  | "in_progress" // O'tkazilmoqda / Tayyorlanmoqda
  | "store_review" // Store ko'rigida (update uchun)
  | "completed" // Yakunlandi
  | "rejected"
  | "cancelled";

// To'lov birinchi bosqichlarda (requested / review) amalga oshadi, tasdiqlangach
// "in_progress"ga o'tiladi — alohida "to'lov kutilmoqda" bosqichi yo'q.
export const REQUEST_FLOW: RequestStatus[] = [
  "requested",
  "review",
  "in_progress",
  "completed",
];

// Turga qarab oqim. Update'da qo'shimcha "store ko'rigida" bosqichi bor.
export function requestFlow(type: RequestType): RequestStatus[] {
  if (type === "update") return ["requested", "review", "in_progress", "store_review", "completed"];
  return REQUEST_FLOW;
}

// So'rov hali to'lov-oldi (ish boshlanmagan) bosqichdami — faqat requested / review.
export function isRequestPreWork(status: RequestStatus): boolean {
  return status === "requested" || status === "review";
}

export const REQUEST_TERMINAL_ERROR: RequestStatus[] = ["rejected", "cancelled"];

export function isRequestTerminalError(s: RequestStatus): boolean {
  return REQUEST_TERMINAL_ERROR.includes(s);
}

export function isRequestActive(s: RequestStatus): boolean {
  return !["completed", "rejected", "cancelled"].includes(s);
}

export function requestNextStatus(type: RequestType, s: RequestStatus): RequestStatus | null {
  const flow = requestFlow(type);
  const i = flow.indexOf(s);
  return i >= 0 && i < flow.length - 1 ? flow[i + 1] : null;
}

export const REQUEST_TYPE_LABEL: Record<RequestType, string> = {
  transfer: "Transfer",
  update: "Update",
  subscription_renewal: "Obuna uzaytirish",
  push_certificate: "Push sertifikat",
  custom: "Qo'shimcha to'lov",
  recurring: "Davriy to'lov",
};

// in_progress bosqichi turga qarab boshqacha nomlanadi
const IN_PROGRESS_LABEL: Record<RequestType, string> = {
  transfer: "O'tkazilmoqda",
  update: "Tayyorlanmoqda",
  subscription_renewal: "Uzaytirilmoqda",
  push_certificate: "Tayyorlanmoqda",
  custom: "Jarayonda",
  recurring: "To'lov kutilmoqda",
};

const BASE_LABEL: Record<RequestStatus, string> = {
  requested: "So'rov yuborildi",
  review: "Ko'rib chiqilmoqda",
  payment_pending: "To'lov kutilmoqda",
  in_progress: "Jarayonda",
  store_review: "Store ko'rigida",
  completed: "Yakunlandi",
  rejected: "Rad etildi",
  cancelled: "Bekor qilindi",
};

export function requestStatusLabel(type: RequestType, s: RequestStatus): string {
  if (s === "in_progress") return IN_PROGRESS_LABEL[type] ?? BASE_LABEL.in_progress;
  return BASE_LABEL[s];
}

export const REQUEST_STATUS_META: Record<RequestStatus, { badge: string; dot: string; text: string }> = {
  requested: { badge: "bg-slate-100 text-slate-700 ring-slate-200", dot: "bg-slate-400", text: "text-slate-500" },
  review: { badge: "bg-sky-50 text-sky-700 ring-sky-200", dot: "bg-sky-500", text: "text-sky-600" },
  payment_pending: { badge: "bg-amber-50 text-amber-700 ring-amber-200", dot: "bg-amber-500", text: "text-amber-600" },
  store_review: { badge: "bg-violet-50 text-violet-700 ring-violet-200", dot: "bg-violet-500", text: "text-violet-600" },
  in_progress: { badge: "bg-indigo-50 text-indigo-700 ring-indigo-200", dot: "bg-indigo-500", text: "text-indigo-600" },
  completed: { badge: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500", text: "text-emerald-600" },
  rejected: { badge: "bg-red-50 text-red-700 ring-red-200", dot: "bg-red-500", text: "text-red-600" },
  cancelled: { badge: "bg-slate-100 text-slate-500 ring-slate-200", dot: "bg-slate-400", text: "text-slate-500" },
};
