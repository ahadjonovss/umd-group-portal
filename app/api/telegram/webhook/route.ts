import { NextRequest, NextResponse } from "next/server";
import { confirmPayment, rejectPayment } from "@/lib/firestore/payments";
import { answerCallbackQuery, editMessageReplyMarkup, sendTelegramTo } from "@/lib/telegram";
import { consumeTelegramLinkToken, linkTelegramChat, getUserByChatId, setTelegramNotify } from "@/lib/firestore/users";

export const runtime = "nodejs";

const SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

interface CallbackQuery {
  id: string;
  data?: string;
  message?: { message_id: number; chat: { id: number } };
}

interface TgMessage {
  message_id: number;
  chat: { id: number };
  from?: { username?: string; first_name?: string };
  text?: string;
}

// Oddiy matnli xabarlar (/start <token>, /stop, ...) ni ishlaydi.
async function handleMessage(msg: TgMessage): Promise<void> {
  const chatId = msg.chat.id;
  const text = (msg.text || "").trim();

  // /start <token> — akkauntni ulash
  if (text.startsWith("/start")) {
    const token = text.split(/\s+/)[1];
    if (token) {
      const uid = await consumeTelegramLinkToken(token);
      if (uid) {
        await linkTelegramChat(uid, chatId, msg.from?.username);
        await sendTelegramTo(
          chatId,
          `✅ *Ulandingiz\\!*\n\nEndi ilovalaringiz bo'yicha barcha yangiliklarni shu yerda olib turasiz:\n• Status o'zgarishlari\n• To'lov tasdiqlash / rad etish\n• So'rovlar, obuna va update paketi\n\nXabarnomalarni to'xtatish uchun /stop yuboring\\.`
        );
      } else {
        await sendTelegramTo(chatId, `⚠️ Ulash havolasi eskirgan\\. Iltimos, kabinetdan qaytadan "Telegramni ulash" tugmasini bosing\\.`);
      }
    } else {
      await sendTelegramTo(
        chatId,
        `👋 *UMD GROUP botiga xush kelibsiz\\!*\n\nXabarnomalarni olish uchun kabinetdagi *"Telegramni ulash"* tugmasini bosing\\.`
      );
    }
    return;
  }

  // /stop — xabarnomalarni o'chirish
  if (text === "/stop") {
    const uid = await getUserByChatId(chatId);
    if (uid) {
      await setTelegramNotify(uid, false);
      await sendTelegramTo(chatId, `🔕 Xabarnomalar o'chirildi\\. Qayta yoqish uchun /start yuboring\\.`);
    }
    return;
  }

  // /start bilan qayta yoqish (ulangan bo'lsa)
  if (text === "/resume" || text === "/yoqish") {
    const uid = await getUserByChatId(chatId);
    if (uid) {
      await setTelegramNotify(uid, true);
      await sendTelegramTo(chatId, `🔔 Xabarnomalar qayta yoqildi\\.`);
    }
    return;
  }
}

export async function POST(req: NextRequest) {
  // Xavfsizlik: Telegram secret token
  if (SECRET) {
    const header = req.headers.get("x-telegram-bot-api-secret-token");
    if (header !== SECRET) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  let body: { callback_query?: CallbackQuery; message?: TgMessage };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: true }); // e'tibor bermaymiz
  }

  // Oddiy matnli xabar (/start, /stop, ...)
  if (body.message?.text) {
    try {
      await handleMessage(body.message);
    } catch (e) {
      console.error("[telegram/webhook] message xato:", e);
    }
    return NextResponse.json({ ok: true });
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
    const tgActor = { type: "admin" as const, name: "Admin (Telegram)", uid: null };
    if (action === "pc") {
      await confirmPayment(paymentId, undefined, tgActor);
      await answerCallbackQuery(callbackId, "✅ To'lov tasdiqlandi");
      await editMessageReplyMarkup(chatId, messageId, {
        inline_keyboard: [[{ text: "✅ Tasdiqlandi", callback_data: "noop" }]],
      });
    } else if (action === "pr") {
      await rejectPayment(paymentId, tgActor);
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
