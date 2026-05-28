import { NextRequest, NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/telegram";

const STARS = ["", "⭐", "⭐⭐", "⭐⭐⭐", "⭐⭐⭐⭐", "⭐⭐⭐⭐⭐"];

function esc(t: string) {
  return t.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, "\\$&");
}

export async function POST(req: NextRequest) {
  try {
    const { name, rating, comment, id } = await req.json();
    if (!name || !rating || !comment) return NextResponse.json({ ok: true });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    const approveSecret = process.env.APPROVE_SECRET || "";
    const approveUrl = `${appUrl}/api/reviews/approve?id=${id}&token=${approveSecret}`;

    const text =
      `⭐ *YANGI SHARH*\n\n` +
      `👤 Ism: ${esc(name)}\n` +
      `${STARS[rating] || ""} Reyting: ${rating}/5\n` +
      `💬 Izoh: ${esc(comment)}\n\n` +
      `✅ [Saytda chiqarish](${esc(approveUrl)})`;

    await sendTelegramMessage(text);
  } catch {}

  return NextResponse.json({ ok: true });
}
