"use client";

import { type DiscountService } from "@/lib/discount";
import { formatDate } from "@/lib/labels";
import { useT } from "@/components/i18n/LanguageProvider";
import { Rich } from "@/components/i18n/Rich";

export interface DiscountAlertItem {
  id: string;
  service: DiscountService;
  percent: number;
  expiresAt: string | null;
}

// Foydalanuvchining amaldagi chegirmalari haqida eslatma.
export function DiscountAlert({ discounts }: { discounts: DiscountAlertItem[] }) {
  const t = useT();
  if (!discounts.length) return null;

  return (
    <div className="flex flex-col gap-2">
      {discounts.map((d) => (
        <div
          key={d.id}
          className="relative flex items-center gap-3.5 rounded-2xl ring-1 ring-amber-200/70 bg-gradient-to-r from-amber-50 to-orange-50 shadow-sm shadow-amber-100/60 px-4 py-3.5 animate-slide-down"
        >
          <span className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-xl flex-shrink-0">🎁</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800">
              <Rich text={t.panel.discountMessage(t.discountService[d.service], d.percent)} />
            </p>
            <p className="text-xs text-amber-700">
              {t.panel.discountAuto}
              {d.expiresAt ? t.panel.discountUntil(formatDate(d.expiresAt)) : ""}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
