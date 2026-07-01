import { NextRequest, NextResponse } from "next/server";
import { createPlayMarketZip, buildPlayMarketInfo } from "@/lib/zip";
import { sendZipToTelegram, buildTelegramCaption } from "@/lib/telegram";
import { tgAdminLink } from "@/lib/site";
import { readFormFile } from "@/lib/form-utils";
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
  try {
    formData = await req.formData();
  } catch (e) {
    console.error("[PM] formData parse xato:", e);
    return NextResponse.json({ success: false, error: "Forma ma'lumotlarini o'qishda xato" }, { status: 400 });
  }

  const fields = {
    fullName: String(formData.get("fullName") || ""),
    phone: String(formData.get("phone") || ""),
    email: String(formData.get("email") || ""),
    appName: String(formData.get("appName") || ""),
    packageName: String(formData.get("packageName") || ""),
    shortDescription: String(formData.get("shortDescription") || ""),
    fullDescription: String(formData.get("fullDescription") || ""),
    privacyPolicyUrl: String(formData.get("privacyPolicyUrl") || ""),
    testLogin: String(formData.get("testLogin") || ""),
    testPassword: String(formData.get("testPassword") || ""),
    note: String(formData.get("note") || ""),
  };

  console.log("[PM] fields:", { fullName: fields.fullName, appName: fields.appName, email: fields.email });

  if (!fields.fullName || !fields.phone || !fields.email || !fields.appName) {
    console.error("[PM] 400: majburiy text maydonlar yo'q");
    return NextResponse.json({ success: false, error: "Majburiy maydonlar to'ldirilmagan" }, { status: 400 });
  }

  const iconFile = await readFormFile(formData, "icon");
  const bannerFile = await readFormFile(formData, "banner");

  console.log("[PM] files:", { icon: !!iconFile, banner: !!bannerFile });

  if (!iconFile || !bannerFile) {
    console.error("[PM] 400: fayllar yo'q —", { icon: !!iconFile, banner: !!bannerFile });
    return NextResponse.json({
      success: false,
      error: `Fayllar yuklanmadi: ${!iconFile ? "icon " : ""}${!bannerFile ? "banner" : ""}`.trim(),
    }, { status: 400 });
  }

  // Screenshots
  const screenshotCount = parseInt(String(formData.get("screenshotCount") || "0"));
  const screenshots: { name: string; data: Buffer }[] = [];
  for (let i = 0; i < screenshotCount; i++) {
    const s = await readFormFile(formData, `screenshot_${i}`);
    if (s) screenshots.push({ name: s.name, data: s.buffer });
  }

  if (screenshots.length < 2) {
    return NextResponse.json({ success: false, error: "Kamida 2 ta skrinshot talab qilinadi" }, { status: 400 });
  }

  // Build ZIP
  const info = buildPlayMarketInfo(fields);
  const zipBuffer = await createPlayMarketZip({
    appName: fields.appName,
    info,
    icon: { name: iconFile.name, data: iconFile.buffer },
    banner: { name: bannerFile.name, data: bannerFile.buffer },
    screenshots,
  });

  // Send to Telegram
  const date = new Date().toISOString().split("T")[0];
  const safeName = fields.appName.replace(/[^\w]/g, "_");
  const filename = `${safeName}_PlayMarket_${date}.zip`;

  const caption = buildTelegramCaption({
    serviceName: "Play Market Joylashtirish",
    appName: fields.appName,
    clientName: fields.fullName,
    phone: fields.phone,
    email: fields.email,
    privacyPolicyUrl: fields.privacyPolicyUrl,
  });

  // 1) Firestore'ga yozish (asosiy — panelda shu ko'rinadi)
  let appId: string;
  try {
    appId = await createAppSubmission({
      ownerUid: user.uid,
      ownerEmail: user.email,
      serviceType: "play-market",
      appName: fields.appName,
      contact: { fullName: fields.fullName, phone: fields.phone, email: fields.email },
      submission: fields,
    });
  } catch (e) {
    console.error("[PM] Firestore yozishda xato:", e);
    return NextResponse.json({ success: false, error: "Arizani saqlashda xato" }, { status: 500 });
  }

  // 2) Telegramga yuborish (ixtiyoriy — muvaffaqiyatsiz bo'lsa ham ariza saqlangan)
  try {
    await sendZipToTelegram(zipBuffer, filename, caption + tgAdminLink(appId));
    await markTelegramSent(appId);
  } catch (err) {
    console.error("[PM] Telegram xato (ariza Firestore'da saqlangan):", err);
  }

  return NextResponse.json({ success: true, message: "Ariza muvaffaqiyatli yuborildi!" });
}
