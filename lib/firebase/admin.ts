import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import {
  getFirestore,
  FieldValue,
  Timestamp,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
} from "firebase-admin/firestore";

// Server-side. FIREBASE_SERVICE_ACCOUNT — JSON service account (bitta qatorda).
// Eslatma: build webpack bilan qilinadi (next build --webpack) — Turbopack
// firebase-admin subpath'larini ESM deb require qilib ERR_REQUIRE_ESM beradi.
function getAdminApp(): App {
  const existing = getApps();
  if (existing.length) return existing[0];

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT env o'rnatilmagan");
  }
  return initializeApp({ credential: cert(JSON.parse(raw)) });
}

const app = getAdminApp();

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);

// Markazlashtirilgan re-export — boshqa fayllar subpath import qilmaydi.
export { FieldValue, Timestamp };
export type { DocumentSnapshot, QueryDocumentSnapshot };
