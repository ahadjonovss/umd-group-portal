import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/dal";
import { createAppSubmission, markTelegramSent } from "@/lib/firestore/apps";
import { getPricing } from "@/lib/firestore/settings";
import { accountBaseUsd, type AccountPlatform, type AccountType } from "@/lib/payment";
import { readFormFile } from "@/lib/form-utils";
import { sendTelegramMessage, sendPhotoToTelegram, sendZipToTelegram } from "@/lib/telegram";
import { tgAdminLink } from "@/lib/site";

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

  const platform = (formData.get("platform") === "apple" ? "apple" : "google") as AccountPlatform;
  const accountType = (formData.get("accountType") === "corporate" ? "corporate" : "personal") as AccountType;

  // Barcha matn maydonlarini submission'ga yig'amiz
  const submission: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (k === "certificate") continue;
    if (typeof v === "string" && v.trim()) submission[k] = v.trim();
  }

  const fullName = submission.fullName || user.name || user.email || "Mijoz";
  const phone = submission.phone || "-";
  const email = submission.email || user.email || "";
  const appName =
    accountType === "corporate"
      ? submission.companyName || "Korporativ akkaunt"
      : submission.holderName || fullName;

  const pricing = await getPricing();
  const servicePrice = Math.round(accountBaseUsd(platform, accountType, pricing));

  let appId: string;
  try {
    appId = await createAppSubmission({
      ownerUid: user.uid,
      ownerEmail: user.email,
      serviceType: "account",
      appName,
      contact: { fullName, phone, email },
      submission,
      servicePrice,
      accountPlatform: platform,
      accountType,
    });
  } catch (e) {
    console.error("[submit/account] Firestore xato:", e);
    return NextResponse.json({ success: false, error: "So'rovni saqlashda xato" }, { status: 500 });
  }

  const platformLabel = platform === "apple" ? "App Store Connect" : "Google Play Console";
  const typeLabel = accountType === "corporate" ? "Korporativ" : "Shaxsiy";
  const caption =
    `🆕 *YANGI AKKAUNT SO'ROVI*\n\n` +
    `📦 ${esc(platformLabel)} — ${esc(typeLabel)}\n` +
    `🏷 ${esc(appName)}\n` +
    `👤 ${esc(fullName)} · ${esc(phone)}\n` +
    `🔑 ${esc(submission.login || "-")}\n` +
    `💵 ${esc(String(servicePrice))}$` +
    tgAdminLink(appId);

  try {
    const cert = await readFormFile(formData, "certificate");
    if (cert) {
      const ext = (cert.name.split(".").pop() || "").toLowerCase();
      if (["jpg", "jpeg", "png", "webp"].includes(ext)) {
        await sendPhotoToTelegram(cert.buffer, cert.name, caption);
      } else {
        await sendZipToTelegram(cert.buffer, cert.name, caption);
      }
    } else {
      await sendTelegramMessage(caption);
    }
    await markTelegramSent(appId);
  } catch (e) {
    console.error("[submit/account] Telegram xato (ariza saqlangan):", e);
  }

  return NextResponse.json({ success: true, appId });
}
