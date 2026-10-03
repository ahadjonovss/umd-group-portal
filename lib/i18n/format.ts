import type { Dict } from ".";
import type { ServiceType } from "@/types";
import type { RequestType, RequestStatus } from "@/lib/request-status";
import type { AppStatus } from "@/lib/app-status";
import { defOf, type HasServiceDef } from "@/lib/service-def";

// "Google Play · Korporativ" — lib/labels.ts'dagi accountLabel'ning tilga bog'liq varianti.
export function accountLabelOf(
  t: Dict,
  platform: string | null,
  type: string | null
): string {
  const p = platform
    ? t.service.accountPlatform[platform as keyof typeof t.service.accountPlatform] ?? platform
    : "";
  const ty = type
    ? t.service.accountType[type as keyof typeof t.service.accountType] ?? type
    : "";
  return [p, ty].filter(Boolean).join(" · ");
}

// Ilova/ariza sarlavhasi: nomi bo'lsa nomi, bo'lmasa xizmat yorlig'i.
export function appTitleOf(
  t: Dict,
  appName: string | null | undefined,
  serviceType: ServiceType
): string {
  return appName || t.service.full[serviceType];
}

// lib/request-status.ts'dagi requestStatusLabel'ning tilga bog'liq varianti.
export function requestStatusLabelOf(
  t: Dict,
  type: RequestType,
  status: RequestStatus
): string {
  if (status === "in_progress") {
    return t.requestInProgress[type] ?? t.requestStatus.in_progress;
  }
  return t.requestStatus[status];
}

// ——— Maxsus xizmatlar (admin katalogi) uchun tilga bog'liq variantlar ———
// Katalogdagi nom/bosqich yorliqlari admin kiritgan kontent — ular tarjima
// qilinmaydi, lekin katalog bo'lmaganda lug'atdan (o'zbekcha konstantadan emas)
// o'qiymiz. lib/labels.ts'dagi appLabel/appTitle/statusMetaFor bilan bir xil
// mantiq, faqat fallback'i tilga bog'liq.

export function appLabelOf(t: Dict, app: HasServiceDef): string {
  return defOf(app)?.name ?? t.service.full[app.serviceType];
}

export function appTitleFor(
  t: Dict,
  app: HasServiceDef & { appName?: string | null }
): string {
  return app.appName || appLabelOf(t, app);
}

export function appShortOf(t: Dict, app: HasServiceDef): string {
  return defOf(app)?.shortName ?? t.service.short[app.serviceType];
}

// Status yorlig'i/tavsifi — custom xizmatda katalog oqimidan almashtiriladi.
export function statusTextFor(
  t: Dict,
  app: HasServiceDef,
  status: AppStatus
): { label: string; desc: string } {
  const base = t.status[status] ?? t.status.submitted;
  const step = defOf(app)?.flow.find((s) => s.key === status);
  if (!step) return base;
  return { label: step.label, desc: step.desc || base.desc };
}
