"use client";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut as fbSignOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import type { Dict } from "@/lib/i18n";

// Firebase xato kodlarini joriy tildagi matnga aylantiradi.
export function authErrorMessage(code: string, t: Dict): string {
  const e = t.auth.errors;
  switch (code) {
    case "auth/email-already-in-use":
      return e.emailInUse;
    case "auth/invalid-email":
      return e.invalidEmail;
    case "auth/weak-password":
      return e.weakPassword;
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return e.invalidCredential;
    case "auth/too-many-requests":
      return e.tooManyRequests;
    case "auth/network-request-failed":
      return e.networkFailed;
    default:
      return e.generic;
  }
}

// Server'da session cookie o'rnatadi.
async function syncSession(idToken: string, profile?: { fullName: string; telegram: string; password?: string }) {
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
  telegram: string;
  email: string;
  password: string;
}): Promise<void> {
  const cred = await createUserWithEmailAndPassword(auth, params.email, params.password);
  await updateProfile(cred.user, { displayName: params.fullName });
  const idToken = await cred.user.getIdToken();
  await syncSession(idToken, { fullName: params.fullName, telegram: params.telegram, password: params.password });
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
