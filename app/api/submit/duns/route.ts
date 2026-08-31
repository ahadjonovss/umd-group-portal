import { NextRequest, NextResponse } from "next/server";
import { createTransferZip, buildDunsInfo } from "@/lib/zip";
import { buildTelegramCaption } from "@/lib/telegram";
import { notifier } from "@/lib/telegram-notifier";
import { tgAdminLink } from "@/lib/site";
import { getCurrentUser } from "@/lib/auth/dal";
import { getUser } from "@/lib/firestore/users";
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

  // Mijoz ma'lumotlari — hisobdan (qayta so'ralmaydi)
  const profile = await getUser(user.uid);
  const contact = {
    fullName: profile?.fullName || user.name || "Mijoz",
    phone: profile?.phone || "",
    email: user.email || profile?.email || "",
  };

  const fields = {
    ...contact,
    companyName: String(formData.get("companyName") || ""),
    legalAddress: String(formData.get("legalAddress") || ""),
    companyPhone: String(formData.get("companyPhone") || ""),
    website: String(formData.get("website") || ""),
    cpName: String(formData.get("cpName") || ""),
    cpPhone: String(formData.get("cpPhone") || ""),
  };

  if (!fields.companyName || !fields.legalAddress || !fields.companyPhone || !fields.cpName) {
    return NextResponse.json({ success: false, error: "Majburiy maydonlarni to'ldiring" }, { status: 400 });
  }

  const info = buildDunsInfo(fields);
  const zipBuffer = await createTransferZip({ clientName: fields.fullName, info });

  const date = new Date().toISOString().split("T")[0];
  const safeName = fields.fullName.replace(/[^\w]/g, "_");
  const filename = `${safeName}_DUNS_${date}.zip`;

  const caption = buildTelegramCaption({
    serviceName: "DUNS raqami ochish",
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
      serviceType: "duns",
      appName: fields.companyName || null,
      contact: { fullName: fields.fullName, phone: fields.phone, email: fields.email },
      submission: fields,
    });
  } catch (e) {
    console.error("[DUNS] Firestore yozishda xato:", e);
    return NextResponse.json({ success: false, error: "Arizani saqlashda xato" }, { status: 500 });
  }

  // 2) Telegram (ixtiyoriy)
  try {
    await notifier.document("apps", zipBuffer, filename, caption + tgAdminLink(appId));
    await markTelegramSent(appId);
  } catch (err) {
    console.error("[DUNS] Telegram xato (ariza Firestore'da saqlangan):", err);
  }

  return NextResponse.json({ success: true, message: "Ariza muvaffaqiyatli yuborildi!" });
}
