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
          className="relative flex items-center gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 animate-slide-down"
        >
          <div className="text-2xl flex-shrink-0">🎁</div>
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
