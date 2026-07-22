// App atrofidagi so'rovlar (transfer, update, obuna uzaytirish...) uchun umumiy oqim.
export type RequestType = "transfer" | "update" | "subscription_renewal";

export type RequestStatus =
  | "requested" // So'rov yuborildi
  | "review" // Ko'rib chiqilmoqda
  | "payment_pending" // To'lov kutilmoqda
  | "in_progress" // O'tkazilmoqda / Tayyorlanmoqda
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

// So'rov hali to'lov-oldi (ish boshlanmagan) bosqichdami.
export function isRequestPreWork(status: RequestStatus): boolean {
  const cur = REQUEST_FLOW.indexOf(status);
  const work = REQUEST_FLOW.indexOf("in_progress");
  return cur >= 0 && work >= 0 && cur < work;
}

export const REQUEST_TERMINAL_ERROR: RequestStatus[] = ["rejected", "cancelled"];

export function isRequestTerminalError(s: RequestStatus): boolean {
  return REQUEST_TERMINAL_ERROR.includes(s);
}

export function isRequestActive(s: RequestStatus): boolean {
  return !["completed", "rejected", "cancelled"].includes(s);
}

export function requestNextStatus(s: RequestStatus): RequestStatus | null {
  const i = REQUEST_FLOW.indexOf(s);
  return i >= 0 && i < REQUEST_FLOW.length - 1 ? REQUEST_FLOW[i + 1] : null;
}

export const REQUEST_TYPE_LABEL: Record<RequestType, string> = {
  transfer: "Transfer",
  update: "Update",
  subscription_renewal: "Obuna uzaytirish",
};

// in_progress bosqichi turga qarab boshqacha nomlanadi
const IN_PROGRESS_LABEL: Record<RequestType, string> = {
  transfer: "O'tkazilmoqda",
  update: "Tayyorlanmoqda",
  subscription_renewal: "Uzaytirilmoqda",
};

const BASE_LABEL: Record<RequestStatus, string> = {
  requested: "So'rov yuborildi",
  review: "Ko'rib chiqilmoqda",
  payment_pending: "To'lov kutilmoqda",
  in_progress: "Jarayonda",
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
  in_progress: { badge: "bg-indigo-50 text-indigo-700 ring-indigo-200", dot: "bg-indigo-500", text: "text-indigo-600" },
  completed: { badge: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500", text: "text-emerald-600" },
  rejected: { badge: "bg-red-50 text-red-700 ring-red-200", dot: "bg-red-500", text: "text-red-600" },
  cancelled: { badge: "bg-slate-100 text-slate-500 ring-slate-200", dot: "bg-slate-400", text: "text-slate-500" },
};
