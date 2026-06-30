import "server-only";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb, adminAuth } from "@/lib/firebase/admin";

export interface AdminUser {
  uid: string;
  email: string | null;
  fullName: string;
  phone: string;
  telegram: string;
  role: string | null;
  createdAt: string | null;
  appCount?: number;
}

function mapUser(d: FirebaseFirestore.DocumentSnapshot): AdminUser {
  const x = d.data() ?? {};
  return {
    uid: d.id,
    email: x.email ?? null,
    fullName: x.fullName ?? "",
    phone: x.phone ?? "",
    telegram: x.telegram ?? "",
    role: x.role ?? null,
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

export async function setUserRole(uid: string, makeAdmin: boolean): Promise<void> {
  await adminDb
    .collection("users")
    .doc(uid)
    .update({ role: makeAdmin ? "admin" : FieldValue.delete() });
}
