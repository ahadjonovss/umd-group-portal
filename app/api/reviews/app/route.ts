import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/dal";
import { adminDb } from "@/lib/firebase/admin";
import { createAppReview, hasReviewedApp } from "@/lib/firestore/reviews";
import { isTerminalSuccess, type AppStatus } from "@/lib/app-status";
import { sendTelegramMessage } from "@/lib/telegram";
import type { ServiceType } from "@/types";

export const runtime = "nodejs";

const STARS = ["", "⭐", "⭐⭐", "⭐⭐⭐", "⭐⭐⭐⭐", "⭐⭐⭐⭐⭐"];
function esc(t: string) {
  return t.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, "\\$&");
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Avval tizimga kiring" }, { status: 401 });
  }

  let body: { rating?: number; comment?: string; appId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Noto'g'ri format" }, { status: 400 });
  }

  const { rating, comment, appId } = body;
  if (!appId) {
    return NextResponse.json({ success: false, error: "appId yo'q" }, { status: 400 });
  }
  if (!rating || !comment) {
    return NextResponse.json({ success: false, error: "Reyting va izoh to'ldirilishi kerak" }, { status: 400 });
  }
  if (rating < 1 || rating > 5) {
    return NextResponse.json({ success: false, error: "Reyting 1-5 orasida bo'lishi kerak" }, { status: 400 });
  }
  if (comment.length > 500) {
    return NextResponse.json({ success: false, error: "Izoh 500 belgidan oshmasin" }, { status: 400 });
  }

  // Ilovani tekshirish: mavjud, egasi shu user, va yakunlangan bo'lishi kerak.
  const snap = await adminDb.collection("apps").doc(appId).get();
  if (!snap.exists) {
    return NextResponse.json({ success: false, error: "Ariza topilmadi" }, { status: 404 });
  }
  const app = snap.data()!;
  if (app.ownerUid !== user.uid) {
    return NextResponse.json({ success: false, error: "Ruxsat yo'q" }, { status: 403 });
  }
  if (!isTerminalSuccess(app.status as AppStatus)) {
    return NextResponse.json({ success: false, error: "Xizmat hali yakunlanmagan" }, { status: 400 });
  }

  // Takroriy baholashni oldini olish
  if (await hasReviewedApp(appId, user.uid)) {
    return NextResponse.json({ success: false, error: "Bu xizmatni allaqachon baholagansiz" }, { status: 409 });
  }

  const serviceType = app.serviceType as ServiceType;
  const appName = (app.appName as string | null) ?? null;
  const isPublished = app.status === "published";

  // Ism client'dan emas — login qilgan foydalanuvchidan olinadi.
  const reviewerName =
    user.name?.trim() ||
    (app.contact?.fullName as string | undefined)?.trim() ||
    user.email ||
    "Mijoz";

  try {
    await createAppReview({
      appId,
      ownerUid: user.uid,
      name: reviewerName,
      rating,
      comment: comment.trim(),
      serviceType,
      appName,
      isPublished,
    });
  } catch (e) {
    console.error("[reviews/app] Firestore yozishda xato:", e);
    return NextResponse.json({ success: false, error: "Sharhni saqlashda xato" }, { status: 500 });
  }

  // Telegram xabar (ixtiyoriy — non-fatal)
  try {
    const text =
      `⭐ *YANGI XIZMAT SHARHI*\n\n` +
      `👤 ${esc(reviewerName)}\n` +
      `${STARS[rating]} ${rating}/5\n` +
      `📦 ${esc(appName || serviceType)}\n` +
      `💬 ${esc(comment.trim())}`;
    await sendTelegramMessage(text);
  } catch {
    // jiddiy emas
  }

  return NextResponse.json({ success: true });
}
