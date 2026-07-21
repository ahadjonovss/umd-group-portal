import { DISCOUNT_SERVICE_LABEL, type DiscountService } from "@/lib/discount";
import { formatDate } from "@/lib/labels";

export interface DiscountAlertItem {
  id: string;
  service: DiscountService;
  percent: number;
  expiresAt: string | null;
}

// Foydalanuvchining amaldagi chegirmalari haqida eslatma.
export function DiscountAlert({ discounts }: { discounts: DiscountAlertItem[] }) {
  if (!discounts.length) return null;

  return (
    <div className="flex flex-col gap-2 mb-6">
      {discounts.map((d) => (
        <div
          key={d.id}
          className="relative flex items-center gap-3.5 rounded-2xl ring-1 ring-amber-200/70 bg-gradient-to-r from-amber-50 to-orange-50 shadow-sm shadow-amber-100/60 px-4 py-3.5 animate-slide-down"
        >
          <span className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-xl flex-shrink-0">🎁</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800">
              Sizga <span className="font-bold">{DISCOUNT_SERVICE_LABEL[d.service]}</span> xizmatiga{" "}
              <span className="font-bold">−{d.percent}%</span> chegirma berilgan!
            </p>
            <p className="text-xs text-amber-700">
              To&apos;lov qilganingizda avtomatik qo&apos;llanadi
              {d.expiresAt ? ` · ${formatDate(d.expiresAt)} gacha amal qiladi` : ""}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
