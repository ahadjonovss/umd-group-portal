import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { SESSION_COOKIE } from "@/lib/auth/constants";

export interface SessionUser {
  uid: string;
  email: string | null;
  name: string | null;
}

// Session cookie'ni o'qib, Firebase admin orqali tasdiqlaydi.
// React cache — bitta render davomida bir marta tekshiriladi.
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const cookie = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!cookie) return null;
  try {
    // checkRevoked = true — o'chirilgan/bekor qilingan sessiyalar rad etiladi.
    const decoded = await adminAuth.verifySessionCookie(cookie, true);
    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      name: (decoded.name as string | undefined) ?? null,
    };
  } catch {
    return null;
  }
});

// Himoyalangan server kodida ishlatiladi — user yo'q bo'lsa /login ga yuboradi.
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

// users/{uid}.role o'qiydi.
export const getUserRole = cache(async (uid: string): Promise<string | null> => {
  try {
    const doc = await adminDb.collection("users").doc(uid).get();
    return (doc.get("role") as string | undefined) ?? null;
  } catch {
    return null;
  }
});

export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return (await getUserRole(user.uid)) === "admin";
}

// Admin-only sahifalar uchun — admin bo'lmasa bosh sahifaga.
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  const role = await getUserRole(user.uid);
  if (role !== "admin") redirect("/");
  return user;
}
