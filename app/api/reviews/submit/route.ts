import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { sendTelegramMessage } from "@/lib/telegram";

const STARS = ["", "⭐", "⭐⭐", "⭐⭐⭐", "⭐⭐⭐⭐", "⭐⭐⭐⭐⭐"];

function esc(t: string) {
  return t.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, "\\$&");
}

export async function POST(req: NextRequest) {
  const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
  if (!scriptUrl || scriptUrl.includes("your_apps_script")) {
    return NextResponse.json({ success: false, error: "Script URL sozlanmagan" }, { status: 500 });
  }

  let body: { name?: string; rating?: number; comment?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Noto'g'ri format" }, { status: 400 });
  }

  const { name, rating, comment } = body;

  if (!name || !rating || !comment) {
    return NextResponse.json({ success: false, error: "Barcha maydonlar to'ldirilishi kerak" }, { status: 400 });
  }
  if (rating < 1 || rating > 5) {
    return NextResponse.json({ success: false, error: "Reyting 1-5 orasida bo'lishi kerak" }, { status: 400 });
  }
  if (comment.length > 500) {
    return NextResponse.json({ success: false, error: "Izoh 500 belgidan oshmasin" }, { status: 400 });
  }

  const reviewId = randomUUID();

  // Google Sheets ga yozish (GET orqali — POST redirect muammosini oldini olish)
  try {
    const params = new URLSearchParams({
      action: "submit",
      id: reviewId,
      name,
      rating: String(rating),
      comment,
    });
    const res = await fetch(`${scriptUrl}?${params.toString()}`, {
      redirect: "follow",
      cache: "no-store",
    });
    const text = await res.text();

    // HTML login sahifasi kelsa tekshirish (faqat <!doctype bo'lsa)
    if (text.trimStart().toLowerCase().startsWith("<!doctype")) {
      console.error("[Reviews] Script HTML qaytardi:", text.slice(0, 200));
      return NextResponse.json({
        success: false,
        error: "Script ulanishda xato yuz berdi. Keyinroq urinib ko'ring.",
      }, { status: 500 });
    }
  } catch {
    return NextResponse.json({ success: false, error: "Yuborishda xato yuz berdi" }, { status: 500 });
  }

  // Telegram xabar
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const approveSecret = process.env.APPROVE_SECRET || "";
    const approveUrl = `${appUrl}/api/reviews/approve?id=${reviewId}&token=${approveSecret}`;

    const text =
      `⭐ *YANGI SHARH*\n\n` +
      `👤 Ism: ${esc(name)}\n` +
      `${STARS[rating]} Reyting: ${rating}/5\n` +
      `💬 Izoh: ${esc(comment)}\n\n` +
      `✅ [Saytda chiqarish](${esc(approveUrl)})`;

    await sendTelegramMessage(text);
  } catch {
    // Telegram xatosi bo'lsa ham submit muvaffaqiyatli hisoblanadi
  }

  return NextResponse.json({ success: true });
}
