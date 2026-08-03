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

// ── Past darajali (thread-aware) yuboruvchilar ─────────────────────
// Guruh topiclariga (message_thread_id) yoki oddiy chatga yuborish uchun.
type Keyboard = { inline_keyboard: { text: string; callback_data?: string; url?: string }[][] };

export async function sendMessageRaw(opts: {
  chatId: string | number;
  text: string;
  threadId?: number | null;
  replyMarkup?: Keyboard;
}): Promise<boolean> {
  try {
    const res = await axios.post(`${BASE_URL}/sendMessage`, {
      chat_id: opts.chatId,
      text: opts.text,
      parse_mode: "MarkdownV2",
      disable_web_page_preview: true,
      ...(opts.threadId ? { message_thread_id: opts.threadId } : {}),
      ...(opts.replyMarkup ? { reply_markup: opts.replyMarkup } : {}),
    });
    return Boolean(res.data?.ok);
  } catch (e) {
    console.error("[telegram] sendMessageRaw:", e instanceof Error ? e.message : e);
    return false;
  }
}

export async function sendPhotoRaw(opts: {
  chatId: string | number;
  buffer: Buffer;
  filename: string;
  caption: string;
  threadId?: number | null;
  replyMarkup?: Keyboard;
}): Promise<boolean> {
  try {
    const form = new FormData();
    form.append("chat_id", String(opts.chatId));
    if (opts.threadId) form.append("message_thread_id", String(opts.threadId));
    form.append("photo", opts.buffer, { filename: opts.filename, contentType: "image/jpeg" });
    form.append("caption", opts.caption);
    form.append("parse_mode", "MarkdownV2");
    if (opts.replyMarkup) form.append("reply_markup", JSON.stringify(opts.replyMarkup));
    const res = await axios.post(`${BASE_URL}/sendPhoto`, form, {
      headers: form.getHeaders(),
      maxBodyLength: MAX_FILE_SIZE,
      maxContentLength: MAX_FILE_SIZE,
      timeout: 120000,
    });
    return Boolean(res.data?.ok);
  } catch (e) {
    console.error("[telegram] sendPhotoRaw:", e instanceof Error ? e.message : e);
    return false;
  }
}

export async function sendDocumentRaw(opts: {
  chatId: string | number;
  buffer: Buffer;
  filename: string;
  caption: string;
  threadId?: number | null;
}): Promise<boolean> {
  try {
    const form = new FormData();
    form.append("chat_id", String(opts.chatId));
    if (opts.threadId) form.append("message_thread_id", String(opts.threadId));
    form.append("document", opts.buffer, { filename: opts.filename, contentType: "application/zip" });
    form.append("caption", opts.caption);
    form.append("parse_mode", "MarkdownV2");
    const res = await axios.post(`${BASE_URL}/sendDocument`, form, {
      headers: form.getHeaders(),
      maxBodyLength: MAX_FILE_SIZE,
      maxContentLength: MAX_FILE_SIZE,
      timeout: 120000,
    });
    return Boolean(res.data?.ok);
  } catch (e) {
    console.error("[telegram] sendDocumentRaw:", e instanceof Error ? e.message : e);
    return false;
  }
}

// Bot username (deep-link uchun) — getMe orqali bir marta olinadi va cache qilinadi.
let cachedBotUsername: string | null = null;
export async function getBotUsername(): Promise<string> {
  if (cachedBotUsername) return cachedBotUsername;
  const res = await axios.get(`${BASE_URL}/getMe`);
  const username = res.data?.result?.username;
  if (!username) throw new Error("Bot username olinmadi");
  cachedBotUsername = username;
  return username;
}

// Berilgan chatga oddiy matn yuboradi (foydalanuvchiga to'g'ridan-to'g'ri).
// Yuborilsa true, aks holda (bloklangan/xato) false — hech qachon throw qilmaydi.
export async function sendTelegramTo(chatId: string | number, text: string, replyMarkup?: Keyboard): Promise<boolean> {
  try {
    const res = await axios.post(`${BASE_URL}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: "MarkdownV2",
      disable_web_page_preview: true,
      ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
    });
    return Boolean(res.data?.ok);
  } catch (e) {
    console.error("[telegram] sendTelegramTo xato:", e instanceof Error ? e.message : e);
    return false;
  }
}

// Inline tugma tipi (callback yoki url)
export type InlineKeyboard = { inline_keyboard: { text: string; callback_data?: string; url?: string }[][] };

// Bitta URL tugmasi (havola tugmasi)
export function urlButton(text: string, url: string): InlineKeyboard {
  return { inline_keyboard: [[{ text, url }]] };
}

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
