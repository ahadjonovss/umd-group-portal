// Qo'llab-quvvatlanadigan tillar. URL o'zgarmaydi — til cookie'da saqlanadi.
export const LOCALES = ["uz", "ru"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "uz";

// Cookie nomi va umri (1 yil).
export const LOCALE_COOKIE = "lang";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const LOCALE_LABEL: Record<Locale, string> = {
  uz: "O'zbekcha",
  ru: "Русский",
};

// Til tanlagichdagi qisqa yorliq.
export const LOCALE_SHORT: Record<Locale, string> = {
  uz: "UZ",
  ru: "RU",
};

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}
