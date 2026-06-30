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
