import type { Pricing } from "@/lib/firestore/settings";
import type { ServiceType } from "@/types";
import type { RequestType } from "@/lib/request-status";
import { defOf, type HasServiceDef } from "@/lib/service-def";

// Boshlanish sanasidan N ish kuni (shanba/yakshanba hisobga olinmaydi) keyingi sana.
export function addBusinessDays(start: Date, days: number): Date {
  const d = new Date(start);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay(); // 0 = yakshanba, 6 = shanba
    if (dow !== 0 && dow !== 6) added++;
  }
  return d;
}

// Ilova xizmati uchun taxminiy ish kunlari.
export function etaDaysForService(serviceType: ServiceType, pricing: Pricing): number {
  switch (serviceType) {
    case "play-market":
    case "app-store":
      return pricing.etaPublish;
    case "google-transfer":
    case "apple-transfer":
      return pricing.etaTransfer;
    case "account":
      return pricing.etaAccount;
    case "duns":
      return pricing.etaDuns;
    default:
      return 0;
  }
}

// App-aware variant: maxsus xizmatda muddat katalogdan olinadi.
export function etaDaysFor(app: HasServiceDef, pricing: Pricing): number {
  const def = defOf(app);
  if (def) return def.etaDays;
  return etaDaysForService(app.serviceType, pricing);
}

// So'rov turi uchun taxminiy ish kunlari.
export function etaDaysForRequest(type: RequestType, pricing: Pricing): number {
  switch (type) {
    case "update":
      return pricing.etaUpdate;
    case "push_certificate":
      return pricing.etaPushCert;
    case "transfer":
      return pricing.etaTransfer;
    default:
      return 0; // obuna uzaytirish va boshqalar — tez
  }
}

// createdAt (ISO) + ish kunlari → taxminiy yakunlanish sanasi (ISO) yoki null.
export function estimatedDateIso(createdAtIso: string | null | undefined, days: number): string | null {
  if (!createdAtIso || days <= 0) return null;
  const start = new Date(createdAtIso);
  if (isNaN(start.getTime())) return null;
  return addBusinessDays(start, days).toISOString();
}
