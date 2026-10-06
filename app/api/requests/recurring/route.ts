import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/dal";
import { adminDb } from "@/lib/firebase/admin";
import { issueNextRecurringInvoice } from "@/lib/firestore/recurring";

export const runtime = "nodejs";

// Mijoz keyingi davrni muddatidan oldin to'lamoqchi — hisob-fakturani o'zi chiqaradi.
// Bir vaqtda faqat bitta to'lanmagan davriy hisob bo'lishi mumkin: uni to'lagach
// yana bosib, keyingi davrni ham oldindan yopa oladi.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ success: false, error: "Avval tizimga kiring" }, { status: 401 });

  let body: { appId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Noto'g'ri format" }, { status: 400 });
  }

  const appId = body.appId;
  if (!appId) return NextResponse.json({ success: false, error: "appId yo'q" }, { status: 400 });

  const snap = await adminDb.collection("apps").doc(appId).get();
  if (!snap.exists) return NextResponse.json({ success: false, error: "Ariza topilmadi" }, { status: 404 });
  if (snap.get("ownerUid") !== user.uid) {
    return NextResponse.json({ success: false, error: "Ruxsat yo'q" }, { status: 403 });
  }

  const res = await issueNextRecurringInvoice(appId, { maxOpen: 1 });
  if (!res.ok) return NextResponse.json({ success: false, error: res.error ?? "Xatolik" }, { status: 400 });

  return NextResponse.json({ success: true, periodNo: res.periodNo, amountUsd: res.amountUsd });
}
