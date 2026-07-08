import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/dal";
import { adminDb } from "@/lib/firebase/admin";
import { markReceiptSent, markFinalReceiptSent } from "@/lib/firestore/apps";
import { readFormFile } from "@/lib/form-utils";
import { sendPhotoToTelegram } from "@/lib/telegram";
import { getPricing, getPaymentInfo } from "@/lib/firestore/settings";
import { createPayment, type PaymentKind } from "@/lib/firestore/payments";
import { advanceUsdApp, finalUsdApp, serviceBaseUsd, advancePercentForApp } from "@/lib/payment";
import { getUsdRate } from "@/lib/cbu";
import { SERVICE_LABELS } from "@/lib/labels";
import { tgAdminLink } from "@/lib/site";
import type { ServiceType } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

function esc(t: string) {
  return t.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, "\\$&");
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Avval tizimga kiring" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ success: false, error: "Forma o'qishda xato" }, { status: 400 });
  }

  const appId = String(formData.get("appId") || "");
  const kind: PaymentKind = formData.get("kind") === "final" ? "final" : "advance";
  if (!appId) {
    return NextResponse.json({ success: false, error: "appId yo'q" }, { status: 400 });
  }

  const snap = await adminDb.collection("apps").doc(appId).get();
  if (!snap.exists) {
    return NextResponse.json({ success: false, error: "Ariza topilmadi" }, { status: 404 });
  }
  const app = snap.data()!;
  if (app.ownerUid !== user.uid) {
    return NextResponse.json({ success: false, error: "Ruxsat yo'q" }, { status: 403 });
  }

  const serviceType = app.serviceType as ServiceType;
  // Akkaunt xizmatida qolgan to'lov "yakunlandi" bosqichida.
  const finalStage = serviceType === "account" ? "completed" : "published";

  // Bosqichga mos tekshiruv
  if (kind === "advance" && app.status !== "payment_pending") {
    return NextResponse.json({ success: false, error: "To'lov kutilmayapti" }, { status: 400 });
  }
  if (kind === "final" && (app.status !== finalStage || app.finalPaid)) {
    return NextResponse.json({ success: false, error: "Yakuniy to'lov talab qilinmayapti" }, { status: 400 });
  }

  const receipt = await readFormFile(formData, "receipt");
  if (!receipt) {
    return NextResponse.json({ success: false, error: "Chek rasmi yuklanmadi" }, { status: 400 });
  }

  const pricedApp = { serviceType, servicePrice: typeof app.servicePrice === "number" ? app.servicePrice : null };
  const [pricing, payment, rate] = await Promise.all([getPricing(), getPaymentInfo(), getUsdRate()]);
  const usd = Math.round(kind === "final" ? finalUsdApp(pricedApp, pricing) : advanceUsdApp(pricedApp, pricing));
  const uzs = rate ? Math.round(usd * rate) : null;
  const appName = (app.appName as string | null) || SERVICE_LABELS[serviceType];
  const ownerName = app.contact?.fullName || user.name || user.email || "Mijoz";
  const ownerPhone = app.contact?.phone || "-";
  const kindLabel = kind === "final" ? "Yakuniy to'lov" : "Avans";

  // To'lov yozuvi
  try {
    await createPayment({
      appId,
      ownerUid: user.uid,
      ownerName,
      ownerPhone,
      serviceType,
      appName,
      kind,
      amountUsd: usd,
      rate,
      amountUzs: uzs,
      totalUsd: Math.round(serviceBaseUsd(pricedApp, pricing)),
      advancePercent: advancePercentForApp(pricedApp, pricing),
    });
  } catch (e) {
    console.error("[payment/receipt] createPayment xato:", e);
  }

  const caption =
    `💰 *TO'LOV KELDI \\(${esc(kindLabel)}\\)*\n\n` +
    `📦 ${esc(SERVICE_LABELS[serviceType])}\n` +
    `📱 ${esc(appName)}\n` +
    `👤 ${esc(ownerName)}\n` +
    `📞 ${esc(ownerPhone)}\n` +
    `💵 $${esc(String(usd))}` +
    (uzs ? ` \\(\\~${esc(uzs.toLocaleString("en-US"))} so'm\\)` : "") +
    `\n💳 Karta: ${esc(payment.cardNumber || "-")}` +
    tgAdminLink(appId);

  try {
    const ext = receipt.name.split(".").pop()?.toLowerCase();
    await sendPhotoToTelegram(receipt.buffer, `chek_${appId}.${ext || "jpg"}`, caption);
  } catch (e) {
    console.error("[payment/receipt] Telegram xato (chek belgilangan):", e);
  }

  try {
    if (kind === "final") await markFinalReceiptSent(appId);
    else await markReceiptSent(appId);
  } catch (e) {
    console.error("[payment/receipt] mark xato:", e);
    return NextResponse.json({ success: false, error: "Saqlashda xato" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
