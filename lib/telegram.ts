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

export async function sendPhotoToTelegram(
  photoBuffer: Buffer,
  filename: string,
  caption: string
): Promise<void> {
  const form = new FormData();
  form.append("chat_id", CHANNEL_ID);
  form.append("photo", photoBuffer, { filename, contentType: "image/jpeg" });
  form.append("caption", caption);
  form.append("parse_mode", "MarkdownV2");

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
