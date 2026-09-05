import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/dal";
import { getUser } from "@/lib/firestore/users";
import { getCatalogService } from "@/lib/firestore/catalog";
import { createAppSubmission, markTelegramSent, type RecurringInit } from "@/lib/firestore/apps";
import { snapshotOf } from "@/lib/service-def";
import { notifier } from "@/lib/telegram-notifier";
import { tgAdminLink } from "@/lib/site";

export const runtime = "nodejs";

function esc(t: string) {
  return t.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, "\\$&");
}

// Ochiq (self-service) maxsus xizmatga ariza.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ success: false, error: "Avval tizimga kiring" }, { status: 401 });

  let body: { catalogId?: string; fields?: Record<string, string>; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "So'rov formati noto'g'ri" }, { status: 400 });
  }

  const catalogId = String(body.catalogId || "");
  if (!catalogId) return NextResponse.json({ success: false, error: "Xizmat tanlanmagan" }, { status: 400 });

  const svc = await getCatalogService(catalogId);
  if (!svc || !svc.active || svc.scope !== "public") {
    return NextResponse.json({ success: false, error: "Bu xizmatga hozir ariza qabul qilinmayapti" }, { status: 400 });
  }

  // Majburiy maydonlar tekshiruvi (server tomonda ham)
  const values = body.fields ?? {};
  const missing = svc.fields.filter((f) => f.required && !String(values[f.key] ?? "").trim());
  if (missing.length) {
    return NextResponse.json(
      { success: false, error: `Majburiy maydonlar to'ldirilmagan: ${missing.map((f) => f.label).join(", ")}` },
      { status: 400 }
    );
  }

  const profile = await getUser(user.uid);
  const contact = {
    fullName: profile?.fullName || user.name || "Mijoz",
    phone: profile?.phone || "",
    email: user.email || profile?.email || "",
  };

  // Faqat katalogda e'lon qilingan maydonlar saqlanadi
  const submission: Record<string, string> = {};
  for (const f of svc.fields) {
    const v = String(values[f.key] ?? "").trim();
    if (v) submission[f.key] = v.slice(0, 2000);
  }
  const note = String(body.note ?? "").trim();
  if (note) submission.note = note.slice(0, 2000);

  const snapshot = snapshotOf(svc);
  const rec: RecurringInit | null =
    snapshot.pricing.recurring.enabled && snapshot.pricing.recurring.amountUsd > 0
      ? {
          amountUsd: snapshot.pricing.recurring.amountUsd,
          periodMonths: snapshot.pricing.recurring.periodMonths,
          startsWhen: snapshot.pricing.recurring.startsWhen,
          firstPeriodFree: snapshot.pricing.recurring.firstPeriodFree,
          graceDays: snapshot.pricing.recurring.graceDays,
        }
      : null;

  let appId: string;
  try {
    appId = await createAppSubmission({
      ownerUid: user.uid,
      ownerEmail: user.email,
      serviceType: "custom",
      appName: svc.name,
      contact,
      submission,
      servicePrice: snapshot.pricing.oneTime.enabled ? snapshot.pricing.oneTime.amountUsd : 0,
      catalogId: svc.id,
      catalogSnapshot: snapshot,
      recurring: rec,
    });
  } catch (e) {
    console.error("[custom submit] Firestore xato:", e);
    return NextResponse.json({ success: false, error: "Arizani saqlashda xato" }, { status: 500 });
  }

  try {
    const lines = Object.entries(submission)
      .map(([k, v]) => `${esc(svc.fields.find((f) => f.key === k)?.label ?? k)}: ${esc(v)}`)
      .join("\n");
    await notifier.apps(
      `📥 *YANGI ARIZA \\(${esc(svc.name)}\\)*\n\n` +
        `👤 ${esc(contact.fullName)}\n📞 ${esc(contact.phone || "-")}\n📧 ${esc(contact.email || "-")}\n\n${lines}` +
        tgAdminLink(appId)
    );
    await markTelegramSent(appId);
  } catch (err) {
    console.error("[custom submit] Telegram xato:", err);
  }

  return NextResponse.json({ success: true, id: appId, message: "Ariza yuborildi" });
}
