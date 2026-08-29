import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getUserRole } from "@/lib/auth/dal";
import { adminDb, FieldValue } from "@/lib/firebase/admin";
import { getPricing } from "@/lib/firestore/settings";
import { voidRequestPayments } from "@/lib/firestore/payments";
import { setRequestStatus } from "@/lib/firestore/requests";
import { getUserTelegram } from "@/lib/firestore/users";
import { sendPhotoRaw } from "@/lib/telegram";
import { notifier } from "@/lib/telegram-notifier";
import { readFormFile } from "@/lib/form-utils";
import { SERVICE_LABELS } from "@/lib/labels";
import { REQUEST_TYPE_LABEL, type RequestType } from "@/lib/request-status";
import { tgAdminLink, SITE_URL } from "@/lib/site";
import { getUsdRate } from "@/lib/cbu";
import type { ServiceType } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

function esc(t: string) {
  return String(t).replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, "\\$&");
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (await getUserRole(user.uid)) !== "admin") {
    return NextResponse.json({ success: false, error: "Ruxsat yo'q" }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ success: false, error: "Forma o'qishda xato" }, { status: 400 });
  }

  const requestId = String(formData.get("requestId") || "");
  const initiator = String(formData.get("initiator") || "user"); // "user" | "umd"
  const hold = String(formData.get("hold") || "0") === "1"; // komissiya ushlansinmi (faqat user)
  const cardNumber = String(formData.get("cardNumber") || "").trim();
  if (!requestId) return NextResponse.json({ success: false, error: "requestId yo'q" }, { status: 400 });

  const reqRef = adminDb.collection("requests").doc(requestId);
  const reqSnap = await reqRef.get();
  if (!reqSnap.exists) return NextResponse.json({ success: false, error: "So'rov topilmadi" }, { status: 404 });
  const r = reqSnap.data()!;
  const ownerUid = r.ownerUid as string;
  const appId = r.appId as string;
  const serviceType = r.serviceType as ServiceType;
  const type = r.type as RequestType;
  const appName = (r.appName as string) || SERVICE_LABELS[serviceType];

  // Tasdiqlangan to'lov (bo'lsa)
  const paySnap = await adminDb.collection("payments").where("requestId", "==", requestId).where("status", "==", "confirmed").get();
  const paid = !paySnap.empty;
  const totalUsd = paid ? paySnap.docs.reduce((s, d) => s + (d.data().amountUsd || 0), 0) : (r.amountUsd || 0);

  // Komissiya: faqat mijoz so'rovi bilan + ushlash tanlangan bo'lsa
  const pricing = await getPricing();
  const commissionPct = initiator === "user" && hold ? pricing.requestCancelFee : 0;
  const keptUsd = Math.round((totalUsd * commissionPct) / 100);
  const refundUsd = Math.max(0, totalUsd - keptUsd);

  const rate = (await getUsdRate()) ?? null;
  const refundUzs = rate ? Math.round(refundUsd * rate) : null;

  // Skrinshot (qaytarish bo'lsa talab qilinadi)
  const shot = await readFormFile(formData, "screenshot");
  if (paid && refundUsd > 0) {
    if (!cardNumber) return NextResponse.json({ success: false, error: "Karta raqamini kiriting" }, { status: 400 });
    if (!shot) return NextResponse.json({ success: false, error: "To'lov skrinshotini yuklang" }, { status: 400 });
  }

  const actor = { type: "admin" as const, name: user.name || user.email || "Admin", uid: user.uid };

  // To'lovlarni teskari qaytarish (kartaga — hamyonga emas). Kompensatsiya confirmed holicha qoladi.
  if (paid) {
    await voidRequestPayments(requestId, keptUsd, actor, false);
  }

  // Refund metama'lumoti so'rovga yoziladi (audit)
  await reqRef.update({
    refund: {
      initiator,
      commissionPct,
      keptUsd,
      refundUsd,
      refundUzs: refundUzs ?? null,
      cardNumber: cardNumber || null,
      at: FieldValue.serverTimestamp(),
      by: user.uid,
    },
  });

  // So'rovni rad etish (status + invoice yopiladi)
  await setRequestStatus(requestId, "rejected", actor);
  await reqRef.update({ "payment.installments.full.state": "rejected", receiptSent: false });

  // Xabar matni
  const reasonLine = `\n📌 Sabab: ${initiator === "user" ? "sizning so'rovingiz bo'yicha" : "UMD GROUP tomonidan"}`;
  const commLine = keptUsd > 0
    ? `\n🧾 Ushlangan komissiya: $${esc(String(keptUsd))} \\(${esc(String(commissionPct))}%\\) — foydalanish shartlariga ko'ra`
    : "";
  const refundLine = refundUsd > 0
    ? `\n💳 ${cardNumber ? esc(cardNumber) + " kartasiga " : ""}$${esc(String(refundUsd))}${refundUzs ? ` \\(~${esc(refundUzs.toLocaleString("en-US"))} so'm\\)` : ""} qaytarildi`
    : "";
  const termsLine = `\n\n📄 [Reglament / foydalanish shartlari](${SITE_URL}/foydalanish-shartlari)`;
  const caption =
    `↩️ *${esc(REQUEST_TYPE_LABEL[type])} so'rovi bekor qilindi*\n\n📱 ${esc(appName)}${reasonLine}${commLine}${refundLine}${termsLine}`;

  // Foydalanuvchiga: skrinshot + matn (Telegram)
  let notified = false;
  try {
    const tg = await getUserTelegram(ownerUid);
    if (tg.notify && tg.chatIds.length) {
      for (const chatId of tg.chatIds) {
        if (paid && refundUsd > 0 && shot) {
          const ok = await sendPhotoRaw({ chatId, buffer: shot.buffer, filename: `refund_${requestId}.jpg`, caption });
          notified = notified || ok;
        } else {
          // qaytarishsiz (masalan to'lov yo'q yoki 100% komissiya) — matn
          const { sendTelegramTo } = await import("@/lib/telegram");
          const ok = await sendTelegramTo(chatId, caption);
          notified = notified || ok;
        }
      }
    }
  } catch (e) {
    console.error("[reject-request] user notify xato:", e);
  }

  // Admin topic (To'lovlar) — nusxa + skrinshot
  try {
    const adminCap = caption + `\n👤 ${esc(r.ownerName || "-")}` + tgAdminLink(appId);
    if (paid && refundUsd > 0 && shot) {
      await notifier.photo("payments", shot.buffer, `refund_${requestId}.jpg`, adminCap);
    } else {
      await notifier.payments(adminCap);
    }
  } catch (e) {
    console.error("[reject-request] admin notify xato:", e);
  }

  return NextResponse.json({ success: true, keptUsd, refundUsd, refundUzs, notified });
}
