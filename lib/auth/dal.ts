import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth } from "@/lib/firebase/admin";
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
