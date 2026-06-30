import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/dal";
import { adminDb } from "@/lib/firebase/admin";
import { markReceiptSent } from "@/lib/firestore/apps";
import { readFormFile } from "@/lib/form-utils";
import { sendPhotoToTelegram } from "@/lib/telegram";
import { getPricing, getPaymentInfo } from "@/lib/firestore/settings";
import { createPayment } from "@/lib/firestore/payments";
import { advanceUsd, fullUsd, advancePercentFor } from "@/lib/payment";
import { getUsdRate } from "@/lib/cbu";
import { SERVICE_LABELS } from "@/lib/labels";
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
  if (app.status !== "payment_pending") {
    return NextResponse.json({ success: false, error: "To'lov kutilmayapti" }, { status: 400 });
  }

  const receipt = await readFormFile(formData, "receipt");
  if (!receipt) {
    return NextResponse.json({ success: false, error: "Chek rasmi yuklanmadi" }, { status: 400 });
  }

  // To'lov summasi (caption uchun)
  const serviceType = app.serviceType as ServiceType;
  const [pricing, payment, rate] = await Promise.all([getPricing(), getPaymentInfo(), getUsdRate()]);
  const usd = Math.round(advanceUsd(serviceType, pricing));
  const uzs = rate ? Math.round(usd * rate) : null;
  const appName = (app.appName as string | null) || SERVICE_LABELS[serviceType];
  const ownerName = app.contact?.fullName || user.name || user.email || "Mijoz";
  const ownerPhone = app.contact?.phone || "-";

  // To'lov yozuvi (admin tasdiqlashi uchun)
  try {
    await createPayment({
      appId,
      ownerUid: user.uid,
      ownerName,
      ownerPhone,
      serviceType,
      appName,
      kind: "advance",
      amountUsd: usd,
      rate,
      amountUzs: uzs,
      totalUsd: Math.round(fullUsd(serviceType, pricing)),
      advancePercent: advancePercentFor(serviceType, pricing),
    });
  } catch (e) {
    console.error("[payment/receipt] createPayment xato:", e);
  }

  const caption =
    `💰 *TO'LOV KELDI*\n\n` +
    `📦 ${esc(SERVICE_LABELS[serviceType])}\n` +
    `📱 ${esc(appName)}\n` +
    `👤 ${esc(app.contact?.fullName || user.name || user.email || "Mijoz")}\n` +
    `📞 ${esc(app.contact?.phone || "-")}\n` +
    `💵 Avans: $${esc(String(usd))}` +
    (uzs ? ` \\(\\~${esc(uzs.toLocaleString("en-US"))} so'm\\)` : "") +
    `\n💳 Karta: ${esc(payment.cardNumber || "-")}`;

  // Telegramga chek rasmi (ixtiyoriy — muvaffaqiyatsiz bo'lsa ham belgilanadi)
  try {
    const ext = receipt.name.split(".").pop()?.toLowerCase();
    const filename = `chek_${appId}.${ext || "jpg"}`;
    await sendPhotoToTelegram(receipt.buffer, filename, caption);
  } catch (e) {
    console.error("[payment/receipt] Telegram xato (chek belgilangan):", e);
  }

  try {
    await markReceiptSent(appId);
  } catch (e) {
    console.error("[payment/receipt] markReceiptSent xato:", e);
    return NextResponse.json({ success: false, error: "Saqlashda xato" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
