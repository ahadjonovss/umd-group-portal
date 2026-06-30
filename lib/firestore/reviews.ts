import "server-only";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type { ServiceType } from "@/types";

const REVIEWS = "reviews";

// Landing sahifa uchun ommaviy review ko'rinishi.
export interface PublicReview {
  id: string;
  date: string;
  name: string;
  rating: number;
  comment: string;
  serviceType: ServiceType | null;
  appName: string | null;
  isPublished: boolean;
}

// Faqat admin tasdiqlagan (approved:true) reviewlar, yangi -> eski.
export async function getApprovedReviews(max = 30): Promise<PublicReview[]> {
  const snap = await adminDb.collection(REVIEWS).where("approved", "==", true).get();
  const items: PublicReview[] = snap.docs.map((d) => {
    const x = d.data();
    const created = x.createdAt;
    return {
      id: d.id,
      date: created instanceof Timestamp ? created.toDate().toISOString() : "",
      name: x.name ?? "",
      rating: x.rating ?? 0,
      comment: x.comment ?? "",
      serviceType: (x.serviceType as ServiceType) ?? null,
      appName: x.appName ?? null,
      isPublished: Boolean(x.isPublished),
    };
  });
  items.sort((a, b) => b.date.localeCompare(a.date));
  return items.slice(0, max);
}

export interface CreateReviewInput {
  appId: string;
  ownerUid: string;
  name: string;
  rating: number;
  comment: string;
  serviceType: ServiceType;
  appName: string | null;
  isPublished: boolean; // ilova store'ga chiqqanmi
}

export async function createAppReview(input: CreateReviewInput): Promise<string> {
  const ref = adminDb.collection(REVIEWS).doc();
  await ref.set({
    appId: input.appId,
    ownerUid: input.ownerUid,
    name: input.name,
    rating: input.rating,
    comment: input.comment,
    serviceType: input.serviceType,
    appName: input.appName,
    isPublished: input.isPublished,
    approved: false, // admin tasdiqlasa saytda ko'rsatiladi
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

// Foydalanuvchi baholagan ilova ID'lari (tugma takror ko'rinmasligi uchun).
export async function getReviewedAppIds(ownerUid: string): Promise<Set<string>> {
  const snap = await adminDb.collection(REVIEWS).where("ownerUid", "==", ownerUid).get();
  const ids = new Set<string>();
  snap.forEach((d) => {
    const a = d.get("appId");
    if (typeof a === "string") ids.add(a);
  });
  return ids;
}

export async function hasReviewedApp(appId: string, ownerUid: string): Promise<boolean> {
  return (await getReviewedAppIds(ownerUid)).has(appId);
}

// ── Admin ──────────────────────────────────────
export interface AdminReview extends PublicReview {
  approved: boolean;
}

function mapAdminReview(d: FirebaseFirestore.DocumentSnapshot): AdminReview {
  const x = d.data() ?? {};
  const created = x.createdAt;
  return {
    id: d.id,
    date: created instanceof Timestamp ? created.toDate().toISOString() : "",
    name: x.name ?? "",
    rating: x.rating ?? 0,
    comment: x.comment ?? "",
    serviceType: (x.serviceType as ServiceType) ?? null,
    appName: x.appName ?? null,
    isPublished: Boolean(x.isPublished),
    approved: Boolean(x.approved),
  };
}

export async function getAllReviews(max = 100): Promise<AdminReview[]> {
  const snap = await adminDb.collection(REVIEWS).get();
  const items = snap.docs.map(mapAdminReview);
  items.sort((a, b) => b.date.localeCompare(a.date));
  return items.slice(0, max);
}

export async function getUserReviews(ownerUid: string): Promise<AdminReview[]> {
  const snap = await adminDb.collection(REVIEWS).where("ownerUid", "==", ownerUid).get();
  const items = snap.docs.map(mapAdminReview);
  items.sort((a, b) => b.date.localeCompare(a.date));
  return items;
}

export async function setReviewApproved(reviewId: string, approved: boolean): Promise<void> {
  await adminDb.collection(REVIEWS).doc(reviewId).update({ approved });
}

export async function deleteReview(reviewId: string): Promise<void> {
  await adminDb.collection(REVIEWS).doc(reviewId).delete();
}
