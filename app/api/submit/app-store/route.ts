import { NextRequest, NextResponse } from "next/server";
import { createAppStoreZip, buildAppStoreInfo } from "@/lib/zip";
import { sendZipToTelegram, buildTelegramCaption } from "@/lib/telegram";
import { validateAppStoreIcon, validateImageBuffer } from "@/lib/image-validator";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

async function readFile(formData: FormData, key: string): Promise<{ buffer: Buffer; name: string } | null> {
  const file = formData.get(key) as File | null;
  if (!file || file.size === 0) return null;
  return { buffer: Buffer.from(await file.arrayBuffer()), name: file.name };
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  if (!checkRateLimit(ip).allowed) {
    return NextResponse.json({ success: false, error: "Juda ko'p so'rov. 10 daqiqadan keyin qayta urinib ko'ring." }, { status: 429 });
  }

  let formData: FormData;
  try { formData = await req.formData(); } catch {
    return NextResponse.json({ success: false, error: "Forma ma'lumotlarini o'qishda xato" }, { status: 400 });
  }

  const fields = {
    fullName: String(formData.get("fullName") || ""),
    phone: String(formData.get("phone") || ""),
    email: String(formData.get("email") || ""),
    appName: String(formData.get("appName") || ""),
    subtitle: String(formData.get("subtitle") || ""),
    fullDescription: String(formData.get("fullDescription") || ""),
    privacyPolicyUrl: String(formData.get("privacyPolicyUrl") || ""),
    githubRepoUrl: String(formData.get("githubRepoUrl") || ""),
    testLogin: String(formData.get("testLogin") || ""),
    testPassword: String(formData.get("testPassword") || ""),
    note: String(formData.get("note") || ""),
  };

  if (!fields.fullName || !fields.phone || !fields.email || !fields.appName) {
    return NextResponse.json({ success: false, error: "Majburiy maydonlar to'ldirilmagan" }, { status: 400 });
  }

  const iconFile = await readFile(formData, "icon");

  if (!iconFile) {
    return NextResponse.json({ success: false, error: "Ilova ikonasi yuklanmagan" }, { status: 400 });
  }

  // Validate icon (1024x1024, no alpha)
  const iconResult = await validateAppStoreIcon(iconFile.buffer);
  if (!iconResult.valid) {
    return NextResponse.json({ success: false, error: `Icon: ${iconResult.error}` }, { status: 400 });
  }

  // iPhone screenshots
  const iphoneCount = parseInt(String(formData.get("iphoneCount") || "0"));
  const iphoneScreenshots: { name: string; data: Buffer }[] = [];
  for (let i = 0; i < iphoneCount; i++) {
    const s = await readFile(formData, `iphone_${i}`);
    if (s) {
      const vr = await validateImageBuffer(s.buffer, { width: 1320, height: 2868, maxSizeBytes: 8 * 1024 * 1024, strict: false });
      if (!vr.valid) return NextResponse.json({ success: false, error: `iPhone skrinshot ${i + 1}: ${vr.error}` }, { status: 400 });
      iphoneScreenshots.push({ name: s.name, data: s.buffer });
    }
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
      const vr = await validateImageBuffer(s.buffer, { width: 2048, height: 2732, maxSizeBytes: 8 * 1024 * 1024, strict: false });
      if (!vr.valid) return NextResponse.json({ success: false, error: `iPad skrinshot ${i + 1}: ${vr.error}` }, { status: 400 });
      ipadScreenshots.push({ name: s.name, data: s.buffer });
    }
  }

  const info = buildAppStoreInfo(fields);
  const zipBuffer = await createAppStoreZip({
    appName: fields.appName,
    info,
    icon: { name: iconFile.name, data: iconFile.buffer },
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

  try {
    await sendZipToTelegram(zipBuffer, filename, caption);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Telegram xatosi";
    return NextResponse.json({ success: false, error: `Ma'lumotlar tayyorlandi, lekin yuborishda xato: ${msg}` }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Ariza muvaffaqiyatli yuborildi!" });
}
