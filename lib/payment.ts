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

// Qolgan (yakuniy) to'lov summasi ($) — chiqarilgandan keyin. 70/30 da bu 30%.
export function finalUsd(serviceType: ServiceType, p: Pricing): number {
  return (fullUsd(serviceType, p) * (100 - advancePercentFor(serviceType, p))) / 100;
}

// Ilova platformasiga qarab transfer narxi ($). Play Market -> Google, App Store -> Apple.
export function transferUsd(appServiceType: ServiceType, p: Pricing): number {
  const base = appServiceType === "app-store" || appServiceType === "apple-transfer" ? p.appleTransfer : p.googleTransfer;
  return (base * p.transferAdvance) / 100;
}
