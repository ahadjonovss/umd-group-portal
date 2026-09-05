import "server-only";
import { getCatalogService } from "@/lib/firestore/catalog";
import { createAppSubmission, type RecurringInit } from "@/lib/firestore/apps";
import { getUser } from "@/lib/firestore/users";
import { snapshotOf, type RecurringStart, type ServiceDefSnapshot } from "@/lib/service-def";
import type { Actor } from "@/lib/firestore/activity";

// Admin foydalanuvchiga katalogdagi maxsus xizmatni biriktiradi.
// Narx/davr shu mijoz uchun alohida o'zgartirilishi mumkin (shaxsiy kelishuv) —
// o'zgartirilgan qiymatlar snapshot'ga yoziladi va keyin katalogdan mustaqil bo'ladi.
export interface AssignInput {
  catalogId: string;
  ownerUid: string;
  title: string; // ariza nomi (masalan: "Alif Promoter mobil ilova")
  note?: string;
  // Narx override'lari (bo'sh qoldirilsa katalogdagi qiymat)
  oneTimeUsd?: number | null;
  advancePercent?: number | null;
  recurringEnabled?: boolean | null;
  recurringUsd?: number | null;
  periodMonths?: number | null;
  startsWhen?: RecurringStart | null;
  firstPeriodFree?: boolean | null;
  graceDays?: number | null;
  etaDays?: number | null;
  actor: Actor;
}

export async function assignCustomService(input: AssignInput): Promise<string> {
  const svc = await getCatalogService(input.catalogId);
  if (!svc) throw new Error("Xizmat katalogda topilmadi");
  const user = await getUser(input.ownerUid);
  if (!user) throw new Error("Foydalanuvchi topilmadi");

  // Katalog ta'rifidan snapshot + shu mijoz uchun override'lar
  const snapshot: ServiceDefSnapshot = snapshotOf(svc);
  if (typeof input.oneTimeUsd === "number") snapshot.pricing.oneTime.amountUsd = Math.max(0, input.oneTimeUsd);
  if (typeof input.advancePercent === "number") {
    snapshot.pricing.oneTime.advancePercent = Math.max(0, Math.min(100, Math.round(input.advancePercent)));
  }
  snapshot.pricing.oneTime.enabled = snapshot.pricing.oneTime.amountUsd > 0;
  if (typeof input.recurringEnabled === "boolean") snapshot.pricing.recurring.enabled = input.recurringEnabled;
  if (typeof input.recurringUsd === "number") snapshot.pricing.recurring.amountUsd = Math.max(0, input.recurringUsd);
  if (typeof input.periodMonths === "number") snapshot.pricing.recurring.periodMonths = Math.max(1, Math.round(input.periodMonths));
  if (input.startsWhen) snapshot.pricing.recurring.startsWhen = input.startsWhen;
  if (typeof input.firstPeriodFree === "boolean") snapshot.pricing.recurring.firstPeriodFree = input.firstPeriodFree;
  if (typeof input.graceDays === "number") snapshot.pricing.recurring.graceDays = Math.max(0, Math.round(input.graceDays));
  if (typeof input.etaDays === "number") snapshot.etaDays = Math.max(0, Math.round(input.etaDays));
  snapshot.pricing.recurring.enabled = snapshot.pricing.recurring.enabled && snapshot.pricing.recurring.amountUsd > 0;

  const rec: RecurringInit | null = snapshot.pricing.recurring.enabled
    ? {
        amountUsd: snapshot.pricing.recurring.amountUsd,
        periodMonths: snapshot.pricing.recurring.periodMonths,
        startsWhen: snapshot.pricing.recurring.startsWhen,
        firstPeriodFree: snapshot.pricing.recurring.firstPeriodFree,
        graceDays: snapshot.pricing.recurring.graceDays,
      }
    : null;

  const submission: Record<string, string> = {};
  if (input.note?.trim()) submission.note = input.note.trim();

  return createAppSubmission({
    ownerUid: input.ownerUid,
    ownerEmail: user.email,
    serviceType: "custom",
    appName: input.title.trim() || svc.name,
    contact: {
      fullName: user.fullName || user.email || "Mijoz",
      phone: user.phone || "-",
      email: user.email || "",
    },
    submission,
    servicePrice: snapshot.pricing.oneTime.amountUsd,
    catalogId: svc.id,
    catalogSnapshot: snapshot,
    recurring: rec,
    origin: "admin",
    actor: input.actor,
  });
}
