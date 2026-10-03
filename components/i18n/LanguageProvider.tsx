"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getDictionary, type Dict } from "@/lib/i18n";
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, type Locale } from "@/lib/i18n/config";

interface LanguageContextValue {
  locale: Locale;
  t: Dict;
  setLocale: (next: Locale) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: DEFAULT_LOCALE,
  t: getDictionary(DEFAULT_LOCALE),
  setLocale: () => {},
});

export function LanguageProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback(
    (next: Locale) => {
      if (next === locale) return;
      // Cookie — server component'lar ham shu tilni o'qisin.
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
      document.documentElement.lang = next;
      setLocaleState(next);
      // Server tomonda render bo'lgan matnlarni ham yangilaymiz.
      router.refresh();
    },
    [locale, router]
  );

  const value = useMemo<LanguageContextValue>(
    () => ({ locale, t: getDictionary(locale), setLocale }),
    [locale, setLocale]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}

// Eng ko'p ishlatiladigan qisqartma: const t = useT();
export function useT(): Dict {
  return useContext(LanguageContext).t;
}

export function useLocale(): Locale {
  return useContext(LanguageContext).locale;
}
