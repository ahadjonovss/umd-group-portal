import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/dal";
import { adminDb } from "@/lib/firebase/admin";
import { markRequestReceiptSent } from "@/lib/firestore/requests";
import { createPayment, type PaymentKind } from "@/lib/firestore/payments";
import { setAppTaxPhone } from "@/lib/firestore/apps";
import { readFormFile } from "@/lib/form-utils";
import { getUsdRate } from "@/lib/cbu";
import { sendPhotoToTelegram, paymentButtons } from "@/lib/telegram";
import { SERVICE_LABELS } from "@/lib/labels";
import { tgAdminLink } from "@/lib/site";
import { REQUEST_TYPE_LABEL, isRequestTerminalError, type RequestStatus, type RequestType } from "@/lib/request-status";
import { isPayable } from "@/lib/payment-state";
import type { ServiceType } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

function esc(t: string) {
  return t.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, "\\$&");
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ success: false, error: "Avval tizimga kiring" }, { status: 401 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ success: false, error: "Forma o'qishda xato" }, { status: 400 });
  }

  const requestId = String(formData.get("requestId") || "");
  const taxPhone = String(formData.get("taxPhone") || "").trim();
  if (!requestId) return NextResponse.json({ success: false, error: "requestId yo'q" }, { status: 400 });

  const snap = await adminDb.collection("requests").doc(requestId).get();
  if (!snap.exists) return NextResponse.json({ success: false, error: "So'rov topilmadi" }, { status: 404 });
  const r = snap.data()!;
  if (r.ownerUid !== user.uid) return NextResponse.json({ success: false, error: "Ruxsat yo'q" }, { status: 403 });
  // To'lov qabul qilinishi payment obyektidagi qism holatiga qarab (statusdan mustaqil).
  const fullInst = r.payment?.installments?.full;
  if (fullInst) {
    if (!isPayable(fullInst)) {
      return NextResponse.json({ success: false, error: "To'lov kutilmayapti" }, { status: 400 });
    }
  } else {
    const st = r.status as RequestStatus;
    if (isRequestTerminalError(st) || st === "completed") {
      return NextResponse.json({ success: false, error: "To'lov kutilmayapti" }, { status: 400 });
    }
  }

  const receipt = await readFormFile(formData, "receipt");
  if (!receipt) return NextResponse.json({ success: false, error: "Chek rasmi yuklanmadi" }, { status: 400 });

  const serviceType = r.serviceType as ServiceType;
  const reqType = (r.type as RequestType) ?? "transfer";
  const typeLabel = REQUEST_TYPE_LABEL[reqType];
  const paymentKind: PaymentKind =
    reqType === "update" ? "update" : reqType === "subscription_renewal" ? "renewal" : "transfer";
  const appName = (r.appName as string | null) || SERVICE_LABELS[serviceType];
  const usd = r.amountUsd ?? 0;
  // To'lov PAYTIDAGI kurs (so'rov yaratilgan paytdagi emas) — chek uchun aniq summa
  const rate = await getUsdRate();
  const uzs = rate ? Math.round(usd * rate) : typeof r.amountUzs === "number" ? r.amountUzs : null;

  const caption =
    `💰 *TO'LOV KELDI \\(${esc(typeLabel)}\\)*\n\n` +
    `📦 ${esc(SERVICE_LABELS[serviceType])}\n` +
    `📱 ${esc(appName)}\n` +
    `👤 ${esc(r.ownerName || user.name || user.email || "Mijoz")}\n` +
    `📞 ${esc(r.ownerPhone || "-")}\n` +
    `💵 ${esc(String(usd))}$` +
    (uzs ? ` \\(\\~${esc(uzs.toLocaleString("en-US"))} so'm\\)` : "") +
    (taxPhone ? `\n📇 Soliq cheki tel: ${esc(taxPhone)}` : "") +
    tgAdminLink(r.appId as string);

  // Birinchi marta chek yuborilsa — To'lovlar yozuvi yaratiladi (buttonlar uchun paymentId kerak)
  let paymentId: string | null = null;
  if (!r.receiptSent) {
    try {
      paymentId = await createPayment({
        appId: r.appId,
        requestId,
        ownerUid: user.uid,
        ownerName: r.ownerName || user.name || user.email || "Mijoz",
        ownerPhone: r.ownerPhone || "-",
        serviceType,
        appName,
        kind: paymentKind,
        amountUsd: usd,
        rate,
        amountUzs: uzs,
        totalUsd: usd,
        advancePercent: 100,
        taxPhone: taxPhone || null,
        discountId: (r.discountId as string | null) ?? null,
        discountPercent: (r.discountPercent as number) ?? 0,
      });
    } catch (e) {
      console.error("[requests/receipt] createPayment xato:", e);
    }
  }

  try {
    const ext = receipt.name.split(".").pop()?.toLowerCase() || "jpg";
    await sendPhotoToTelegram(
      receipt.buffer,
      `chek_${requestId}.${ext}`,
      caption,
      paymentId ? paymentButtons(paymentId) : undefined
    );
  } catch (e) {
    console.error("[requests/receipt] Telegram xato (belgilangan):", e);
  }

  try {
    await markRequestReceiptSent(requestId);
    if (taxPhone) await setAppTaxPhone(r.appId as string, taxPhone);
  } catch (e) {
    console.error("[requests/receipt] markReceiptSent xato:", e);
    return NextResponse.json({ success: false, error: "Saqlashda xato" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
