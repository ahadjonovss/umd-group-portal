import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/dal";
import { adminDb } from "@/lib/firebase/admin";
import { markReceiptSent, markFinalReceiptSent, setAppTaxPhone } from "@/lib/firestore/apps";
import { markRequestReceiptSent } from "@/lib/firestore/requests";
import { readFormFile } from "@/lib/form-utils";
import { bulkPaymentButtons } from "@/lib/telegram";
import { notifier } from "@/lib/telegram-notifier";
import { getPricing, getPaymentInfo } from "@/lib/firestore/settings";
import { createPayment, attachPaymentBatch, type PaymentKind } from "@/lib/firestore/payments";
import { createPaymentBatch } from "@/lib/firestore/paymentBatches";
import { advanceUsdApp, finalUsdApp, serviceBaseUsd, advancePercentForApp } from "@/lib/payment";
import { getActiveDiscount, bindDiscount } from "@/lib/firestore/discounts";
import { categoryForServiceType, applyDiscount } from "@/lib/discount";
import { getUsdRate } from "@/lib/cbu";
import { isTerminalError } from "@/lib/app-status";
import { isRequestTerminalError, REQUEST_TYPE_LABEL, type RequestType } from "@/lib/request-status";
import { isPayable } from "@/lib/payment-state";
import { SERVICE_LABELS } from "@/lib/labels";
import { tgAdminLink } from "@/lib/site";
import { notifyUser, appLink } from "@/lib/notify";
import type { ServiceType } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

function esc(t: string) {
  return t.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, "\\$&");
}

interface BulkItemKey {
  type: "app" | "request";
  appId?: string;
  kind?: "advance" | "final";
  requestId?: string;
}

interface Prepared {
  appId: string;
  requestId: string | null;
  kind: PaymentKind;
  serviceType: ServiceType;
  appName: string | null;
  ownerName: string;
  ownerPhone: string;
  amountUsd: number;
  totalUsd: number;
  advancePercent: number;
  discountId: string | null;
  discountPercent: number;
  label: string;
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

  let keys: BulkItemKey[];
  try {
    keys = JSON.parse(String(formData.get("items") || "[]"));
  } catch {
    return NextResponse.json({ success: false, error: "To'lovlar ro'yxati noto'g'ri" }, { status: 400 });
  }
  if (!Array.isArray(keys) || keys.length < 2) {
    return NextResponse.json({ success: false, error: "Kamida 2 ta to'lov tanlang" }, { status: 400 });
  }
  if (keys.length > 30) {
    return NextResponse.json({ success: false, error: "Juda ko'p to'lov tanlandi" }, { status: 400 });
  }

  const taxPhone = String(formData.get("taxPhone") || "").trim();
  const receipt = await readFormFile(formData, "receipt");
  if (!receipt) {
    return NextResponse.json({ success: false, error: "Chek rasmi yuklanmadi" }, { status: 400 });
  }

  const [pricing, paymentInfo, rate] = await Promise.all([getPricing(), getPaymentInfo(), getUsdRate()]);
  const ownerName = user.name || user.email || "Mijoz";

