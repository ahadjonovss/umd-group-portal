import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/dal";
import { adminDb } from "@/lib/firebase/admin";
import { createRequest, hasActiveRequest } from "@/lib/firestore/requests";
import { getPricing } from "@/lib/firestore/settings";
import { updateUsd, finalUsd } from "@/lib/payment";
import { getUsdRate } from "@/lib/cbu";
import { sendTelegramMessage } from "@/lib/telegram";
import { SERVICE_LABELS } from "@/lib/labels";
import type { ServiceType } from "@/types";

export const runtime = "nodejs";

function esc(t: string) {
  return t.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, "\\$&");
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ success: false, error: "Avval tizimga kiring" }, { status: 401 });

  let body: { appId?: string; releaseNotes?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Noto'g'ri format" }, { status: 400 });
  }

  const appId = body.appId;
  const releaseNotes = (body.releaseNotes ?? "").trim();
  if (!appId) return NextResponse.json({ success: false, error: "appId yo'q" }, { status: 400 });
  if (!releaseNotes) return NextResponse.json({ success: false, error: "Relizdagi o'zgarishlarni yozing" }, { status: 400 });

  const snap = await adminDb.collection("apps").doc(appId).get();
  if (!snap.exists) return NextResponse.json({ success: false, error: "Ariza topilmadi" }, { status: 404 });
  const app = snap.data()!;
  if (app.ownerUid !== user.uid) return NextResponse.json({ success: false, error: "Ruxsat yo'q" }, { status: 403 });
  if (app.status !== "published") {
    return NextResponse.json({ success: false, error: "Update faqat chiqarilgan ilova uchun" }, { status: 400 });
  }

  const serviceType = app.serviceType as ServiceType;
  const [pricing, rate] = await Promise.all([getPricing(), getUsdRate()]);
  const paymentDone = Boolean(app.finalPaid) || Math.round(finalUsd(serviceType, pricing)) === 0;
  if (!paymentDone) {
    return NextResponse.json({ success: false, error: "Avval qolgan to'lovni yakunlang" }, { status: 400 });
  }

  if (await hasActiveRequest(appId, "update")) {
    return NextResponse.json({ success: false, error: "Bu ilova uchun faol update so'rovi allaqachon bor" }, { status: 409 });
  }

  const usd = Math.round(updateUsd(serviceType, pricing));
  const uzs = rate ? Math.round(usd * rate) : null;
  const appName = (app.appName as string | null) || SERVICE_LABELS[serviceType];
  const ownerName = app.contact?.fullName || user.name || user.email || "Mijoz";
  const ownerPhone = app.contact?.phone || "-";
  const platform = serviceType === "app-store" ? "ios" : "android";

  let id: string;
  try {
    id = await createRequest({
      appId,
      ownerUid: user.uid,
      ownerName,
      ownerPhone,
      serviceType,
      appName,
      type: "update",
      data: { releaseNotes },
      amountUsd: usd,
      rate,
      amountUzs: uzs,
    });
  } catch (e) {
    console.error("[requests/update] create xato:", e);
    return NextResponse.json({ success: false, error: "So'rovni saqlashda xato" }, { status: 500 });
  }

  try {
    const text =
      `🆙 *YANGI UPDATE SO'ROVI*\n\n` +
      `📦 ${esc(SERVICE_LABELS[serviceType])}\n` +
      `📱 ${esc(appName)}\n` +
      `👤 ${esc(ownerName)}\n` +
      `💵 ${esc(String(usd))}$\n` +
      `📝 ${esc(releaseNotes.slice(0, 300))}`;
    await sendTelegramMessage(text);
  } catch {
    // jiddiy emas
  }

  return NextResponse.json({ success: true, id, platform });
}
