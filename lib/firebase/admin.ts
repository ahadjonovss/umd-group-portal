import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

// Server-side (route handlers). Uses a service account credential.
// FIREBASE_SERVICE_ACCOUNT — JSON service account kaliti (bitta qatorda).
function getAdminApp(): App {
  const existing = getApps();
  if (existing.length) return existing[0];

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT env o'rnatilmagan");
  }
  const serviceAccount = JSON.parse(raw);

  return initializeApp({
    credential: cert(serviceAccount),
  });
}

export const adminAuth: Auth = getAuth(getAdminApp());
export const adminDb: Firestore = getFirestore(getAdminApp());
