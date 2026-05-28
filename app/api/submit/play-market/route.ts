import { NextRequest, NextResponse } from "next/server";
import { createPlayMarketZip, buildPlayMarketInfo } from "@/lib/zip";
import { sendZipToTelegram, buildTelegramCaption } from "@/lib/telegram";
import { validateImageBuffer, validateImageBuffer as val } from "@/lib/image-validator";
import { checkRateLimit } from "@/lib/rate-limit";
import { readFormFile } from "@/lib/form-utils";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { success: false, error: "Juda ko'p so'rov. 10 daqiqadan keyin qayta urinib ko'ring." },
      { status: 429 }
    );
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

  const aabFile = await readFormFile(formData, "aabFile");
  const iconFile = await readFormFile(formData, "icon");
  const bannerFile = await readFormFile(formData, "banner");

  console.log("[PM] files:", { aab: !!aabFile, icon: !!iconFile, banner: !!bannerFile });

  if (!aabFile || !iconFile || !bannerFile) {
    console.error("[PM] 400: fayllar yo'q —", { aab: !!aabFile, icon: !!iconFile, banner: !!bannerFile });
    return NextResponse.json({
      success: false,
      error: `Fayllar yuklanmadi: ${!aabFile ? "AAB " : ""}${!iconFile ? "icon " : ""}${!bannerFile ? "banner" : ""}`.trim(),
    }, { status: 400 });
  }

  // Validate icon
  const iconResult = await validateImageBuffer(iconFile.buffer, {
    width: 512, height: 512, maxSizeBytes: 1 * 1024 * 1024, strict: true,
  });
  if (!iconResult.valid) {
    return NextResponse.json({ success: false, error: `Icon: ${iconResult.error}` }, { status: 400 });
  }

  // Validate banner
  const bannerResult = await val(bannerFile.buffer, {
    width: 1024, height: 500, maxSizeBytes: 1 * 1024 * 1024, strict: true,
  });
  if (!bannerResult.valid) {
    return NextResponse.json({ success: false, error: `Banner: ${bannerResult.error}` }, { status: 400 });
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
    aabFile: { name: aabFile.name, data: aabFile.buffer },
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

  try {
    await sendZipToTelegram(zipBuffer, filename, caption);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Telegram xatosi";
    return NextResponse.json(
      { success: false, error: `Ma'lumotlar tayyorlandi, lekin yuborishda xato: ${msg}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, message: "Ariza muvaffaqiyatli yuborildi!" });
}
