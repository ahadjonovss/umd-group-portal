import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { adminAuth } from "@/lib/firebase/admin";
import { getUserByChatId } from "@/lib/firestore/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_AGE_SEC = 24 * 60 * 60; // initData 1 kundan eski bo'lmasin

// Telegram Web App initData imzosini bot token bilan tekshiradi.
function verifyInitData(initData: string, botToken: string): { ok: boolean; userId?: string; username?: string } {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return { ok: false };
  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join("\n");

  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const computed = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  if (computed !== hash) return { ok: false };

  // Yangi (replay'дан himoya)
  const authDate = Number(params.get("auth_date") || 0);
  if (!authDate || Date.now() / 1000 - authDate > MAX_AGE_SEC) return { ok: false };

  try {
    const user = JSON.parse(params.get("user") || "{}");
    if (!user?.id) return { ok: false };
    return { ok: true, userId: String(user.id), username: user.username };
  } catch {
    return { ok: false };
  }
}

export async function POST(req: NextRequest) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return NextResponse.json({ success: false, error: "Bot sozlanmagan" }, { status: 500 });

  let body: { initData?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Noto'g'ri format" }, { status: 400 });
  }
  if (!body.initData) return NextResponse.json({ success: false, error: "initData yo'q" }, { status: 400 });

  const v = verifyInitData(body.initData, token);
  if (!v.ok || !v.userId) {
    return NextResponse.json({ success: false, error: "Imzo tasdiqlanmadi" }, { status: 401 });
  }

  // Telegram chat_id (shaxsiy chatda == user.id) bo'yicha ulangan foydalanuvchini topamiz
  const uid = await getUserByChatId(v.userId);
  if (!uid) {
    return NextResponse.json(
      { success: false, error: "not_linked", message: "Bu Telegram hisobi hali kabinetга ulanmagan" },
      { status: 404 }
    );
  }

  try {
    const customToken = await adminAuth.createCustomToken(uid);
    return NextResponse.json({ success: true, token: customToken });
  } catch (e) {
    console.error("[miniapp-auth] custom token xato:", e);
    return NextResponse.json({ success: false, error: "Token yaratilmadi" }, { status: 500 });
  }
}
