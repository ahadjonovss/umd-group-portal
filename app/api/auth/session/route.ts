import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb, FieldValue } from "@/lib/firebase/admin";
import { createSession, destroySession } from "@/lib/auth/session";

export const runtime = "nodejs";

interface SessionBody {
  idToken?: string;
  profile?: { fullName?: string; telegram?: string };
}

// Login/Register: client idToken yuboradi → session cookie o'rnatiladi.
// profile berilsa (register), users/{uid} hujjati yaratiladi/yangilanadi.
export async function POST(req: NextRequest) {
  let body: SessionBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Noto'g'ri format" }, { status: 400 });
  }

  const { idToken, profile } = body;
  if (!idToken) {
    return NextResponse.json({ success: false, error: "idToken yo'q" }, { status: 400 });
  }

  let uid: string;
  let email: string | null;
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    uid = decoded.uid;
    email = decoded.email ?? null;
  } catch {
    return NextResponse.json({ success: false, error: "Token tasdiqlanmadi" }, { status: 401 });
  }

  // users/{uid} hujjati — register'da to'liq, login'da faqat oxirgi kirish vaqti.
  try {
    const userRef = adminDb.collection("users").doc(uid);
    const base = {
      email,
      lastLoginAt: FieldValue.serverTimestamp(),
    };
    if (profile) {
      await userRef.set(
        {
          ...base,
          fullName: profile.fullName ?? "",
          telegram: profile.telegram ?? "",
          createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    } else {
      await userRef.set(base, { merge: true });
    }
  } catch (e) {
    console.error("[auth/session] users hujjatini yozishda xato:", e);
    // Hujjat xatosi sessiyani to'xtatmaydi.
  }

  try {
    await createSession(idToken);
  } catch (e) {
    console.error("[auth/session] session cookie xato:", e);
    return NextResponse.json({ success: false, error: "Sessiya yaratilmadi" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// Logout
export async function DELETE() {
  await destroySession();
  return NextResponse.json({ success: true });
}
