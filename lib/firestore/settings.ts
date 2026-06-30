import "server-only";
import { adminDb } from "@/lib/firebase/admin";

// Barcha narxlar — AQSh dollarida ($).
export interface Pricing {
  appStorePublish: number; // App Store (iOS) chiqarish
  playMarketPublish: number; // Play Market (Android) chiqarish
  googleTransfer: number; // Google Play transfer
  appleTransfer: number; // App Store transfer
  updateAndroid: number; // Android update (har biri)
  updateIos: number; // iOS update (har biri)
  publishAdvance: number; // chiqarish — avans (oldindan to'lov) %
  transferAdvance: number; // transfer — avans %
  updateAdvance: number; // update — avans %
}

export const DEFAULT_PRICING: Pricing = {
  appStorePublish: 40,
  playMarketPublish: 30,
  googleTransfer: 5,
  appleTransfer: 5,
  updateAndroid: 3,
  updateIos: 5,
  publishAdvance: 70,
  transferAdvance: 100,
  updateAdvance: 100,
};

function num(v: unknown, fallback: number): number {
  return typeof v === "number" && isFinite(v) ? v : fallback;
}
function pct(v: unknown, fallback: number): number {
  return Math.max(0, Math.min(100, Math.round(num(v, fallback))));
}

function normalize(x: Partial<Pricing>): Pricing {
  return {
    appStorePublish: num(x.appStorePublish, DEFAULT_PRICING.appStorePublish),
    playMarketPublish: num(x.playMarketPublish, DEFAULT_PRICING.playMarketPublish),
    googleTransfer: num(x.googleTransfer, DEFAULT_PRICING.googleTransfer),
    appleTransfer: num(x.appleTransfer, DEFAULT_PRICING.appleTransfer),
    updateAndroid: num(x.updateAndroid, DEFAULT_PRICING.updateAndroid),
    updateIos: num(x.updateIos, DEFAULT_PRICING.updateIos),
    publishAdvance: pct(x.publishAdvance, DEFAULT_PRICING.publishAdvance),
    transferAdvance: pct(x.transferAdvance, DEFAULT_PRICING.transferAdvance),
    updateAdvance: pct(x.updateAdvance, DEFAULT_PRICING.updateAdvance),
  };
}

export async function getPricing(): Promise<Pricing> {
  try {
    const doc = await adminDb.collection("settings").doc("pricing").get();
    return normalize(doc.data() ?? {});
  } catch {
    return DEFAULT_PRICING;
  }
}

export async function setPricing(p: Pricing): Promise<void> {
  await adminDb.collection("settings").doc("pricing").set(normalize(p), { merge: true });
}

// ── To'lov ma'lumotlari (karta) ──────────────────
export interface PaymentInfo {
  cardNumber: string;
  cardHolder: string;
}

export const DEFAULT_PAYMENT: PaymentInfo = {
  cardNumber: "",
  cardHolder: "",
};

export async function getPaymentInfo(): Promise<PaymentInfo> {
  try {
    const doc = await adminDb.collection("settings").doc("payment").get();
    const x = doc.data() ?? {};
    return {
      cardNumber: typeof x.cardNumber === "string" ? x.cardNumber : "",
      cardHolder: typeof x.cardHolder === "string" ? x.cardHolder : "",
    };
  } catch {
    return DEFAULT_PAYMENT;
  }
}

export async function setPaymentInfo(info: PaymentInfo): Promise<void> {
  await adminDb.collection("settings").doc("payment").set(
    {
      cardNumber: (info.cardNumber ?? "").trim(),
      cardHolder: (info.cardHolder ?? "").trim(),
    },
    { merge: true }
  );
}
