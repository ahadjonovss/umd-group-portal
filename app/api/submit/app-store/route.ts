import { NextRequest, NextResponse } from "next/server";
import { createAppStoreZip, buildAppStoreInfo } from "@/lib/zip";
import { sendZipToTelegram, buildTelegramCaption } from "@/lib/telegram";
import { readFormFile as readFile } from "@/lib/form-utils";
import { getCurrentUser } from "@/lib/auth/dal";
import { createAppSubmission, markTelegramSent } from "@/lib/firestore/apps";

export const runtime = "nodejs";
export const maxDuration = 60;

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
    telegram: String(formData.get("telegram") || ""),
    appName: String(formData.get("appName") || ""),
    subtitle: String(formData.get("subtitle") || ""),
    fullDescription: String(formData.get("fullDescription") || ""),
    privacyPolicyUrl: String(formData.get("privacyPolicyUrl") || ""),
    supportUrl: String(formData.get("supportUrl") || ""),
    githubRepoUrl: String(formData.get("githubRepoUrl") || ""),
    testLogin: String(formData.get("testLogin") || ""),
    testPassword: String(formData.get("testPassword") || ""),
    note: String(formData.get("note") || ""),
  };

  if (!fields.fullName || !fields.phone || !fields.email || !fields.appName) {
    return NextResponse.json({ success: false, error: "Majburiy maydonlar to'ldirilmagan" }, { status: 400 });
  }

  // iPhone screenshots
  const iphoneCount = parseInt(String(formData.get("iphoneCount") || "0"));
  const iphoneScreenshots: { name: string; data: Buffer }[] = [];
  for (let i = 0; i < iphoneCount; i++) {
    const s = await readFile(formData, `iphone_${i}`);
    if (s) iphoneScreenshots.push({ name: s.name, data: s.buffer });
  }

  if (iphoneScreenshots.length < 3) {
    return NextResponse.json({ success: false, error: "Kamida 3 ta iPhone skrinshot talab qilinadi" }, { status: 400 });
  }

  // iPad screenshots (optional)
  const ipadCount = parseInt(String(formData.get("ipadCount") || "0"));
  const ipadScreenshots: { name: string; data: Buffer }[] = [];
  for (let i = 0; i < ipadCount; i++) {
    const s = await readFile(formData, `ipad_${i}`);
    if (s) {
      ipadScreenshots.push({ name: s.name, data: s.buffer });
    }
  }

  const info = buildAppStoreInfo(fields);
  const zipBuffer = await createAppStoreZip({
    appName: fields.appName,
    info,
    iphoneScreenshots,
    ipadScreenshots,
  });

  const date = new Date().toISOString().split("T")[0];
  const safeName = fields.appName.replace(/[^\w]/g, "_");
  const filename = `${safeName}_AppStore_${date}.zip`;

  const caption = buildTelegramCaption({
    serviceName: "App Store Joylashtirish",
    appName: fields.appName,
    clientName: fields.fullName,
    phone: fields.phone,
    email: fields.email,
    privacyPolicyUrl: fields.privacyPolicyUrl,
  });

  // 1) Firestore'ga yozish (asosiy)
  let appId: string;
  try {
    appId = await createAppSubmission({
      ownerUid: user.uid,
      ownerEmail: user.email,
      serviceType: "app-store",
      appName: fields.appName,
      contact: { fullName: fields.fullName, phone: fields.phone, email: fields.email },
      submission: fields,
    });
  } catch (e) {
    console.error("[AS] Firestore yozishda xato:", e);
    return NextResponse.json({ success: false, error: "Arizani saqlashda xato" }, { status: 500 });
  }

  // 2) Telegram (ixtiyoriy)
  try {
    await sendZipToTelegram(zipBuffer, filename, caption);
    await markTelegramSent(appId);
  } catch (err) {
    console.error("[AS] Telegram xato (ariza Firestore'da saqlangan):", err);
  }

  return NextResponse.json({ success: true, message: "Ariza muvaffaqiyatli yuborildi!" });
}
