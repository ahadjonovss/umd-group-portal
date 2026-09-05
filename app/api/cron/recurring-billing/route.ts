import { NextRequest, NextResponse } from "next/server";
import { adminDb, Timestamp } from "@/lib/firebase/admin";
import { notifyUser, esc } from "@/lib/notify";
import { notifier } from "@/lib/telegram-notifier";
import { urlButton } from "@/lib/telegram";
import { SITE_URL } from "@/lib/site";
import { appLabel } from "@/lib/labels";
import { serviceDefOf } from "@/lib/firestore/apps";
import { createRecurringInvoice, getOpenRecurringInvoices } from "@/lib/firestore/requests";
import { addMonths } from "@/lib/billing";
import { getUsdRate } from "@/lib/cbu";
import { isTerminalError } from "@/lib/app-status";
import type { AppStatus } from "@/lib/app-status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAY = 24 * 60 * 60 * 1000;

function authorized(req: NextRequest): boolean {
  const auth = req.headers.get("authorization") || "";
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && auth === `Bearer ${cronSecret}`) return true;
  const q = req.nextUrl.searchParams.get("secret");
  if (q && process.env.APPROVE_SECRET && q === process.env.APPROVE_SECRET) return true;
  return false;
}

// Kechikkan to'lov uchun eslatma kuni kelganmi:
// 3-kun, 7-kun, keyin har 7 kunda (14, 21, 28...).
function shouldRemind(daysOverdue: number, graceDays: number): boolean {
  if (daysOverdue < Math.min(3, graceDays)) return false;
  if (daysOverdue === 3 || daysOverdue === 7) return true;
  return daysOverdue > 7 && daysOverdue % 7 === 0;
}

function dmy(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}

// Davriy (oylik) to'lovlar: muddati kelgan hisob-fakturalarni yaratadi va
// to'lanmaganlari uchun eslatma yuboradi.
//
// MUHIM: xizmat holati AVTOMATIK o'zgartirilmaydi — faqat eslatma + admin xabari.
// To'xtatish/uzish qarori doim adminda.
export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ success: false, error: "Ruxsat yo'q" }, { status: 401 });
  }

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const snap = await adminDb.collection("apps").where("billing.recurring.active", "==", true).get();

  let invoiced = 0;
  let reminded = 0;
  let pastDue = 0;
  const errors: string[] = [];
  const rate = await getUsdRate();

  for (const doc of snap.docs) {
    try {
      const app = doc.data();
      const rec = app.billing?.recurring;
      if (!rec || rec.status === "cancelled") continue;
      // Rad etilgan / bekor qilingan ariza — hisob chiqarmaymiz
      if (isTerminalError(app.status as AppStatus)) continue;

      const def = serviceDefOf(doc);
      const name = (app.appName as string | null) || appLabel(def);
      const ownerUid = app.ownerUid as string;
      const periodMonths: number = rec.periodMonths ?? 1;
      const amountUsd: number = rec.amountUsd ?? 0;
      const graceDays: number = rec.graceDays ?? 7;

      // ── 1) Muddati kelgan hisob-fakturani yaratamiz ──
      const nextMs: number = rec.nextChargeAt?.toMillis?.() ?? 0;
      if (amountUsd > 0 && nextMs && nextMs <= now.getTime()) {
        const periodStart = new Date(nextMs);
        const periodEnd = addMonths(periodStart, periodMonths);
        const periodNo = (rec.periodNo ?? 0) + 1;

        // Idempotentlik: shu davr uchun hisob allaqachon bormi
        const dup = await adminDb
          .collection("requests")
          .where("appId", "==", doc.id)
          .where("type", "==", "recurring")
          .where("periodNo", "==", periodNo)
          .limit(1)
          .get();

        if (dup.empty) {
          await createRecurringInvoice({
            appId: doc.id,
            ownerUid,
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
          invoiced++;
          await notifier.payments(
            `🧾 Davriy hisob\\-faktura yaratildi\n👤 ${esc(app.contact?.fullName || "Mijoz")}\n📦 ${esc(name)}\n💵 $${esc(String(Math.round(amountUsd)))}\n🗓 ${esc(dmy(periodStart))} — ${esc(dmy(periodEnd))}`
          );
        }

        await doc.ref.update({
          "billing.recurring.periodNo": periodNo,
          "billing.recurring.invoicesCount": (rec.invoicesCount ?? 0) + 1,
          "billing.recurring.lastInvoiceAt": Timestamp.fromDate(periodStart),
          "billing.recurring.nextChargeAt": Timestamp.fromDate(periodEnd),
        });
      }

      // ── 2) To'lanmagan hisob-fakturalar: eslatma (holat o'zgarmaydi) ──
      const open = await getOpenRecurringInvoices(doc.id);
      if (!open.length) {
        if (rec.status === "past_due") await doc.ref.update({ "billing.recurring.status": "active" });
        continue;
      }

      const oldest = open[0];
      const dueMs = new Date(oldest.periodStart ?? oldest.createdAt ?? now.toISOString()).getTime();
      const daysOverdue = Math.floor((now.getTime() - dueMs) / DAY);

      // Admin ko'rishi uchun "qarzdor" belgisi (xizmatga ta'sir qilmaydi)
      const shouldBePastDue = daysOverdue > graceDays;
      if (shouldBePastDue && rec.status !== "past_due") {
        await doc.ref.update({ "billing.recurring.status": "past_due" });
        pastDue++;
        await notifier.payments(
          `⚠️ Davriy to'lov kechikdi\n👤 ${esc(app.contact?.fullName || "Mijoz")}\n📦 ${esc(name)}\n💵 $${esc(String(Math.round(oldest.amountUsd)))}\n⏱ ${esc(String(daysOverdue))} kun`
        );
      } else if (!shouldBePastDue && rec.status === "past_due") {
        await doc.ref.update({ "billing.recurring.status": "active" });
      }

      // Kunda bitta eslatma
      if (rec.remindedOn === todayStr) continue;
      if (!shouldRemind(daysOverdue, graceDays)) continue;

      const total = open.reduce((sum, r) => sum + r.amountUsd, 0);
      const countLine = open.length > 1 ? `\n📄 To'lanmagan hisob: ${esc(String(open.length))} ta` : "";
      await notifyUser(
        ownerUid,
        `⏰ *${esc(name)}* — davriy to'lovingiz kutilmoqda\n\n` +
          `💵 $${esc(String(Math.round(total)))}${countLine}\n` +
          `⏱ ${esc(String(daysOverdue))} kun kechikdi\n\n` +
          `Iltimos, to'lovni "To'lov" bo'limida yakunlang 🙏`,
        urlButton("💳 To'lovni ochish", `${SITE_URL}/panel/app/${doc.id}`)
      );
      await doc.ref.update({ "billing.recurring.remindedOn": todayStr });
      reminded++;
    } catch (e) {
      errors.push(`${doc.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return NextResponse.json({ success: true, checked: snap.size, invoiced, reminded, pastDue, errors });
}
