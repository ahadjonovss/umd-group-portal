// Sayt bazaviy URL'i (Telegram xabarlaridagi havolalar uchun).
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://umdgroup.uz").replace(/\/$/, "");

// Mijozlar yozadigan/fayl yuboradigan Telegram menejer akkaunti.
// @umdgroupadmin endi kanal — unga fayl yuborib bo'lmaydi, shuning uchun
// mijozga ko'rsatiladigan handle faqat shu yerdan o'zgartiriladi.
export const TELEGRAM_MANAGER = "umdgroupadmintg";
export const TELEGRAM_MANAGER_AT = `@${TELEGRAM_MANAGER}`;
export const TELEGRAM_MANAGER_URL = `https://t.me/${TELEGRAM_MANAGER}`;

export function adminAppUrl(appId: string): string {
  return `${SITE_URL}/admin/app/${appId}`;
}

// Telegram MarkdownV2 uchun tayyor inline havola qatori (xabar oxiriga qo'shiladi).
// URL ichida faqat ) va \ maxsus — bizning URL'larda ular yo'q.
export function tgAdminLink(appId: string): string {
  return `\n\n[🔗 Adminda ochish](${adminAppUrl(appId)})`;
}
