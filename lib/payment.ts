import type { ServiceType } from "@/types";
import type { Pricing } from "@/lib/firestore/settings";

// Xizmatning to'liq narxi ($).
export function fullUsd(serviceType: ServiceType, p: Pricing): number {
  switch (serviceType) {
    case "play-market":
      return p.playMarketPublish;
    case "app-store":
      return p.appStorePublish;
    case "google-transfer":
      return p.googleTransfer;
    case "apple-transfer":
      return p.appleTransfer;
    default:
      return 0;
  }
}

// Shu xizmat uchun avans foizi.
export function advancePercentFor(serviceType: ServiceType, p: Pricing): number {
  return serviceType === "google-transfer" || serviceType === "apple-transfer"
    ? p.transferAdvance
    : p.publishAdvance;
}

// Ariza uchun avans (oldindan to'lov) summasini $ da hisoblaydi.
export function advanceUsd(serviceType: ServiceType, p: Pricing): number {
  return (fullUsd(serviceType, p) * advancePercentFor(serviceType, p)) / 100;
}

// Update (yangilanish) narxi ($). Play Market -> Android, App Store -> iOS.
export function updateUsd(serviceType: ServiceType, p: Pricing): number {
  return serviceType === "app-store" || serviceType === "apple-transfer" ? p.updateIos : p.updateAndroid;
}

// Apple push notification sertifikati narxi ($).
export function pushCertUsd(p: Pricing): number {
  return p.pushCertificate;
}

// Obunani uzaytirish — chiqarilgan (store'ga chiqqan paytdagi) narxning 50%i.
export const RENEWAL_FACTOR = 0.5;

// Ilova chiqarilgan narxi: publishedPrice saqlangan bo'lsa o'sha, aks holda
// (eski/migratsiya qilingan ilovalar uchun) joriy narx.
export function publishedBasePrice(
  app: { serviceType: ServiceType; publishedPrice?: number | null },
  p: Pricing
): number {
  return typeof app.publishedPrice === "number" && app.publishedPrice > 0
    ? app.publishedPrice
    : fullUsd(app.serviceType, p);
}

export function renewalUsd(
  app: { serviceType: ServiceType; publishedPrice?: number | null },
  p: Pricing
): number {
  return publishedBasePrice(app, p) * RENEWAL_FACTOR;
}

// Qolgan (yakuniy) to'lov summasi ($) — chiqarilgandan keyin. 70/30 da bu 30%.
export function finalUsd(serviceType: ServiceType, p: Pricing): number {
  return (fullUsd(serviceType, p) * (100 - advancePercentFor(serviceType, p))) / 100;
}

// Ilova platformasiga qarab transfer narxi ($). Play Market -> Google, App Store -> Apple.
export function transferUsd(appServiceType: ServiceType, p: Pricing): number {
  const base = appServiceType === "app-store" || appServiceType === "apple-transfer" ? p.appleTransfer : p.googleTransfer;
  return (base * p.transferAdvance) / 100;
}

// ── Developer akkaunt ochish ──────────────────────────────
export type AccountPlatform = "google" | "apple";
export type AccountType = "personal" | "corporate";

// Platforma + tur bo'yicha akkaunt ochish narxi ($).
export function accountBaseUsd(platform: AccountPlatform, type: AccountType, p: Pricing): number {
  if (platform === "apple") return type === "corporate" ? p.accountAppleCorporate : p.accountApplePersonal;
  return type === "corporate" ? p.accountGoogleCorporate : p.accountGooglePersonal;
}

// ── App-aware to'lov hisob-kitobi ─────────────────────────
// Akkaunt xizmatida narx platforma+turga bog'liq, shuning uchun ariza yaratilganda
// hisoblangan narx `servicePrice` maydonida saqlanadi. Boshqa xizmatlarda fullUsd.
type PricedApp = { serviceType: ServiceType; servicePrice?: number | null };

export function serviceBaseUsd(app: PricedApp, p: Pricing): number {
  if (app.serviceType === "account") return app.servicePrice ?? 0;
  return fullUsd(app.serviceType, p);
}

export function advancePercentForApp(app: PricedApp, p: Pricing): number {
  if (app.serviceType === "account") return p.accountAdvance;
  return advancePercentFor(app.serviceType, p);
}

export function advanceUsdApp(app: PricedApp, p: Pricing): number {
  return (serviceBaseUsd(app, p) * advancePercentForApp(app, p)) / 100;
}

export function finalUsdApp(app: PricedApp, p: Pricing): number {
  return (serviceBaseUsd(app, p) * (100 - advancePercentForApp(app, p))) / 100;
}
