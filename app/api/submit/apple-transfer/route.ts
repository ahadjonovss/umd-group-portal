import { NextRequest, NextResponse } from "next/server";
import { createTransferZip, buildTransferInfo } from "@/lib/zip";
import { sendZipToTelegram, buildTelegramCaption } from "@/lib/telegram";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let formData: FormData;
  try { formData = await req.formData(); } catch {
    return NextResponse.json({ success: false, error: "Forma ma'lumotlarini o'qishda xato" }, { status: 400 });
  }

  const fields = {
    fullName: String(formData.get("fullName") || ""),
    phone: String(formData.get("phone") || ""),
    email: String(formData.get("email") || ""),
    appStoreConnectTeamId: String(formData.get("appStoreConnectTeamId") || ""),
    appleDevAccountEmail: String(formData.get("appleDevAccountEmail") || ""),
  };

  if (!fields.fullName || !fields.phone || !fields.email || !fields.appStoreConnectTeamId) {
    return NextResponse.json({ success: false, error: "Majburiy maydonlar to'ldirilmagan" }, { status: 400 });
  }

  const info = buildTransferInfo("apple", fields);
  const zipBuffer = await createTransferZip({ clientName: fields.fullName, info });

  const date = new Date().toISOString().split("T")[0];
  const safeName = fields.fullName.replace(/[^\w]/g, "_");
  const filename = `${safeName}_AppleTransfer_${date}.zip`;

  const caption = buildTelegramCaption({
    serviceName: "Apple App Store Transfer",
    clientName: fields.fullName,
    phone: fields.phone,
    email: fields.email,
  });

  try {
    await sendZipToTelegram(zipBuffer, filename, caption);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Telegram xatosi";
    return NextResponse.json({ success: false, error: `Ma'lumotlar tayyorlandi, lekin yuborishda xato: ${msg}` }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Ariza muvaffaqiyatli yuborildi!" });
}