  // 1-bosqich: har bir elementni tekshirish va summasini hisoblash — hech narsa yozmasdan.
  // Bittasi ham noto'g'ri bo'lsa, butun so'rov rad etiladi (qisman to'lov yaratilmaydi).
  const prepared: Prepared[] = [];
  for (const k of keys) {
    if (k.type === "app" && k.appId && (k.kind === "advance" || k.kind === "final")) {
      const snap = await adminDb.collection("apps").doc(k.appId).get();
      if (!snap.exists) return NextResponse.json({ success: false, error: "Ariza topilmadi" }, { status: 404 });
      const app = snap.data()!;
      if (app.ownerUid !== user.uid) return NextResponse.json({ success: false, error: "Ruxsat yo'q" }, { status: 403 });
      if (isTerminalError(app.status)) {
        return NextResponse.json({ success: false, error: "Bir ariza rad etilgan yoki bekor qilingan — sahifani yangilang" }, { status: 400 });
      }

      const serviceType = app.serviceType as ServiceType;
      const installment = app.payment?.installments?.[k.kind];
      if (installment && !isPayable(installment)) {
        return NextResponse.json({ success: false, error: "Bir yoki bir nechta to'lov allaqachon amalga oshirilgan — sahifani yangilang" }, { status: 400 });
      }

      const pricedApp = { serviceType, servicePrice: typeof app.servicePrice === "number" ? app.servicePrice : null };
      const category = categoryForServiceType(serviceType);
      const discount = category ? await getActiveDiscount(user.uid, category, k.appId) : null;
      const pct = discount?.percent ?? 0;
      const baseAmount = k.kind === "final" ? finalUsdApp(pricedApp, pricing) : advanceUsdApp(pricedApp, pricing);
      const usd = Math.round(applyDiscount(baseAmount, pct));
      const totalUsd = Math.round(applyDiscount(serviceBaseUsd(pricedApp, pricing), pct));
      const appName = (app.appName as string | null) || SERVICE_LABELS[serviceType];

      if (discount) { try { await bindDiscount(discount.id, k.appId); } catch { /* jim */ } }

      prepared.push({
        appId: k.appId,
        requestId: null,
        kind: k.kind,
        serviceType,
        appName,
        ownerName: app.contact?.fullName || ownerName,
        ownerPhone: app.contact?.phone || "-",
        amountUsd: usd,
        totalUsd,
        advancePercent: advancePercentForApp(pricedApp, pricing),
        discountId: discount?.id ?? null,
        discountPercent: pct,
        label: k.kind === "final" ? "Yakuniy to'lov" : "Avans to'lovi",
      });
    } else if (k.type === "request" && k.requestId) {
      const snap = await adminDb.collection("requests").doc(k.requestId).get();
      if (!snap.exists) return NextResponse.json({ success: false, error: "So'rov topilmadi" }, { status: 404 });
      const r = snap.data()!;
      if (r.ownerUid !== user.uid) return NextResponse.json({ success: false, error: "Ruxsat yo'q" }, { status: 403 });
      if (isRequestTerminalError(r.status)) {
        return NextResponse.json({ success: false, error: "Bir so'rov rad etilgan yoki bekor qilingan — sahifani yangilang" }, { status: 400 });
      }
      const fullInst = r.payment?.installments?.full;
      if (fullInst && !isPayable(fullInst)) {
        return NextResponse.json({ success: false, error: "Bir yoki bir nechta to'lov allaqachon amalga oshirilgan — sahifani yangilang" }, { status: 400 });
      }

      const serviceType = r.serviceType as ServiceType;
      const reqType = (r.type as RequestType) ?? "transfer";
      const paymentKind: PaymentKind =
        reqType === "update" ? "update"
        : reqType === "subscription_renewal" ? "renewal"
        : reqType === "push_certificate" ? "push_certificate"
        : reqType === "custom" ? "custom"
        : "transfer";
      const usd = (r.amountUsd as number) ?? 0;
      const appName = (r.appName as string | null) || SERVICE_LABELS[serviceType];

      prepared.push({
        appId: r.appId,
        requestId: k.requestId,
        kind: paymentKind,
        serviceType,
        appName,
        ownerName: (r.ownerName as string) || ownerName,
        ownerPhone: (r.ownerPhone as string) || "-",
        amountUsd: usd,
        totalUsd: usd,
        advancePercent: 100,
        discountId: (r.discountId as string | null) ?? null,
        discountPercent: (r.discountPercent as number) ?? 0,
        label: `${REQUEST_TYPE_LABEL[reqType]} to'lovi`,
      });
    } else {
      return NextResponse.json({ success: false, error: "To'lov ma'lumoti noto'g'ri" }, { status: 400 });
    }
  }

  if (!prepared.length) {
    return NextResponse.json({ success: false, error: "To'lanadigan narsa topilmadi" }, { status: 400 });
  }

  const totalUsd = prepared.reduce((s, p) => s + p.amountUsd, 0);
  const totalUzs = rate ? Math.round(totalUsd * rate) : null;

