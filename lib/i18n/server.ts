import { cookies } from "next/headers";
import { getDictionary, type Dict } from ".";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./config";

// Server component'lar uchun joriy til.
// Platformaning asosiy tili — o'zbekcha. Brauzerning Accept-Language'i ataylab
// hisobga olinmaydi: O'zbekistonda telefonlar ko'pincha ruscha sozlangan bo'ladi
// va mijoz o'zi tanlamagan holda ruscha kabinetga tushib qolardi.
// Til faqat foydalanuvchi UZ/RU tugmasini bosganda (cookie orqali) o'zgaradi.
export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  return isLocale(fromCookie) ? fromCookie : DEFAULT_LOCALE;
}

// Server component'larda: const t = await getT();
export async function getT(): Promise<Dict> {
  return getDictionary(await getLocale());
}

export async function getLocaleAndT(): Promise<{ locale: Locale; t: Dict }> {
  const locale = await getLocale();
  return { locale, t: getDictionary(locale) };
}
