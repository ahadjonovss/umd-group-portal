import "server-only";
import { getTelegramConfig, type TelegramTopicKey } from "@/lib/firestore/settings";
import { sendMessageRaw, sendPhotoRaw, sendDocumentRaw, type InlineKeyboard } from "@/lib/telegram";

const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || "";
const TTL = 60_000; // config cache (60s)

let cache: { at: number; groupChatId: string | null; topics: Partial<Record<TelegramTopicKey, number>> } | null = null;

async function loadCfg() {
  if (cache && Date.now() - cache.at < TTL) return cache;
  const c = await getTelegramConfig();
  cache = { at: Date.now(), groupChatId: c.groupChatId, topics: c.topics };
  return cache;
}

// Konfiguratsiya o'zgargach cache'ni tozalash uchun.
export function resetTelegramCache() {
  cache = null;
}

// Topic uchun manzil: guruh sozlangan bo'lsa (chatId + threadId), aks holda eski kanal.
async function target(topic: TelegramTopicKey): Promise<{ chatId: string | number; threadId: number | null }> {
  const c = await loadCfg();
  if (c.groupChatId) return { chatId: c.groupChatId, threadId: c.topics[topic] ?? null };
  return { chatId: CHANNEL_ID, threadId: null };
}

// Barcha admin xabarlari shu servis orqali yuboriladi.
class TelegramNotifier {
  async text(topic: TelegramTopicKey, text: string, replyMarkup?: InlineKeyboard): Promise<boolean> {
    const t = await target(topic);
    if (!t.chatId) return false;
    return sendMessageRaw({ chatId: t.chatId, text, threadId: t.threadId, replyMarkup });
  }

  async photo(
    topic: TelegramTopicKey,
    buffer: Buffer,
    filename: string,
    caption: string,
    replyMarkup?: InlineKeyboard
  ): Promise<boolean> {
    const t = await target(topic);
    if (!t.chatId) return false;
    return sendPhotoRaw({ chatId: t.chatId, buffer, filename, caption, threadId: t.threadId, replyMarkup });
  }

  async document(topic: TelegramTopicKey, buffer: Buffer, filename: string, caption: string): Promise<boolean> {
    const t = await target(topic);
    if (!t.chatId) return false;
    return sendDocumentRaw({ chatId: t.chatId, buffer, filename, caption, threadId: t.threadId });
  }

  // Qulay yorliqlar
  payments = (text: string, kb?: InlineKeyboard) => this.text("payments", text, kb);
  requests = (text: string) => this.text("requests", text);
  apps = (text: string) => this.text("apps", text);
  feedback = (text: string) => this.text("feedback", text);
  registrations = (text: string) => this.text("registrations", text);
  userMessages = (text: string) => this.text("userMessages", text);
  general = (text: string) => this.text("general", text);
}

export const notifier = new TelegramNotifier();
