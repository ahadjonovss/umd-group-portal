"use client";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut as fbSignOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";

// Firebase xato kodlarini o'zbekcha matnga aylantiradi.
export function authErrorMessage(code: string): string {
  switch (code) {
    case "auth/email-already-in-use":
      return "Bu email allaqachon ro'yxatdan o'tgan";
    case "auth/invalid-email":
      return "Email format noto'g'ri";
    case "auth/weak-password":
      return "Parol juda oddiy (kamida 6 belgi)";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Email yoki parol noto'g'ri";
    case "auth/too-many-requests":
      return "Juda ko'p urinish. Birozdan keyin qayta urining";
    case "auth/network-request-failed":
      return "Tarmoq xatosi. Internetni tekshiring";
    default:
      return "Xatolik yuz berdi. Qayta urining";
  }
}

// Server'da session cookie o'rnatadi.
async function syncSession(idToken: string, profile?: { fullName: string; phone: string }) {
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken, profile }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Sessiya yaratilmadi");
  }
}

export async function registerWithEmail(params: {
  fullName: string;
  phone: string;
  email: string;
  password: string;
}): Promise<void> {
  const cred = await createUserWithEmailAndPassword(auth, params.email, params.password);
  await updateProfile(cred.user, { displayName: params.fullName });
  const idToken = await cred.user.getIdToken();
  await syncSession(idToken, { fullName: params.fullName, phone: params.phone });
}

export async function loginWithEmail(email: string, password: string): Promise<void> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const idToken = await cred.user.getIdToken();
  await syncSession(idToken);
}

export async function logout(): Promise<void> {
  await fbSignOut(auth);
  await fetch("/api/auth/session", { method: "DELETE" });
}
