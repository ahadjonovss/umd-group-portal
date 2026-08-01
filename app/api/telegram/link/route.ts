import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/dal";
import { createTelegramLinkToken } from "@/lib/firestore/users";
import { getBotUsername } from "@/lib/telegram";
import { SITE_URL } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Foydalanuvchi "Telegramni ulash" tugmasini bosganda:
// bir martalik token yaratamiz va uni botning deep-link'iga yo'naltiramiz.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(`${SITE_URL}/login`);
  }
  try {
    const [token, botUsername] = await Promise.all([createTelegramLinkToken(user.uid), getBotUsername()]);
    return NextResponse.redirect(`https://t.me/${botUsername}?start=${token}`);
  } catch (e) {
    console.error("[telegram/link] xato:", e);
    return NextResponse.redirect(`${SITE_URL}/panel?tg=error`);
  }
}
