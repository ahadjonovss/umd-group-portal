import "server-only";
import { getUserTelegram } from "@/lib/firestore/users";
import { sendTelegramTo } from "@/lib/telegram";
import { notifier } from "@/lib/telegram-notifier";
import { SITE_URL } from "@/lib/site";

// MarkdownV2 uchun maxsus belgilarni ekranlaydi.
export function esc(t: string): string {
  return String(t).replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, "\\$&");
}

// Ilova havolasi (kabinet) — MarkdownV2 inline link.
export function appLink(appId: string): string {
  return `\n\n[🔗 Kabinetda ochish](${SITE_URL}/panel/app/${appId})`;
}

// Foydalanuvchiga Telegram xabari yuboradi. Ulanmagan yoki o'chirilgan bo'lsa jim o'tadi.
// Hech qachon throw qilmaydi — status/to'lov amallarini buzmaydi.
export async function notifyUser(uid: string, text: string): Promise<void> {
  try {
    if (!uid) return;
    const tg = await getUserTelegram(uid);
    if (!tg.chatId || !tg.notify) return;
    const ok = await sendTelegramTo(tg.chatId, text);
    // Yuborilgan xabar nusxasini admin "Xabarlar" topicга
    if (ok) {
      const who = tg.fullName || tg.email || (tg.username ? `@${tg.username}` : uid);
      await notifier.userMessages(`👤 *${esc(who)}* ga yuborildi:\n\n${text}`);
    }
  } catch (e) {
    console.error("[notify] xato:", e instanceof Error ? e.message : e);
  }
}
