import { uz } from "./dictionaries/uz";
import { ru } from "./dictionaries/ru";
import { DEFAULT_LOCALE, type Locale } from "./config";

// Lug'at shakli uz'dan olinadi — ru undan chetga chiqsa TypeScript xato beradi.
export type Dict = typeof uz;

export const DICTIONARIES: Record<Locale, Dict> = { uz, ru };

export function getDictionary(locale: Locale): Dict {
  return DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];
}

export * from "./config";
