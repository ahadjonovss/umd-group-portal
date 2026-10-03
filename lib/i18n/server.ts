import { cookies, headers } from "next/headers";
import { getDictionary, type Dict } from ".";
import { LOCALE_COOKIE, isLocale, localeFromAcceptLanguage, type Locale } from "./config";

// Server component'lar uchun joriy til: cookie ustun, bo'lmasa Accept-Language.
export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;

  const headerStore = await headers();
  return localeFromAcceptLanguage(headerStore.get("accept-language"));
}

// Server component'larda: const t = await getT();
export async function getT(): Promise<Dict> {
  return getDictionary(await getLocale());
}

export async function getLocaleAndT(): Promise<{ locale: Locale; t: Dict }> {
  const locale = await getLocale();
  return { locale, t: getDictionary(locale) };
}
