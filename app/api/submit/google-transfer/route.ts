import { NextRequest, NextResponse } from "next/server";
import { createTransferZip, buildTransferInfo } from "@/lib/zip";
import { sendZipToTelegram, buildTelegramCaption } from "@/lib/telegram";
import { tgAdminLink } from "@/lib/site";
import { getCurrentUser } from "@/lib/auth/dal";
import { createAppSubmission, markTelegramSent } from "@/lib/firestore/apps";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Avval tizimga kiring" }, { status: 401 });
  }

  let formData: FormData;
  try { formData = await req.formData(); } catch {
    return NextResponse.json({ success: false, error: "Forma ma'lumotlarini o'qishda xato" }, { status: 400 });
  }

  const fields = {
    fullName: String(formData.get("fullName") || ""),
    phone: String(formData.get("phone") || ""),
    email: String(formData.get("email") || ""),
    developerAccountId: String(formData.get("developerAccountId") || ""),
    googlePaymentsProfileId: String(formData.get("googlePaymentsProfileId") || ""),
  };

  if (!fields.fullName || !fields.phone || !fields.email || !fields.developerAccountId) {
    return NextResponse.json({ success: false, error: "Majburiy maydonlar to'ldirilmagan" }, { status: 400 });
  }

  const info = buildTransferInfo("google", fields);
  const zipBuffer = await createTransferZip({ clientName: fields.fullName, info });

  const date = new Date().toISOString().split("T")[0];
  const safeName = fields.fullName.replace(/[^\w]/g, "_");
  const filename = `${safeName}_GoogleTransfer_${date}.zip`;

  const caption = buildTelegramCaption({
    serviceName: "Google Play Transfer",
    clientName: fields.fullName,
    phone: fields.phone,
    email: fields.email,
  });

  // 1) Firestore'ga yozish (asosiy)
  let appId: string;
  try {
    appId = await createAppSubmission({
      ownerUid: user.uid,
      ownerEmail: user.email,
      serviceType: "google-transfer",
      appName: null,
      contact: { fullName: fields.fullName, phone: fields.phone, email: fields.email },
      submission: fields,
    });
  } catch (e) {
    console.error("[GT] Firestore yozishda xato:", e);
    return NextResponse.json({ success: false, error: "Arizani saqlashda xato" }, { status: 500 });
  }

  // 2) Telegram (ixtiyoriy)
  try {
    await sendZipToTelegram(zipBuffer, filename, caption + tgAdminLink(appId));
    await markTelegramSent(appId);
  } catch (err) {
    console.error("[GT] Telegram xato (ariza Firestore'da saqlangan):", err);
  }

  return NextResponse.json({ success: true, message: "Ariza muvaffaqiyatli yuborildi!" });
}
