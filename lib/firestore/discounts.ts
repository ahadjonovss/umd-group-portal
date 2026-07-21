import "server-only";
import { adminDb, FieldValue, Timestamp, type DocumentSnapshot } from "@/lib/firebase/admin";
import type { DiscountService } from "@/lib/discount";

const COL = "discounts";

export interface DiscountView {
  id: string;
  ownerUid: string;
  ownerEmail: string | null;
  ownerName: string | null;
  service: DiscountService;
  percent: number;
  status: "active" | "used" | "expired";
  daysValid: number;
  boundAppId: string | null;
  expiresAt: string | null;
  createdAt: string | null;
  usedAt: string | null;
}

function iso(v: unknown): string | null {
  return v instanceof Timestamp ? v.toDate().toISOString() : null;
}

function map(d: DocumentSnapshot): DiscountView {
  const x = d.data() ?? {};
  return {
    id: d.id,
    ownerUid: x.ownerUid ?? "",
    ownerEmail: x.ownerEmail ?? null,
    ownerName: x.ownerName ?? null,
    service: (x.service as DiscountService) ?? "publish",
    percent: x.percent ?? 0,
    status: (x.status as DiscountView["status"]) ?? "active",
    daysValid: x.daysValid ?? 0,
    boundAppId: x.boundAppId ?? null,
    expiresAt: iso(x.expiresAt),
    createdAt: iso(x.createdAt),
    usedAt: iso(x.usedAt),
  };
}

export async function createDiscount(input: {
  ownerUid: string;
  ownerEmail: string | null;
  ownerName: string | null;
  service: DiscountService;
  percent: number;
  daysValid: number;
}): Promise<string> {
  const expiresAt = Timestamp.fromDate(new Date(Date.now() + input.daysValid * 24 * 60 * 60 * 1000));
  const ref = adminDb.collection(COL).doc();
  await ref.set({
    ownerUid: input.ownerUid,
    ownerEmail: input.ownerEmail,
    ownerName: input.ownerName,
    service: input.service,
    percent: Math.max(1, Math.min(100, Math.round(input.percent))),
    status: "active",
    daysValid: input.daysValid,
    boundAppId: null,
    expiresAt,
    createdAt: FieldValue.serverTimestamp(),
    usedAt: null,
  });
  return ref.id;
}

// Faol (ishlatilmagan, muddati o'tmagan) chegirma. appId berilsa — shu ilovaga
// biriktirilgani ustun; aks holda biriktirilmagan (bo'sh) chegirma.
export async function getActiveDiscount(
  ownerUid: string,
  service: DiscountService,
  appId?: string
): Promise<{ id: string; percent: number } | null> {
  const snap = await adminDb
    .collection(COL)
    .where("ownerUid", "==", ownerUid)
    .where("service", "==", service)
    .where("status", "==", "active")
    .get();
  if (snap.empty) return null;

  const now = Date.now();
  const valid = snap.docs
    .map(map)
    .filter((d) => d.expiresAt && new Date(d.expiresAt).getTime() > now);
  if (!valid.length) return null;

  // Shu ilovaga biriktirilgan bo'lsa — o'sha; aks holda biriktirilmagan
  const bound = appId ? valid.find((d) => d.boundAppId === appId) : undefined;
  const chosen = bound || valid.find((d) => !d.boundAppId) || null;
  if (!chosen) return null;
  return { id: chosen.id, percent: chosen.percent };
}

export async function bindDiscount(id: string, appId: string): Promise<void> {
  await adminDb.collection(COL).doc(id).set({ boundAppId: appId }, { merge: true });
}

export async function markDiscountUsed(id: string): Promise<void> {
  await adminDb.collection(COL).doc(id).update({ status: "used", usedAt: FieldValue.serverTimestamp() });
}

// Foydalanuvchining amaldagi (faol, muddati o'tmagan) chegirmalari — panelда ko'rsatish uchun
export async function getUserActiveDiscounts(ownerUid: string): Promise<DiscountView[]> {
  const snap = await adminDb
    .collection(COL)
    .where("ownerUid", "==", ownerUid)
    .where("status", "==", "active")
    .get();
  const now = Date.now();
  return snap.docs
    .map(map)
    .filter((d) => d.expiresAt && new Date(d.expiresAt).getTime() > now)
    .sort((a, b) => (a.expiresAt ?? "").localeCompare(b.expiresAt ?? ""));
}

export async function getAllDiscounts(): Promise<DiscountView[]> {
  const snap = await adminDb.collection(COL).get();
  const now = Date.now();
  const items = snap.docs.map(map).map((d) => {
    // muddati o'tgan active'ni ko'rinishda "expired" deb belgilaymiz
    if (d.status === "active" && d.expiresAt && new Date(d.expiresAt).getTime() <= now) {
      return { ...d, status: "expired" as const };
    }
    return d;
  });
  items.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  return items;
}

export async function deleteDiscount(id: string): Promise<void> {
  await adminDb.collection(COL).doc(id).delete();
}
