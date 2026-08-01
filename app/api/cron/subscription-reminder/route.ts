import { NextRequest, NextResponse } from "next/server";
import { adminDb, FieldValue } from "@/lib/firebase/admin";
import { sendTelegramMessage } from "@/lib/telegram";
import { notifyUser, appLink } from "@/lib/notify";
import { SERVICE_LABELS } from "@/lib/labels";
import { tgAdminLink } from "@/lib/site";
import type { ServiceType } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REMIND_WITHIN_DAYS = 3;

function esc(t: string) {
  return String(t).replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, "\\$&");
}

function authorized(req: NextRequest): boolean {
  const auth = req.headers.get("authorization") || "";
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && auth === `Bearer ${cronSecret}`) return true;
  const q = req.nextUrl.searchParams.get("secret");
  if (q && process.env.APPROVE_SECRET && q === process.env.APPROVE_SECRET) return true;
  return false;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ success: false, error: "Ruxsat yo'q" }, { status: 401 });
  }

  const now = Date.now();
  const horizon = now + REMIND_WITHIN_DAYS * 24 * 60 * 60 * 1000;

  const snap = await adminDb.collection("apps").where("subscription.active", "==", true).get();

  let sent = 0;
  for (const doc of snap.docs) {
    const app = doc.data();
    const sub = app.subscription;
    if (!sub || sub.reminded) continue;
    if (app.status !== "published") continue;
    const endMs = sub.endDate?.toMillis?.() ?? 0;
    if (!endMs) continue;
    if (endMs > horizon || endMs <= now) continue; // 3 kun ichida tugasa (hali tugamagan)

    const serviceType = app.serviceType as ServiceType;
    const appName = (app.appName as string | null) || SERVICE_LABELS[serviceType];
    const ownerName = app.contact?.fullName || "Mijoz";
    const ownerUid = app.ownerUid as string | undefined;
    const daysLeft = Math.ceil((endMs - now) / (24 * 60 * 60 * 1000));

    try {
      await sendTelegramMessage(
        `⏳ *OBUNA TUGAYAPTI*\n\n📱 ${esc(appName)}\n👤 ${esc(ownerName)}\n📅 ${esc(String(daysLeft))} kun qoldi` +
          tgAdminLink(doc.id)
      );
      if (ownerUid) {
        await notifyUser(
          ownerUid,
          `⏳ Eslatma: *${esc(appName)}* obunangiz tugayapti\n\n📅 ${esc(String(daysLeft))} kun qoldi\n\nUzaytirmasangiz, ilova store'dan olib qo'yilishi mumkin. Uzaytirishni istasangiz shu yerdan qulay 👍${appLink(doc.id)}`
        );
      }
      await doc.ref.update({ "subscription.reminded": true, "subscription.remindedAt": FieldValue.serverTimestamp() });
      sent++;
    } catch (e) {
      console.error("[cron/subscription-reminder] xato:", doc.id, e);
    }
  }

  return NextResponse.json({ success: true, checked: snap.size, sent });
}
