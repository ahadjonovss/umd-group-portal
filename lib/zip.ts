import JSZip from "jszip";

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^\w\s.-]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_.-]/g, "");
}

function getTodayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export interface PlayMarketZipData {
  appName: string;
  info: string;
  aabFile: { name: string; data: Buffer };
  icon: { name: string; data: Buffer };
  banner: { name: string; data: Buffer };
  screenshots: { name: string; data: Buffer }[];
}

export async function createPlayMarketZip(data: PlayMarketZipData): Promise<Buffer> {
  const zip = new JSZip();

  zip.file("info.txt", data.info);

  const files = zip.folder("files")!;
  files.file("app.aab", data.aabFile.data);

  const graphics = zip.folder("graphics")!;
  graphics.file("icon_512x512.png", data.icon.data);
  graphics.file("banner_1024x500.png", data.banner.data);
  data.screenshots.forEach((s, i) => {
    const ext = s.name.split(".").pop() || "png";
    graphics.file(`screenshot_${String(i + 1).padStart(2, "0")}.${ext}`, s.data);
  });

  const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  return buffer;
}

export interface AppStoreZipData {
  appName: string;
  info: string;
  iphoneScreenshots: { name: string; data: Buffer }[];
  ipadScreenshots: { name: string; data: Buffer }[];
}

export async function createAppStoreZip(data: AppStoreZipData): Promise<Buffer> {
  const zip = new JSZip();
  zip.file("info.txt", data.info);

  const graphics = zip.folder("graphics")!;
  data.iphoneScreenshots.forEach((s, i) => {
    const ext = s.name.split(".").pop() || "png";
    graphics.file(`iphone_screenshot_${String(i + 1).padStart(2, "0")}.${ext}`, s.data);
  });
  data.ipadScreenshots.forEach((s, i) => {
    const ext = s.name.split(".").pop() || "png";
    graphics.file(`ipad_screenshot_${String(i + 1).padStart(2, "0")}.${ext}`, s.data);
  });

  const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  return buffer;
}

export interface TransferZipData {
  clientName: string;
  info: string;
}

export async function createTransferZip(data: TransferZipData): Promise<Buffer> {
  const zip = new JSZip();
  zip.file("info.txt", data.info);
  const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  return buffer;
}

export function buildPlayMarketInfo(fields: Record<string, string>): string {
  const now = new Date().toLocaleString("uz-UZ", { timeZone: "Asia/Tashkent" });
  return `========================================
UMD GROUP — ARIZA MA'LUMOTLARI
========================================
Xizmat turi:     Play Market Joylashtirish
Yuborilgan vaqt: ${now}

--- MIJOZ ---
Ism:      ${fields.fullName}
Telefon:  ${fields.phone}
Email:    ${fields.email}

--- ILOVA ---
Nomi:           ${fields.appName}
Package name:   ${fields.packageName}
Qisqa tavsif:   ${fields.shortDescription}
To'liq tavsif:  ${fields.fullDescription}
Privacy Policy: ${fields.privacyPolicyUrl}

--- TEST AKKAUNT ---
Login:  ${fields.testLogin || "-"}
Parol:  ${fields.testPassword || "-"}

--- IZOH ---
${fields.note || "-"}
========================================`;
}

export function buildAppStoreInfo(fields: Record<string, string>): string {
  const now = new Date().toLocaleString("uz-UZ", { timeZone: "Asia/Tashkent" });
  return `========================================
UMD GROUP — ARIZA MA'LUMOTLARI
========================================
Xizmat turi:     App Store Joylashtirish
Yuborilgan vaqt: ${now}

--- MIJOZ ---
Ism:      ${fields.fullName}
Telefon:  ${fields.phone}
Email:    ${fields.email}
Telegram: ${fields.telegram || "-"}

--- ILOVA ---
Nomi:           ${fields.appName}
Subtitle:       ${fields.subtitle}
To'liq tavsif:  ${fields.fullDescription}
Privacy Policy: ${fields.privacyPolicyUrl}
Support URL:    ${fields.supportUrl}

--- GITHUB ---
Repo URL: ${fields.githubRepoUrl}

--- TEST AKKAUNT ---
Login:  ${fields.testLogin || "-"}
Parol:  ${fields.testPassword || "-"}

--- IZOH ---
${fields.note || "-"}
========================================`;
}

export function buildTransferInfo(
  serviceType: string,
  fields: Record<string, string>
): string {
  const now = new Date().toLocaleString("uz-UZ", { timeZone: "Asia/Tashkent" });
  const isGoogle = serviceType === "google";

  const specificFields = isGoogle
    ? `--- DEVELOPER AKKAUNT ---
Developer Account ID:       ${fields.developerAccountId}
Google Payments Profile ID: ${fields.googlePaymentsProfileId}`
    : `--- DEVELOPER AKKAUNT ---
App Store Connect Team ID:     ${fields.appStoreConnectTeamId}
Apple Developer Account Email: ${fields.appleDevAccountEmail}`;

  return `========================================
UMD GROUP — ARIZA MA'LUMOTLARI
========================================
Xizmat turi:     ${isGoogle ? "Google Play" : "Apple App Store"} Transfer
Yuborilgan vaqt: ${now}

--- MIJOZ ---
Ism:      ${fields.fullName}
Telefon:  ${fields.phone}
Email:    ${fields.email}

${specificFields}
========================================`;
}
