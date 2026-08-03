import { NextRequest, NextResponse } from "next/server";
import { adminDb, FieldValue } from "@/lib/firebase/admin";
import { notifier } from "@/lib/telegram-notifier";
import { notifyUser, appLink } from "@/lib/notify";
import { SERVICE_LABELS } from "@/lib/labels";
import { tgAdminLink } from "@/lib/site";
import type { ServiceType } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REMIND_WITHIN_DAYS = 3;

function esc(t: string) {
  return t.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, "\\$&");
}

// Vercel cron (Authorization: Bearer CRON_SECRET) yoki ?secret=APPROVE_SECRET bilan ishlaydi.
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

  const snap = await adminDb.collection("apps").where("updatePackage.active", "==", true).get();

  let sent = 0;
  for (const doc of snap.docs) {
    const app = doc.data();
    const pkg = app.updatePackage;
    if (!pkg || pkg.reminded) continue;
    const endMs = pkg.endDate?.toMillis?.() ?? 0;
    if (!endMs) continue;
    // Kvota qolgan bo'lsa va muddati 3 kun ichida tugasa (lekin hali tugamagan)
    const hasQuota = (pkg.used ?? 0) < (pkg.quota ?? 0);
    if (!hasQuota) continue;
    if (endMs > horizon || endMs <= now) continue;

    const serviceType = app.serviceType as ServiceType;
    const appName = (app.appName as string | null) || SERVICE_LABELS[serviceType];
    const ownerName = app.contact?.fullName || "Mijoz";
    const ownerUid = app.ownerUid as string | undefined;
    const daysLeft = Math.ceil((endMs - now) / (24 * 60 * 60 * 1000));
    const left = (pkg.quota ?? 0) - (pkg.used ?? 0);

    try {
      // Admin kanaliga
      await notifier.general(
        `⏳ *UPDATE PAKETI TUGAYAPTI*\n\n` +
          `📱 ${esc(appName)}\n` +
          `👤 ${esc(ownerName)}\n` +
          `📅 ${esc(String(daysLeft))} kun qoldi\n` +
          `🔄 Qolgan updatelar: ${esc(String(left))}` +
          tgAdminLink(doc.id)
      );
      // Foydalanuvchiga (iliq)
      if (ownerUid) {
        await notifyUser(
          ownerUid,
          `⏳ Eslatma: *${esc(appName)}* update paketingiz tugayapti\n\n📅 ${esc(String(daysLeft))} kun qoldi\n🔄 Qolgan bepul updatelar: ${esc(String(left))}\n\nXohlasangiz, paketni yangilab qo'yishingiz mumkin 👍${appLink(doc.id)}`
        );
      }
      await doc.ref.update({ "updatePackage.reminded": true, "updatePackage.remindedAt": FieldValue.serverTimestamp() });
      sent++;
    } catch (e) {
      console.error("[cron/update-package-reminder] xato:", doc.id, e);
    }
  }

  return NextResponse.json({ success: true, checked: snap.size, sent });
}