  // 2-bosqich: barcha to'lovlarni yaratamiz (endi hammasi tekshirilgan)
  const paymentIds: string[] = [];
  for (const p of prepared) {
    const uzs = rate ? Math.round(p.amountUsd * rate) : null;
    try {
      const id = await createPayment({
        appId: p.appId,
        requestId: p.requestId,
        ownerUid: user.uid,
        ownerName: p.ownerName,
        ownerPhone: p.ownerPhone,
        serviceType: p.serviceType,
        appName: p.appName,
        kind: p.kind,
        amountUsd: p.amountUsd,
        rate,
        amountUzs: uzs,
        totalUsd: p.totalUsd,
        advancePercent: p.advancePercent,
        taxPhone: taxPhone || null,
        discountId: p.discountId,
        discountPercent: p.discountPercent,
      });
      paymentIds.push(id);
    } catch (e) {
      console.error("[payment/bulk-receipt] createPayment xato:", e);
    }
  }

  if (!paymentIds.length) {
    return NextResponse.json({ success: false, error: "To'lovlarni saqlashda xato" }, { status: 500 });
  }

  // Guruh yozuvi + har bir to'lovga izoh (jami summa) biriktiriladi
  let batchId: string | null = null;
  try {
    batchId = await createPaymentBatch({
      ownerUid: user.uid,
      ownerName,
      ownerPhone: prepared[0]?.ownerPhone || "-",
      paymentIds,
      totalUsd,
      totalUzs,
    });
    const note = `Guruh to'lov: ${paymentIds.length} ta birga yuborildi — jami $${totalUsd}`;
    await Promise.all(paymentIds.map((id) => attachPaymentBatch(id, batchId!, note)));
  } catch (e) {
    console.error("[payment/bulk-receipt] batch yaratishda xato:", e);
  }

  // Bitta chek — hammasi uchun bitta Telegram xabari
  const lines = prepared.map((p) => `📱 ${esc(p.appName || SERVICE_LABELS[p.serviceType])} — ${esc(p.label)} · $${esc(String(p.amountUsd))}`).join("\n");
  const caption =
    `💰 *GURUH TO'LOV \\(${esc(String(prepared.length))} ta\\)* — jami $${esc(String(totalUsd))}` +
    (totalUzs ? ` \\(\\~${esc(totalUzs.toLocaleString("en-US"))} so'm\\)` : "") +
    `\n\n${lines}\n\n` +
    `👤 ${esc(ownerName)}\n` +
    `📞 ${esc(prepared[0]?.ownerPhone || "-")}\n` +
    `💳 Karta: ${esc(paymentInfo.cardNumber || "-")}` +
    (taxPhone ? `\n📇 Soliq cheki tel: ${esc(taxPhone)}` : "") +
    tgAdminLink(prepared[0].appId);

  try {
    const ext = receipt.name.split(".").pop()?.toLowerCase() || "jpg";
    await notifier.photo(
      "payments",
      receipt.buffer,
      `chek_guruh_${batchId ?? Date.now()}.${ext}`,
      caption,
      batchId ? bulkPaymentButtons(batchId) : undefined
    );
  } catch (e) {
    console.error("[payment/bulk-receipt] Telegram xato (chek belgilangan):", e);
  }

  // Har bir elementni "chek yuborildi" deb belgilaymiz + soliq cheki telefoni
  const touchedAppIds = new Set<string>();
  try {
    for (const p of prepared) {
      if (p.requestId) {
        await markRequestReceiptSent(p.requestId);
      } else if (p.kind === "final") {
        await markFinalReceiptSent(p.appId);
      } else {
        await markReceiptSent(p.appId);
      }
      touchedAppIds.add(p.appId);
    }
    if (taxPhone) {
      for (const appId of touchedAppIds) await setAppTaxPhone(appId, taxPhone);
    }
  } catch (e) {
    console.error("[payment/bulk-receipt] mark xato:", e);
    return NextResponse.json({ success: false, error: "Saqlashda xato" }, { status: 500 });
  }

  // Mijozga tasdiq xabari
  await notifyUser(
    user.uid,
    `🧾 Chekingizni oldik, rahmat 🙌\n\n💳 ${esc(String(prepared.length))} ta to'lov birga · jami $${esc(String(totalUsd))}\n\nTez orada tekshirib tasdiqlaymiz 👌${appLink(prepared[0].appId)}`
  );

  return NextResponse.json({ success: true, batchId });
}
