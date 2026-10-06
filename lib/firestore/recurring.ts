import "server-only";
import { adminDb, Timestamp } from "@/lib/firebase/admin";
import { createRecurringInvoice, getOpenRecurringInvoices } from "@/lib/firestore/requests";
import { serviceDefOf } from "@/lib/firestore/apps";
import { addMonths } from "@/lib/billing";
import { appLabel } from "@/lib/labels";
import { isTerminalError, type AppStatus } from "@/lib/app-status";
import { getUsdRate } from "@/lib/cbu";
import { notifier } from "@/lib/telegram-notifier";

function esc(t: string): string {
  return t.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, "\\$&");
}

function dmy(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}

export interface IssueInvoiceResult {
  ok: boolean;
  error?: string;
  skipped?: boolean; // shu davr uchun hisob allaqachon bor edi
  periodNo?: number;
  amountUsd?: number;
  periodStart?: string;
  periodEnd?: string;
}

export interface IssueInvoiceOptions {
  // Nechta to'lanmagan hisob bo'lsa yangisini chiqarmaymiz.
  // cron uchun berilmaydi (jadval bo'yicha baribir chiqadi).
  maxOpen?: number;
  // "Hali muddati kelmagan" davrni oldindan chiqarishga ruxsat (mijoz/admin).
  allowEarly?: boolean;
  notifyAdmin?: boolean;
}

// Keyingi davr uchun davriy hisob-fakturani chiqaradi va `nextChargeAt` ni suradi.
// Cron, admin va mijozning "oldindan to'lash" tugmasi — uchalasi shu funksiyani ishlatadi.
export async function issueNextRecurringInvoice(
  appId: string,
  opts: IssueInvoiceOptions = {}
): Promise<IssueInvoiceResult> {
  const ref = adminDb.collection("apps").doc(appId);
  const snap = await ref.get();
  if (!snap.exists) return { ok: false, error: "Ariza topilmadi" };
  const app = snap.data()!;

  const rec = app.billing?.recurring;
  if (!rec) return { ok: false, error: "Bu xizmatda davriy to'lov sozlanmagan" };
  if (rec.status === "cancelled") return { ok: false, error: "Davriy to'lov bekor qilingan" };
  if (!rec.active) return { ok: false, error: "Davriy to'lov hali boshlanmagan" };
  const amountUsd: number = rec.amountUsd ?? 0;
  if (amountUsd <= 0) return { ok: false, error: "Davriy to'lov summasi belgilanmagan" };
  if (isTerminalError(app.status as AppStatus)) return { ok: false, error: "Ariza yopilgan" };

  if (typeof opts.maxOpen === "number") {
    const open = await getOpenRecurringInvoices(appId);
    if (open.length >= opts.maxOpen) {
      return {
        ok: false,
        error:
          opts.maxOpen === 1
            ? "Avval mavjud hisob-fakturani to'lang"
            : "To'lanmagan hisob-fakturalar juda ko'p",
      };
    }
  }

  const periodMonths: number = rec.periodMonths ?? 1;
  const periodStart: Date = rec.nextChargeAt?.toDate?.() ?? new Date();
  const periodEnd = addMonths(periodStart, periodMonths);
  const periodNo = (rec.periodNo ?? 0) + 1;

  // Idempotentlik: shu davr uchun hisob allaqachon yaratilganmi
  const dup = await adminDb
    .collection("requests")
    .where("appId", "==", appId)
    .where("type", "==", "recurring")
    .where("periodNo", "==", periodNo)
    .limit(1)
    .get();

  const def = serviceDefOf(snap);
  const name = (app.appName as string | null) || appLabel(def);

  if (dup.empty) {
    const rate = await getUsdRate();
    await createRecurringInvoice({
      appId,
      ownerUid: app.ownerUid as string,
      ownerName: app.contact?.fullName || "Mijoz",
      ownerPhone: app.contact?.phone || "-",
      appName: name,
      serviceLabel: appLabel(def),
      amountUsd,
      rate,
      amountUzs: rate ? Math.round(amountUsd * rate) : null,
      periodNo,
      periodStart,
      periodEnd,
    });
    if (opts.notifyAdmin !== false) {
      await notifier.payments(
        `🧾 Davriy hisob\\-faktura yaratildi\n👤 ${esc(app.contact?.fullName || "Mijoz")}\n📦 ${esc(name)}\n💵 $${esc(String(Math.round(amountUsd)))}\n🗓 ${esc(dmy(periodStart))} — ${esc(dmy(periodEnd))}`
      );
    }
  }

  // Hisob allaqachon bo'lsa ham davrni suramiz — aks holda cron bir joyda qotib qoladi.
  await ref.update({
    "billing.recurring.periodNo": periodNo,
    "billing.recurring.invoicesCount": (rec.invoicesCount ?? 0) + 1,
    "billing.recurring.lastInvoiceAt": Timestamp.fromDate(periodStart),
    "billing.recurring.nextChargeAt": Timestamp.fromDate(periodEnd),
  });

  return {
    ok: true,
    skipped: !dup.empty,
    periodNo,
    amountUsd,
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
  };
}
