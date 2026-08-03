import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { notifyUser, esc } from "@/lib/notify";
import { urlButton } from "@/lib/telegram";
import { SITE_URL } from "@/lib/site";
import { SERVICE_LABELS } from "@/lib/labels";
import type { ServiceType } from "@/types";

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

// Obuna hayot-sikli eslatmalari — foydalanuvchining o'ziga.
// 30 kun qolganda (obuna tugaydigan oy), 7 kun qolganda, tugash kuni, kechikkan har kun.
export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ success: false, error: "Ruxsat yo'q" }, { status: 401 });
  }

  const now = Date.now();
  const nowDay = Math.floor(now / DAY);
  const todayStr = new Date(now).toISOString().slice(0, 10);

  const snap = await adminDb.collection("apps").where("subscription.active", "==", true).get();

  let sent = 0;
  for (const doc of snap.docs) {
    const app = doc.data();
    const sub = app.subscription;
    if (!sub || app.status !== "published") continue;
    const endMs = sub.endDate?.toMillis?.() ?? 0;
    if (!endMs) continue;

    // Kunlarda farq (UTC kalendar kuni bo'yicha)
    const daysLeft = Math.floor(endMs / DAY) - nowDay;

    // Bugun qaysi eslatma mos keladi
    type Kind = "month" | "week" | "day" | "late" | null;
    let kind: Kind = null;
    if (daysLeft === 30) kind = "month";
    else if (daysLeft === 7) kind = "week";
    else if (daysLeft === 0) kind = "day";
    else if (daysLeft < 0) kind = "late";
    if (!kind) continue;

    // Bir kunda bitta eslatma (kechikkan har kun yangi sana => qayta yuboriladi)
    if (sub.remindedOn === todayStr) continue;

    const serviceType = app.serviceType as ServiceType;
    const name = (app.appName as string | null) || SERVICE_LABELS[serviceType];
    const ownerUid = app.ownerUid as string | undefined;
    const endStr = new Date(endMs).toISOString().slice(0, 10);

    let msg = "";
    if (kind === "month") {
      msg = `📅 *${esc(name)}* obunangiz *${esc(String(daysLeft))} kun*dan keyin yakuniga yetadi \\(${esc(endStr)}\\)\n\nUzluksiz ishlashi uchun oldindan uzaytirib qo'yishingiz mumkin 👍`;
    } else if (kind === "week") {
      msg = `⏳ *${esc(name)}* obunangiz tugashiga *1 hafta* qoldi \\(${esc(endStr)}\\)\n\nIlovangiz store'da uzluksiz qolishi uchun obunani vaqtida uzaytiring`;
    } else if (kind === "day") {
      msg = `📅 Bugun *${esc(name)}* obunangiz yakuniga yetadi\n\nIlovangiz store'da qolishi uchun bugun uzaytiring\\. Kechiksa, ilova vaqtincha olib qo'yilishi mumkin\\.`;
    } else {
      const late = Math.abs(daysLeft);
      msg = `⚠️ *${esc(name)}* obunangiz *${esc(String(late))} kun* oldin yakuniga yetgan\n\nIloji boricha tezroq uzaytiring — ilova store'dan olib qo'yilmasligi uchun\\.`;
    }

    if (ownerUid) {
      await notifyUser(ownerUid, msg, urlButton("🔄 Obunani yangilash", `${SITE_URL}/panel/app/${doc.id}`));
      await doc.ref.update({ "subscription.remindedOn": todayStr });
      sent++;
    }
  }

  return NextResponse.json({ success: true, checked: snap.size, sent });
}
