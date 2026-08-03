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
    if (!tg.notify || tg.chatIds.length === 0) return;
    // Barcha ulangan Telegram akkauntlariga yuboramiz
    let anyOk = false;
    for (const chatId of tg.chatIds) {
      const ok = await sendTelegramTo(chatId, text);
      anyOk = anyOk || ok;
    }
    // Yuborilgan xabar nusxasini admin "Xabarlar" topicга (bir marta)
    if (anyOk) {
      const who = tg.fullName || tg.email || (tg.username ? `@${tg.username}` : uid);
      await notifier.userMessages(`👤 *${esc(who)}* ga yuborildi:\n\n${text}`);
    }
  } catch (e) {
    console.error("[notify] xato:", e instanceof Error ? e.message : e);
  }
}
