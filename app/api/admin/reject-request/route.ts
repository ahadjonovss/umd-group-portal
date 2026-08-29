import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getUserRole } from "@/lib/auth/dal";
import { adminDb, FieldValue } from "@/lib/firebase/admin";
import { getPricing } from "@/lib/firestore/settings";
import { voidRequestPayments, voidAppPayments } from "@/lib/firestore/payments";
import { setRequestStatus } from "@/lib/firestore/requests";
import { setAppStatus } from "@/lib/firestore/apps";
import { categoryForServiceType } from "@/lib/discount";
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
  const appIdInput = String(formData.get("appId") || "");
  const initiator = String(formData.get("initiator") || "user"); // "user" | "umd"
  const hold = String(formData.get("hold") || "0") === "1"; // komissiya ushlansinmi (faqat user)
  const cardNumber = String(formData.get("cardNumber") || "").trim();
  if (!requestId && !appIdInput) return NextResponse.json({ success: false, error: "requestId yoki appId yo'q" }, { status: 400 });

  const pricing = await getPricing();
  const actor = { type: "admin" as const, name: user.name || user.email || "Admin", uid: user.uid };

  // Umumiy o'zgaruvchilar (so'rov yoki ariza)
  let ownerUid = "";
  let ownerName = "";
  let appId = "";
  let serviceType: ServiceType = "play-market";
  let appName = "";
  let entityLabel = "Ariza";
  let totalUsd = 0;
  let totalUzs = 0;
  let baseFeePct = 0;
  const isRequest = Boolean(requestId);

  if (isRequest) {
    const reqSnap = await adminDb.collection("requests").doc(requestId).get();
    if (!reqSnap.exists) return NextResponse.json({ success: false, error: "So'rov topilmadi" }, { status: 404 });
    const r = reqSnap.data()!;
    ownerUid = r.ownerUid as string;
    ownerName = (r.ownerName as string) || "-";
    appId = r.appId as string;
    serviceType = r.serviceType as ServiceType;
    appName = (r.appName as string) || SERVICE_LABELS[serviceType];
    entityLabel = `${REQUEST_TYPE_LABEL[r.type as RequestType]} so'rovi`;
    const paySnap = await adminDb.collection("payments").where("requestId", "==", requestId).where("status", "==", "confirmed").get();
    totalUsd = paySnap.empty ? (r.amountUsd || 0) : paySnap.docs.reduce((s, d) => s + (d.data().amountUsd || 0), 0);
    totalUzs = paySnap.empty ? (r.amountUzs || 0) : paySnap.docs.reduce((s, d) => s + (d.data().amountUzs || 0), 0);
    baseFeePct = pricing.requestCancelFee;
  } else {
    const appSnap = await adminDb.collection("apps").doc(appIdInput).get();
    if (!appSnap.exists) return NextResponse.json({ success: false, error: "Ariza topilmadi" }, { status: 404 });
    const a = appSnap.data()!;
    ownerUid = a.ownerUid as string;
    ownerName = (a.contact?.fullName as string) || (a.ownerEmail as string) || "-";
    appId = appIdInput;
    serviceType = a.serviceType as ServiceType;
    appName = (a.appName as string) || SERVICE_LABELS[serviceType];
    entityLabel = "Ariza";
    const paySnap = await adminDb.collection("payments").where("appId", "==", appId).where("requestId", "==", null).where("status", "==", "confirmed").get();
    totalUsd = paySnap.docs.reduce((s, d) => s + (d.data().amountUsd || 0), 0);
    totalUzs = paySnap.docs.reduce((s, d) => s + (d.data().amountUzs || 0), 0);
    const cat = categoryForServiceType(serviceType);
    baseFeePct = cat === "publish" ? pricing.publishCancelFee : cat === "account" ? pricing.accountCancelFee : 0;
  }

  const paid = totalUsd > 0;
  const commissionPct = initiator === "user" && hold ? baseFeePct : 0;
  const keptUsd = Math.round((totalUsd * commissionPct) / 100);
  const refundUsd = Math.max(0, totalUsd - keptUsd);
  // So'm — mijoz haqiqatda to'lagan summadan hisoblanadi
  const keptUzs = Math.round((totalUzs * commissionPct) / 100);
  const fallbackRate = totalUzs > 0 ? 0 : ((await getUsdRate()) ?? 0);
  const refundUzs = totalUzs > 0 ? Math.max(0, totalUzs - keptUzs) : (fallbackRate ? Math.round(refundUsd * fallbackRate) : null);

  // Skrinshot (qaytarish bo'lsa talab qilinadi)
  const shot = await readFormFile(formData, "screenshot");
  if (paid && refundUsd > 0) {
    if (!cardNumber) return NextResponse.json({ success: false, error: "Karta raqamini kiriting" }, { status: 400 });
    if (!shot) return NextResponse.json({ success: false, error: "To'lov skrinshotini yuklang" }, { status: 400 });
  }

  const refundMeta = {
    refund: {
      initiator, commissionPct, keptUsd, refundUsd,
      refundUzs: refundUzs ?? null,
      cardNumber: cardNumber || null,
      at: FieldValue.serverTimestamp(),
      by: user.uid,
    },
  };

  if (isRequest) {
    if (paid) await voidRequestPayments(requestId, keptUsd, actor, false);
    await adminDb.collection("requests").doc(requestId).update(refundMeta);
    await setRequestStatus(requestId, "rejected", actor);
    await adminDb.collection("requests").doc(requestId).update({ "payment.installments.full.state": "rejected", receiptSent: false });
  } else {
    if (paid) await voidAppPayments(appId, keptUsd, actor, false);
    await adminDb.collection("apps").doc(appId).update(refundMeta);
    await setAppStatus(appId, "rejected", actor);
  }

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
    `↩️ *${esc(entityLabel)} bekor qilindi*\n\n📱 ${esc(appName)}${reasonLine}${commLine}${refundLine}${termsLine}`;

  // Foydalanuvchiga: skrinshot + matn (Telegram)
  let notified = false;
  try {
    const tg = await getUserTelegram(ownerUid);
    if (tg.notify && tg.chatIds.length) {
      for (const chatId of tg.chatIds) {
        if (paid && refundUsd > 0 && shot) {
          const ok = await sendPhotoRaw({ chatId, buffer: shot.buffer, filename: `refund_${requestId || appId}.jpg`, caption });
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
    const adminCap = caption + `\n👤 ${esc(ownerName)}` + tgAdminLink(appId);
    if (paid && refundUsd > 0 && shot) {
      await notifier.photo("payments", shot.buffer, `refund_${requestId || appId}.jpg`, adminCap);
    } else {
      await notifier.payments(adminCap);
    }
  } catch (e) {
    console.error("[reject-request] admin notify xato:", e);
  }

  return NextResponse.json({ success: true, keptUsd, refundUsd, refundUzs, notified });
}
