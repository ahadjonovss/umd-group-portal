import { NextRequest, NextResponse } from "next/server";
import { confirmPayment, rejectPayment } from "@/lib/firestore/payments";
import { answerCallbackQuery, editMessageReplyMarkup } from "@/lib/telegram";

export const runtime = "nodejs";

const SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

interface CallbackQuery {
  id: string;
  data?: string;
  message?: { message_id: number; chat: { id: number } };
}

export async function POST(req: NextRequest) {
  // Xavfsizlik: Telegram secret token
  if (SECRET) {
    const header = req.headers.get("x-telegram-bot-api-secret-token");
    if (header !== SECRET) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  let body: { callback_query?: CallbackQuery };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: true }); // e'tibor bermaymiz
  }

  const cq = body.callback_query;
  if (!cq || !cq.data || !cq.message) {
    return NextResponse.json({ ok: true });
  }

  const { id: callbackId, data } = cq;
  const chatId = cq.message.chat.id;
  const messageId = cq.message.message_id;

  // "noop" — allaqachon hal qilingan xabar tugmasi
  if (data === "noop") {
    await answerCallbackQuery(callbackId, "Bu to'lov allaqachon ko'rib chiqilgan");
    return NextResponse.json({ ok: true });
  }

  const [action, paymentId] = data.split(":");
  if (!paymentId) {
    await answerCallbackQuery(callbackId, "Noto'g'ri buyruq");
    return NextResponse.json({ ok: true });
  }

  try {
    if (action === "pc") {
      await confirmPayment(paymentId);
      await answerCallbackQuery(callbackId, "✅ To'lov tasdiqlandi");
      await editMessageReplyMarkup(chatId, messageId, {
        inline_keyboard: [[{ text: "✅ Tasdiqlandi", callback_data: "noop" }]],
      });
    } else if (action === "pr") {
      await rejectPayment(paymentId);
      await answerCallbackQuery(callbackId, "❌ To'lov rad etildi — mijoz qayta yuborishi mumkin");
      await editMessageReplyMarkup(chatId, messageId, {
        inline_keyboard: [[{ text: "❌ Rad etildi", callback_data: "noop" }]],
      });
    } else {
      await answerCallbackQuery(callbackId, "Noma'lum buyruq");
    }
  } catch (e) {
    console.error("[telegram/webhook] xato:", e);
    await answerCallbackQuery(callbackId, "Xatolik yuz berdi yoki allaqachon ko'rib chiqilgan");
  }

  return NextResponse.json({ ok: true });
}
