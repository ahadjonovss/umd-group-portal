import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/dal";
import { adminDb } from "@/lib/firebase/admin";
import { markRequestReceiptSent } from "@/lib/firestore/requests";
import { createPayment } from "@/lib/firestore/payments";
import { readFormFile } from "@/lib/form-utils";
import { sendPhotoToTelegram } from "@/lib/telegram";
import { SERVICE_LABELS } from "@/lib/labels";
import { REQUEST_TYPE_LABEL, type RequestType } from "@/lib/request-status";
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
  if (!requestId) return NextResponse.json({ success: false, error: "requestId yo'q" }, { status: 400 });

  const snap = await adminDb.collection("requests").doc(requestId).get();
  if (!snap.exists) return NextResponse.json({ success: false, error: "So'rov topilmadi" }, { status: 404 });
  const r = snap.data()!;
  if (r.ownerUid !== user.uid) return NextResponse.json({ success: false, error: "Ruxsat yo'q" }, { status: 403 });
  if (r.status !== "payment_pending") {
    return NextResponse.json({ success: false, error: "To'lov kutilmayapti" }, { status: 400 });
  }

  const receipt = await readFormFile(formData, "receipt");
  if (!receipt) return NextResponse.json({ success: false, error: "Chek rasmi yuklanmadi" }, { status: 400 });

  const serviceType = r.serviceType as ServiceType;
  const typeLabel = REQUEST_TYPE_LABEL[(r.type as RequestType) ?? "transfer"];
  const appName = (r.appName as string | null) || SERVICE_LABELS[serviceType];
  const usd = r.amountUsd ?? 0;
  const uzs = typeof r.amountUzs === "number" ? r.amountUzs : null;

  const caption =
    `💰 *TO'LOV KELDI \\(${esc(typeLabel)}\\)*\n\n` +
    `📦 ${esc(SERVICE_LABELS[serviceType])}\n` +
    `📱 ${esc(appName)}\n` +
    `👤 ${esc(r.ownerName || user.name || user.email || "Mijoz")}\n` +
    `📞 ${esc(r.ownerPhone || "-")}\n` +
    `💵 ${esc(String(usd))}$` +
    (uzs ? ` \\(\\~${esc(uzs.toLocaleString("en-US"))} so'm\\)` : "");

  try {
    const ext = receipt.name.split(".").pop()?.toLowerCase() || "jpg";
    await sendPhotoToTelegram(receipt.buffer, `chek_${requestId}.${ext}`, caption);
  } catch (e) {
    console.error("[requests/receipt] Telegram xato (belgilangan):", e);
  }

  // Birinchi marta chek yuborilsa — To'lovlar bo'limi uchun to'lov yozuvi yaratiladi
  if (!r.receiptSent) {
    try {
      await createPayment({
        appId: r.appId,
        requestId,
        ownerUid: user.uid,
        ownerName: r.ownerName || user.name || user.email || "Mijoz",
        ownerPhone: r.ownerPhone || "-",
        serviceType,
        appName,
        kind: "transfer",
        amountUsd: usd,
        rate: r.rate ?? null,
        amountUzs: uzs,
        totalUsd: usd,
        advancePercent: 100,
      });
    } catch (e) {
      console.error("[requests/receipt] createPayment xato:", e);
    }
  }

  try {
    await markRequestReceiptSent(requestId);
  } catch (e) {
    console.error("[requests/receipt] markReceiptSent xato:", e);
    return NextResponse.json({ success: false, error: "Saqlashda xato" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
