import "server-only";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";

export interface AdminUser {
  uid: string;
  email: string | null;
  fullName: string;
  phone: string;
  role: string | null;
  createdAt: string | null;
  appCount?: number;
}

export async function getAllUsers(): Promise<AdminUser[]> {
  const snap = await adminDb.collection("users").get();
  const users: AdminUser[] = snap.docs.map((d) => {
    const x = d.data();
    return {
      uid: d.id,
      email: x.email ?? null,
      fullName: x.fullName ?? "",
      phone: x.phone ?? "",
      role: x.role ?? null,
      createdAt: x.createdAt instanceof Timestamp ? x.createdAt.toDate().toISOString() : null,
    };
  });
  users.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  return users;
}

export async function setUserRole(uid: string, makeAdmin: boolean): Promise<void> {
  await adminDb
    .collection("users")
    .doc(uid)
    .update({ role: makeAdmin ? "admin" : FieldValue.delete() });
}
