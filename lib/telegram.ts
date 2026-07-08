import axios from "axios";
import FormData from "form-data";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID!;
const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

const MAX_FILE_SIZE = 2000 * 1024 * 1024; // 2GB (local bot API)

export interface TelegramMessage {
  serviceName: string;
  appName?: string;
  clientName: string;
  phone: string;
  email: string;
  privacyPolicyUrl?: string;
}

export function buildTelegramCaption(msg: TelegramMessage): string {
  const now = new Date().toLocaleString("uz-UZ", { timeZone: "Asia/Tashkent" });
  return `🆕 *YANGI ARIZA*

📦 Xizmat: ${escapeMarkdown(msg.serviceName)}
${msg.appName ? `📱 Ilova: ${escapeMarkdown(msg.appName)}\n` : ""}👤 Mijoz: ${escapeMarkdown(msg.clientName)}
📞 Telefon: ${escapeMarkdown(msg.phone)}
📧 Email: ${escapeMarkdown(msg.email)}
${msg.privacyPolicyUrl ? `🔗 Privacy Policy: ${escapeMarkdown(msg.privacyPolicyUrl)}\n` : ""}
📎 ZIP fayl yuqorida ↑
⏰ ${escapeMarkdown(now)} \\(Toshkent vaqti\\)`;
}

function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, "\\$&");
}

export async function sendTelegramMessage(text: string): Promise<void> {
  const response = await axios.post(`${BASE_URL}/sendMessage`, {
    chat_id: CHANNEL_ID,
    text,
    parse_mode: "MarkdownV2",
    disable_web_page_preview: true,
  });
  if (!response.data.ok) {
    throw new Error(`Telegram xatosi: ${JSON.stringify(response.data)}`);
  }
}

// Inline tugma (callback) tipi
export type InlineKeyboard = { inline_keyboard: { text: string; callback_data: string }[][] };

// To'lov xabari uchun tasdiqlash/rad etish tugmalari
export function paymentButtons(paymentId: string): InlineKeyboard {
  return {
    inline_keyboard: [[
      { text: "✅ Tasdiqlash", callback_data: `pc:${paymentId}` },
      { text: "❌ Rad etish", callback_data: `pr:${paymentId}` },
    ]],
  };
}

export async function sendPhotoToTelegram(
  photoBuffer: Buffer,
  filename: string,
  caption: string,
  replyMarkup?: InlineKeyboard
): Promise<void> {
  const form = new FormData();
  form.append("chat_id", CHANNEL_ID);
  form.append("photo", photoBuffer, { filename, contentType: "image/jpeg" });
  form.append("caption", caption);
  form.append("parse_mode", "MarkdownV2");
  if (replyMarkup) form.append("reply_markup", JSON.stringify(replyMarkup));

  const response = await axios.post(`${BASE_URL}/sendPhoto`, form, {
    headers: form.getHeaders(),
    maxBodyLength: MAX_FILE_SIZE,
    maxContentLength: MAX_FILE_SIZE,
    timeout: 120000,
  });

  if (!response.data.ok) {
    throw new Error(`Telegram xatosi: ${JSON.stringify(response.data)}`);
  }
}

// Callback tugma bosilganda javob (yuqorida toast ko'rinadi)
export async function answerCallbackQuery(callbackQueryId: string, text: string): Promise<void> {
  try {
    await axios.post(`${BASE_URL}/answerCallbackQuery`, { callback_query_id: callbackQueryId, text });
  } catch {
    // jim
  }
}

// Xabar tugmalarini yangilaydi (natijani ko'rsatish / tugmalarni bloklash uchun)
export async function editMessageReplyMarkup(
  chatId: number | string,
  messageId: number,
  replyMarkup: InlineKeyboard
): Promise<void> {
  try {
    await axios.post(`${BASE_URL}/editMessageReplyMarkup`, {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: replyMarkup,
    });
  } catch (e) {
    console.error("[telegram] editMessageReplyMarkup xato:", e);
  }
}

export async function sendZipToTelegram(
  zipBuffer: Buffer,
  filename: string,
  caption: string
): Promise<void> {
  const form = new FormData();
  form.append("chat_id", CHANNEL_ID);
  form.append("document", zipBuffer, {
    filename,
    contentType: "application/zip",
  });
  form.append("caption", caption);
  form.append("parse_mode", "MarkdownV2");

  const response = await axios.post(`${BASE_URL}/sendDocument`, form, {
    headers: form.getHeaders(),
    maxBodyLength: MAX_FILE_SIZE,
    maxContentLength: MAX_FILE_SIZE,
    timeout: 120000,
  });

  if (!response.data.ok) {
    throw new Error(`Telegram xatosi: ${JSON.stringify(response.data)}`);
  }
}
