import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/dal";
import { adminDb } from "@/lib/firebase/admin";
import { createRequest, hasActiveRequest } from "@/lib/firestore/requests";
import { getPricing } from "@/lib/firestore/settings";
import { pushCertUsd, finalUsdApp } from "@/lib/payment";
import { getUsdRate } from "@/lib/cbu";
import { sendTelegramMessage } from "@/lib/telegram";
import { SERVICE_LABELS, platformOf } from "@/lib/labels";
import { tgAdminLink } from "@/lib/site";
import { getActiveDiscount, bindDiscount } from "@/lib/firestore/discounts";
import { categoryForRequest, applyDiscount } from "@/lib/discount";
import { isTerminalSuccess } from "@/lib/app-status";
import type { ServiceType } from "@/types";

export const runtime = "nodejs";

function esc(t: string) {
  return t.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, "\\$&");
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Avval tizimga kiring" }, { status: 401 });
  }

  let body: { appId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Noto'g'ri format" }, { status: 400 });
  }

  const appId = body.appId;
  if (!appId) return NextResponse.json({ success: false, error: "appId yo'q" }, { status: 400 });

  const snap = await adminDb.collection("apps").doc(appId).get();
  if (!snap.exists) return NextResponse.json({ success: false, error: "Ariza topilmadi" }, { status: 404 });
  const app = snap.data()!;
  if (app.ownerUid !== user.uid) return NextResponse.json({ success: false, error: "Ruxsat yo'q" }, { status: 403 });

  const serviceType = app.serviceType as ServiceType;
  // Faqat Apple (iOS) ilovalar, chiqarilgan/yakunlangan
  if (platformOf(serviceType) !== "ios" || !isTerminalSuccess(app.status)) {
    return NextResponse.json({ success: false, error: "Push sertifikat faqat Apple ilovalari uchun" }, { status: 400 });
  }

  if (await hasActiveRequest(appId, "push_certificate")) {
    return NextResponse.json({ success: false, error: "Bu ilova uchun faol push sertifikat so'rovi bor" }, { status: 409 });
  }

  const [pricing, rate] = await Promise.all([getPricing(), getUsdRate()]);
  // Asosiy (yakuniy) to'lov yakunlanmaguncha push sertifikat so'ralmaydi
  const paymentDone = Boolean(app.finalPaid) || Math.round(finalUsdApp({ serviceType, servicePrice: app.servicePrice }, pricing)) === 0;
  if (!paymentDone) {
    return NextResponse.json({ success: false, error: "Avval asosiy to'lovni yakunlang" }, { status: 400 });
  }
  const discount = await getActiveDiscount(user.uid, categoryForRequest("push_certificate"), appId);
  const pct = discount?.percent ?? 0;
  const usd = Math.round(applyDiscount(pushCertUsd(pricing), pct));
  const uzs = rate ? Math.round(usd * rate) : null;
  const appName = (app.appName as string | null) || SERVICE_LABELS[serviceType];
  const ownerName = app.contact?.fullName || user.name || user.email || "Mijoz";
  const ownerPhone = app.contact?.phone || "-";
  if (discount) { try { await bindDiscount(discount.id, appId); } catch {} }

  let id: string;
  try {
    id = await createRequest({
      appId,
      ownerUid: user.uid,
      ownerName,
      ownerPhone,
      serviceType,
      appName,
      type: "push_certificate",
      data: {},
      amountUsd: usd,
      rate,
      amountUzs: uzs,
      discountId: discount?.id ?? null,
      discountPercent: pct,
    });
  } catch (e) {
    console.error("[requests/push-certificate] create xato:", e);
    return NextResponse.json({ success: false, error: "So'rovni saqlashda xato" }, { status: 500 });
  }

  try {
    const text =
      `🔔 *YANGI PUSH SERTIFIKAT SO'ROVI*\n\n` +
      `📦 ${esc(SERVICE_LABELS[serviceType])}\n` +
      `📱 ${esc(appName)}\n` +
      `👤 ${esc(ownerName)}\n` +
      `📞 ${esc(ownerPhone)}\n` +
      `💵 ${esc(String(usd))}$` +
      tgAdminLink(appId);
    await sendTelegramMessage(text);
  } catch {
    // jiddiy emas
  }

  return NextResponse.json({ success: true, id });
}
