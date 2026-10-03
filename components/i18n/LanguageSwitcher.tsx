"use client";

import { useLanguage } from "./LanguageProvider";
import { LOCALES, LOCALE_LABEL, LOCALE_SHORT } from "@/lib/i18n/config";

// Ixcham UZ/RU tugmachasi — header'larda ishlatiladi.
export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useLanguage();

  return (
    <div
      className={`inline-flex items-center rounded-lg bg-slate-100 p-0.5 ring-1 ring-slate-200/80 ${className}`}
      role="group"
      aria-label="Til / Язык"
    >
      {LOCALES.map((code) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            aria-pressed={active}
            title={LOCALE_LABEL[code]}
            className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-all duration-200 ${
              active
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {LOCALE_SHORT[code]}
          </button>
        );
      })}
    </div>
  );
}
