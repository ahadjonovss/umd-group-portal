import "server-only";
import { adminDb, adminAuth, FieldValue, Timestamp, type DocumentSnapshot } from "@/lib/firebase/admin";

export interface AdminUser {
  uid: string;
  email: string | null;
  fullName: string;
  phone: string;
  telegram: string;
  role: string | null;
  passwordPlain: string | null; // admin ko'rishi uchun (faqat panel orqali o'rnatilganlar)
  createdAt: string | null;
  appCount?: number;
}

function mapUser(d: DocumentSnapshot): AdminUser {
  const x = d.data() ?? {};
  return {
    uid: d.id,
    email: x.email ?? null,
    fullName: x.fullName ?? "",
    phone: x.phone ?? "",
    telegram: x.telegram ?? "",
    role: x.role ?? null,
    passwordPlain: x.passwordPlain ?? null,
    createdAt: x.createdAt instanceof Timestamp ? x.createdAt.toDate().toISOString() : null,
  };
}

export async function getAllUsers(): Promise<AdminUser[]> {
  const snap = await adminDb.collection("users").get();
  const users = snap.docs.map(mapUser);
  users.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  return users;
}

export async function getUser(uid: string): Promise<AdminUser | null> {
  const d = await adminDb.collection("users").doc(uid).get();
  if (!d.exists) return null;
  return mapUser(d);
}

export async function setUserPassword(uid: string, password: string): Promise<void> {
  await adminAuth.updateUser(uid, { password });
  // Admin ko'rishi uchun ochiq nusxa (Firebase hash'ni qaytarmaydi)
  await adminDb.collection("users").doc(uid).set({ passwordPlain: password }, { merge: true });
}

// Login emailini yangilaydi: Auth + users hujjati + ilovalardagi ownerEmail/contact.email.
export async function setUserEmail(uid: string, email: string): Promise<void> {
  await adminAuth.updateUser(uid, { email });
  await adminDb.collection("users").doc(uid).set({ email }, { merge: true });

  const appsSnap = await adminDb.collection("apps").where("ownerUid", "==", uid).get();
  if (!appsSnap.empty) {
    const batch = adminDb.batch();
    appsSnap.forEach((d) => batch.update(d.ref, { ownerEmail: email, "contact.email": email }));
    await batch.commit();
  }
}

// Admin: foydalanuvchini + uning ilovalari, to'lovlari, sharhlarini + Auth akkauntini o'chiradi.
export async function deleteUser(uid: string): Promise<void> {
  const [apps, pays, revs] = await Promise.all([
    adminDb.collection("apps").where("ownerUid", "==", uid).get(),
    adminDb.collection("payments").where("ownerUid", "==", uid).get(),
    adminDb.collection("reviews").where("ownerUid", "==", uid).get(),
  ]);
  const batch = adminDb.batch();
  apps.forEach((d) => batch.delete(d.ref));
  pays.forEach((d) => batch.delete(d.ref));
  revs.forEach((d) => batch.delete(d.ref));
  batch.delete(adminDb.collection("users").doc(uid));
  await batch.commit();
  try {
    await adminAuth.deleteUser(uid);
  } catch {
    // Auth'da bo'lmasa ham davom etamiz
  }
}

export async function setUserRole(uid: string, makeAdmin: boolean): Promise<void> {
  await adminDb
    .collection("users")
    .doc(uid)
    .update({ role: makeAdmin ? "admin" : FieldValue.delete() });
}

// Admin: profil ma'lumotlarini (ism, telefon, telegram) yangilaydi.
export async function setUserProfile(
  uid: string,
  data: { fullName: string; phone: string; telegram: string }
): Promise<void> {
  const fullName = data.fullName.trim();
  const phone = data.phone.trim();
  const telegram = data.telegram.trim().replace(/^@/, "");
  await adminDb.collection("users").doc(uid).set({ fullName, phone, telegram }, { merge: true });
  try {
    await adminAuth.updateUser(uid, { displayName: fullName });
  } catch {
    // Auth displayName yangilanmasa ham jiddiy emas
  }
}
