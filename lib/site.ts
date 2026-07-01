// Sayt bazaviy URL'i (Telegram xabarlaridagi havolalar uchun).
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://umdgroup.uz").replace(/\/$/, "");

export function adminAppUrl(appId: string): string {
  return `${SITE_URL}/admin/app/${appId}`;
}

// Telegram MarkdownV2 uchun tayyor inline havola qatori (xabar oxiriga qo'shiladi).
// URL ichida faqat ) va \ maxsus — bizning URL'larda ular yo'q.
export function tgAdminLink(appId: string): string {
  return `\n\n[🔗 Adminda ochish](${adminAppUrl(appId)})`;
}
