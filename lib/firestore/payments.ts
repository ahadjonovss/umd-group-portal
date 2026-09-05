import "server-only";
import { adminDb, FieldValue, Timestamp, type QueryDocumentSnapshot } from "@/lib/firebase/admin";
import { statusFlowFor, workStartFor, type AppStatus } from "@/lib/app-status";
import { setAppStatus, setFinalPaid, activateUpdatePackage, serviceDefOf, startRecurring } from "@/lib/firestore/apps";
import { confirmRequestPayment } from "@/lib/firestore/requests";
import { markDiscountUsed } from "@/lib/firestore/discounts";
import { logActivity, type Actor } from "@/lib/firestore/activity";
import { kindToInstallment } from "@/lib/payment-state";
import { getUserWalletUzs, adjustWallet } from "@/lib/firestore/users";
import { notifyUser, esc, appLink } from "@/lib/notify";
import { SERVICE_LABELS } from "@/lib/labels";
import { getPricing } from "@/lib/firestore/settings";
import { finalUsd } from "@/lib/payment";
import type { ServiceType } from "@/types";

// Servisning (app/request) payment obyektidagi installment holatini yangilaydi.
async function setInstallment(
  appId: string,
  requestId: string | null | undefined,
  kind: string,
  fields: Record<string, unknown>
): Promise<void> {
  try {
    if (kind === "update_package") return; // paket sotib olish — installmentga tegmaydi
    const col = requestId ? "requests" : "apps";
    const id = requestId ?? appId;
    if (!id) return;
    // Ilovada "full" (to'liq) to'lov — avans va yakuniy qismlarini birga belgilaydi.
    const keys = !requestId && kind === "full" ? ["advance", "final"] : [kindToInstallment(kind)];
    const update: Record<string, unknown> = {};
    for (const key of keys) for (const [k, v] of Object.entries(fields)) update[`payment.installments.${key}.${k}`] = v;
    await adminDb.collection(col).doc(id).update(update);
  } catch (e) {
    console.error("[setInstallment] xato:", e);
  }
}

const PAYMENTS = "payments";

export type PaymentKind = "advance" | "final" | "full" | "transfer" | "update" | "renewal" | "push_certificate" | "update_package" | "custom" | "recurring";

const PAYMENT_KIND_LABEL: Record<PaymentKind, string> = {
  advance: "Avans",
  final: "Yakuniy",
  full: "To'liq to'lov",
  transfer: "Transfer",
  update: "Update",
  renewal: "Obuna uzaytirish",
  push_certificate: "Push sertifikat",
  update_package: "Update paketi",
  custom: "Qo'shimcha to'lov",
  recurring: "Davriy to'lov",
};

export interface CreatePaymentInput {
  appId: string;
  requestId?: string | null; // request to'lovi bo'lsa
  ownerUid: string;
  ownerName: string;
  ownerPhone: string;
  serviceType: ServiceType;
  appName: string | null;
  kind: PaymentKind;
  amountUsd: number; // to'langan summa ($)
  rate: number | null; // to'lov paytidagi kurs
  amountUzs: number | null; // so'mdagi summa
  totalUsd: number; // xizmatning to'liq narxi ($)
  advancePercent: number; // avans foizi
  taxPhone?: string | null; // soliq cheki uchun telefon (yakuniy/to'liq to'lovda)
  discountId?: string | null; // qo'llangan chegirma id
  discountPercent?: number; // qo'llangan chegirma foizi
  packageDays?: number; // update paketi: muddat (kun)
  packageQuota?: number; // update paketi: update soni
}

export async function createPayment(input: CreatePaymentInput): Promise<string> {
  const ref = adminDb.collection(PAYMENTS).doc();

  // Hamyon: mavjud balansdan band qilamiz (mijoz kamroq o'tkazadi).
  const requiredUzs = input.amountUzs ?? 0;
  let walletAppliedUzs = 0;
  if (requiredUzs > 0) {
    const bal = await getUserWalletUzs(input.ownerUid);
    walletAppliedUzs = Math.min(bal, requiredUzs);
    if (walletAppliedUzs > 0) await adjustWallet(input.ownerUid, -walletAppliedUzs);
  }
  const netDueUzs = requiredUzs - walletAppliedUzs;

  await ref.set({
    ...input,
    requestId: input.requestId ?? null,
    taxPhone: input.taxPhone ?? null,
    discountId: input.discountId ?? null,
    discountPercent: input.discountPercent ?? 0,
    requiredUzs,
    walletAppliedUzs,
    netDueUzs,
    actualPaidUzs: null,
    status: "pending",
    createdAt: FieldValue.serverTimestamp(),
    confirmedAt: null,
  });
  // payment obyekti: qism "submitted" holatiga o'tadi
  await setInstallment(input.appId, input.requestId, input.kind, {
    state: "submitted",
    paymentId: ref.id,
    taxPhone: input.taxPhone ?? null,
  });
  await logActivity(
    input.appId,
    "payment_submitted",
    `${PAYMENT_KIND_LABEL[input.kind]} to'lovi uchun kvitansiya yuborildi ($${Math.round(input.amountUsd)})`,
    { type: "user", name: input.ownerName || "Foydalanuvchi", uid: input.ownerUid }
  );
  return ref.id;
}

export interface PaymentView {
  id: string;
  appId: string;
  requestId: string | null;
  ownerUid: string;
  ownerName: string;
  ownerPhone: string;
  serviceType: ServiceType;
  appName: string | null;
  kind: PaymentKind;
  amountUsd: number;
  rate: number | null;
  amountUzs: number | null;
  totalUsd: number;
  advancePercent: number;
  status: "pending" | "confirmed" | "rejected";
  note: string;
  taxPhone: string | null; // mijoz bergan soliq cheki telefoni
  taxReceiptUrl: string | null; // soliqdan berilgan chek havolasi (tasdiqlashda)
  discountPercent: number; // qo'llangan chegirma foizi (0 = yo'q)
  requiredUzs: number | null; // kerakli summa (so'm)
  walletAppliedUzs: number; // shu to'lovda hamyondan ishlatilgan (so'm)
  netDueUzs: number | null; // mijoz o'tkazishi kerak bo'lgan (so'm)
  actualPaidUzs: number | null; // admin kiritgan — mijoz aslida to'lagan (so'm)
  batchId: string | null; // "hammasini birga to'lash" orqali yuborilgan bo'lsa — guruh id
  createdAt: string | null;
}

function iso(v: unknown): string | null {
  return v instanceof Timestamp ? v.toDate().toISOString() : null;
}

function mapPayment(d: QueryDocumentSnapshot): PaymentView {
  const x = d.data();
  return {
    id: d.id,
    appId: x.appId,
    requestId: x.requestId ?? null,
    ownerUid: x.ownerUid ?? "",
    ownerName: x.ownerName ?? "",
    ownerPhone: x.ownerPhone ?? "",
    serviceType: x.serviceType,
    appName: x.appName ?? null,
    kind: (x.kind as PaymentKind) ?? "advance",
    amountUsd: x.amountUsd ?? 0,
    rate: typeof x.rate === "number" ? x.rate : null,
    amountUzs: typeof x.amountUzs === "number" ? x.amountUzs : null,
    totalUsd: x.totalUsd ?? 0,
    advancePercent: x.advancePercent ?? 0,
    status: x.status === "confirmed" ? "confirmed" : x.status === "rejected" ? "rejected" : "pending",
    note: x.note ?? "",
    taxPhone: x.taxPhone ?? null,
    taxReceiptUrl: x.taxReceiptUrl ?? null,
    discountPercent: typeof x.discountPercent === "number" ? x.discountPercent : 0,
    requiredUzs: typeof x.requiredUzs === "number" ? x.requiredUzs : (typeof x.amountUzs === "number" ? x.amountUzs : null),
    walletAppliedUzs: typeof x.walletAppliedUzs === "number" ? x.walletAppliedUzs : 0,
    netDueUzs: typeof x.netDueUzs === "number" ? x.netDueUzs : (typeof x.amountUzs === "number" ? x.amountUzs : null),
    actualPaidUzs: typeof x.actualPaidUzs === "number" ? x.actualPaidUzs : null,
    batchId: x.batchId ?? null,
    createdAt: iso(x.createdAt),
  };
}

function sortPayments(items: PaymentView[]): PaymentView[] {
  return items.sort((a, b) => {
    if (a.status !== b.status) return a.status === "pending" ? -1 : 1;
    return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
  });
}

export async function getAllPayments(max = 200): Promise<PaymentView[]> {
  const snap = await adminDb.collection(PAYMENTS).get();
  return sortPayments(snap.docs.map(mapPayment)).slice(0, max);
}

// Bitta ariza uchun to'lovlar.
export async function getAppPayments(appId: string): Promise<PaymentView[]> {
  const snap = await adminDb.collection(PAYMENTS).where("appId", "==", appId).get();
  return sortPayments(snap.docs.map(mapPayment));
}

// Bitta foydalanuvchi uchun to'lovlar.
export async function getUserPayments(ownerUid: string): Promise<PaymentView[]> {
  const snap = await adminDb.collection(PAYMENTS).where("ownerUid", "==", ownerUid).get();
  return sortPayments(snap.docs.map(mapPayment));
}

export async function setPaymentNote(paymentId: string, note: string): Promise<void> {
  await adminDb.collection(PAYMENTS).doc(paymentId).update({ note: note.slice(0, 1000) });
}

// "Hammasini birga to'lash" orqali yaratilgan to'lovni guruhga biriktiradi —
// har bir a'zo to'lov o'zining guruh izohini (jami summa) ko'rsatadi.
export async function attachPaymentBatch(paymentId: string, batchId: string, note: string): Promise<void> {
  await adminDb.collection(PAYMENTS).doc(paymentId).update({ batchId, note: note.slice(0, 1000) });
}

// Guruhga tegishli barcha to'lovlar.
export async function getPaymentsByBatch(batchId: string): Promise<PaymentView[]> {
  const snap = await adminDb.collection(PAYMENTS).where("batchId", "==", batchId).get();
  return sortPayments(snap.docs.map(mapPayment));
}

export async function deletePayment(paymentId: string): Promise<void> {
  const ref = adminDb.collection(PAYMENTS).doc(paymentId);
  const snap = await ref.get();
  if (snap.exists) {
    const p = snap.data()!;
    // Tasdiqlanmagan to'lov o'chirilsa — band qilingan hamyon pulini qaytaramiz
    if (p.status !== "confirmed") {
      const applied = typeof p.walletAppliedUzs === "number" ? p.walletAppliedUzs : 0;
      if (applied > 0) await adjustWallet(p.ownerUid as string, applied);
    }
  }
  await ref.delete();
}

// To'lovni tasdiqlash: ariza statusini keyingi bosqichga o'tkazadi.
// taxReceiptUrl — soliqdan berilgan chek havolasi (yakuniy/to'liq to'lovda).
export async function confirmPayment(paymentId: string, taxReceiptUrl?: string, actor?: Actor, actualPaidUzs?: number): Promise<void> {
  const ref = adminDb.collection(PAYMENTS).doc(paymentId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("To'lov topilmadi");
  const p = snap.data()!;
  if (p.status === "confirmed") return;

  const requestId = p.requestId as string | null | undefined;
  const advanceStatusStep = async (appId: string) => {
    const appSnap = await adminDb.collection("apps").doc(appId).get();
    if (!appSnap.exists) return;
    const def = serviceDefOf(appSnap);
    const st = appSnap.get("status") as AppStatus;
    const flow = statusFlowFor(def);
    const idx = flow.indexOf(st);
    const work = workStartFor(def);
    const workIdx = flow.indexOf(work);
    if (idx >= 0 && workIdx >= 0 && idx < workIdx) await setAppStatus(appId, work);
    // Avans to'langach boshlanadigan davriy to'lov rejasi
    await startRecurring(appId, "on_advance_paid");
  };

  if (requestId) {
    // Request to'lovi: so'rovni keyingi bosqichga o'tkazadi
    await confirmRequestPayment(requestId);
  } else if (p.kind === "final") {
    // Yakuniy (qolgan) to'lov tasdiqlandi
    await setFinalPaid(p.appId as string);
  } else if (p.kind === "full") {
    // To'liq to'lov: avans + yakuniy birga — status ilgarilaydi va yakuniy to'landi
    await advanceStatusStep(p.appId as string);
    await setFinalPaid(p.appId as string);
  } else if (p.kind === "update_package") {
    // Update paketi sotib olindi — faollashtiramiz
    await activateUpdatePackage(p.appId as string, {
      days: (p.packageDays as number) ?? 30,
      quota: (p.packageQuota as number) ?? 5,
      priceUsd: (p.amountUsd as number) ?? 0,
      actor,
    });
  } else {
    // Ariza avans to'lovi: ilova statusini keyingi bosqichga
    await advanceStatusStep(p.appId as string);
  }

  // Hamyon: admin kiritgan haqiqiy summadan ortiqcha qismi hamyonga tushadi.
  let overpay = 0;
  if (typeof actualPaidUzs === "number" && actualPaidUzs > 0) {
    const netDue = typeof p.netDueUzs === "number" ? p.netDueUzs : (typeof p.amountUzs === "number" ? p.amountUzs : 0);
    overpay = Math.round(actualPaidUzs - netDue);
    if (overpay > 0) await adjustWallet(p.ownerUid as string, overpay);
  }

  await ref.update({
    status: "confirmed",
    confirmedAt: FieldValue.serverTimestamp(),
    ...(taxReceiptUrl ? { taxReceiptUrl } : {}),
    ...(typeof actualPaidUzs === "number" ? { actualPaidUzs: Math.round(actualPaidUzs) } : {}),
  });

  // payment obyekti: qism "confirmed"
  await setInstallment(p.appId as string, p.requestId as string | null, p.kind as string, {
    state: "confirmed",
    ...(taxReceiptUrl ? { taxReceiptUrl } : {}),
  });

  if (actor) {
    const kind = (p.kind as PaymentKind) ?? "advance";
    await logActivity(
      p.appId as string,
      "payment_confirmed",
      `${PAYMENT_KIND_LABEL[kind]} to'lovi tasdiqlandi ($${Math.round((p.amountUsd as number) ?? 0)})`,
      actor
    );
  }

  // Foydalanuvchiga xabar
  {
    const kind = (p.kind as PaymentKind) ?? "advance";
    const name = (p.appName as string) || SERVICE_LABELS[p.serviceType as ServiceType];
    const amt = Math.round((p.amountUsd as number) ?? 0);
    let head = "";
    let extra = "";
    if (kind === "update_package") {
      // paket faollashuvi alohida to'liq xabar beradi — bu yerda takrorlamaymiz
    } else if (kind === "final" || kind === "full") {
      head = "✅ To'lovingiz to'liq yakunlandi, rahmat 🙌";
    } else if (kind === "advance") {
      head = "✅ Avansingiz qabul bo'ldi — ishga kirishdik 🚀";
      const pricing = await getPricing();
      const finalAmt = Math.round(finalUsd(p.serviceType as ServiceType, pricing));
      if (finalAmt > 0) extra = `\n\n💳 Qolgan to'lov: $${finalAmt} — ilova store'ga chiqqach yakunlanadi`;
    } else {
      head = "✅ To'lovingiz qabul bo'ldi, rahmat 🙌";
    }
    if (head) {
      let msg = `${head}\n\n📱 ${esc(name)}\n💳 ${esc(PAYMENT_KIND_LABEL[kind])} · $${esc(String(amt))}`;
      if (taxReceiptUrl) msg += `\n🧾 Soliq cheki: [ochish](${taxReceiptUrl})`;
      if (overpay > 0) msg += `\n🪙 Hisobingizga ${esc(overpay.toLocaleString("en-US"))} so'm qaytib tushdi`;
      msg += extra + appLink(p.appId as string);
      await notifyUser(p.ownerUid as string, msg);
    }
  }

  // Chegirma yakuniy/to'liq to'lov tasdiqlanganda ishlatilgan deb belgilanadi
  const discountId = p.discountId as string | null | undefined;
  const completing = p.kind === "final" || (p.advancePercent ?? 0) >= 100;
  if (discountId && completing) {
    try {
      await markDiscountUsed(discountId);
    } catch (e) {
      console.error("[confirmPayment] markDiscountUsed xato:", e);
    }
  }
}

// So'rov uchun kutilayotgan (pending) to'lov yozuvi id'si (bo'lsa).
export async function getPendingPaymentIdByRequest(requestId: string): Promise<string | null> {
  const snap = await adminDb
    .collection(PAYMENTS)
    .where("requestId", "==", requestId)
    .where("status", "==", "pending")
    .get();
  if (snap.empty) return null;
  return snap.docs[0].id;
}

// To'lovni rad etish: faqat to'lov yozuvi rad etiladi, ariza/so'rov statusi
// o'zgarmaydi. Chek belgisi tozalanadi — mijoz qayta yuborishi mumkin.
export async function rejectPayment(paymentId: string, actor?: Actor): Promise<void> {
  const ref = adminDb.collection(PAYMENTS).doc(paymentId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("To'lov topilmadi");
  const p = snap.data()!;
  if (p.status === "confirmed") return; // tasdiqlangan to'lovni rad etib bo'lmaydi

  await ref.update({ status: "rejected", rejectedAt: FieldValue.serverTimestamp() });

  const requestId = p.requestId as string | null | undefined;
  if (requestId) {
    await adminDb.collection("requests").doc(requestId).update({ receiptSent: false });
  } else if (p.kind === "final") {
    await adminDb.collection("apps").doc(p.appId as string).update({ finalReceiptSent: false });
  } else if (p.kind === "full") {
    await adminDb.collection("apps").doc(p.appId as string).update({ receiptSent: false, finalReceiptSent: false });
  } else {
    await adminDb.collection("apps").doc(p.appId as string).update({ receiptSent: false });
  }

  // Hamyon: band qilingan summani qaytaramiz (mijoz qayta yuborishi mumkin)
  const applied = typeof p.walletAppliedUzs === "number" ? p.walletAppliedUzs : 0;
  if (applied > 0) await adjustWallet(p.ownerUid as string, applied);

  // payment obyekti: qism "rejected" (mijoz qayta yubora oladi)
  await setInstallment(p.appId as string, requestId, p.kind as string, { state: "rejected" });

  if (actor) {
    const kind = (p.kind as PaymentKind) ?? "advance";
    await logActivity(p.appId as string, "payment_rejected", `${PAYMENT_KIND_LABEL[kind]} to'lovi rad etildi`, actor);
  }

  // Foydalanuvchiga xabar
  {
    const name = (p.appName as string) || SERVICE_LABELS[p.serviceType as ServiceType];
    const kindLabel = PAYMENT_KIND_LABEL[(p.kind as PaymentKind) ?? "advance"];
    await notifyUser(
      p.ownerUid as string,
      `❌ To'lovda kichik muammo chiqdi\n\n📱 ${esc(name)}\n💳 ${esc(kindLabel)}\n\nChekni bir tekshirib, qaytadan yuboborasizmi? Rahmat 🙏${appLink(p.appId as string)}`
    );
  }
}

// So'rov rad etilganda uning to'lovlarini teskari qaytaradi (kompensatsiya bilan).
// keptUsd — shartlarga ko'ra ushlab qolinadigan summa ($). Qolgani mijoz hamyoniga qaytadi.
// Ushlangan qism tasdiqlangan holicha qoladi (statistikada faqat o'sha sanaladi), qolgani rad etiladi.
export async function voidRequestPayments(
  requestId: string,
  keptUsd: number,
  actor?: Actor,
  refundToWallet: boolean = true
): Promise<{ refundedUzs: number; keptUsd: number }> {
  const snap = await adminDb.collection(PAYMENTS).where("requestId", "==", requestId).get();
  let refunded = 0;
  let keptRemaining = Math.max(0, Math.round(keptUsd));
  let keptTotal = 0;

  for (const doc of snap.docs) {
    const p = doc.data();
    if (p.status === "rejected") continue;

    if (p.status === "pending") {
      // Yuborilgan lekin tasdiqlanmagan — band qilingan hamyon summasini qaytaramiz
      const applied = typeof p.walletAppliedUzs === "number" ? p.walletAppliedUzs : 0;
      if (applied > 0) { await adjustWallet(p.ownerUid as string, applied); refunded += applied; }
      await doc.ref.update({ status: "rejected", rejectedAt: FieldValue.serverTimestamp() });
      continue;
    }

    // Tasdiqlangan to'lov — kompensatsiyani ushlab qolamiz, qolganini qaytaramiz
    const origUsd = typeof p.amountUsd === "number" ? p.amountUsd : 0;
    const origUzs = typeof p.amountUzs === "number" ? p.amountUzs : 0;
    const rate = origUsd > 0 && origUzs > 0 ? origUzs / origUsd : 0;
    const kept = Math.min(keptRemaining, origUsd);
    keptRemaining -= kept;
    keptTotal += kept;
    const keptUzs = rate ? Math.round(kept * rate) : 0;
    const refundUzs = Math.max(0, origUzs - keptUzs);

    if (kept <= 0) {
      await doc.ref.update({
        status: "rejected",
        rejectedAt: FieldValue.serverTimestamp(),
        compensated: true,
        originalAmountUsd: origUsd,
        originalAmountUzs: origUzs,
        amountUsd: 0,
        amountUzs: 0,
      });
    } else {
      // Confirmed holicha qoladi, ammo summa ushlangan qismgacha kamaytiriladi (stats to'g'ri bo'lishi uchun)
      await doc.ref.update({
        compensated: true,
        originalAmountUsd: origUsd,
        originalAmountUzs: origUzs,
        amountUsd: kept,
        amountUzs: keptUzs,
      });
    }
    if (refundUzs > 0) {
      if (refundToWallet) await adjustWallet(p.ownerUid as string, refundUzs);
      refunded += refundUzs;
    }
    if (actor) {
      const dest = refundToWallet ? "hamyonga" : "kartaga";
      await logActivity(
        p.appId as string,
        "payment_rejected",
        `So'rov rad etildi — kompensatsiya $${kept} ushlandi, ${refundUzs.toLocaleString("en-US")} so'm ${dest} qaytarildi`,
        actor
      );
    }
  }

  return { refundedUzs: refunded, keptUsd: keptTotal };
}

// Ilova arizasi rad etilganda uning to'lovlarini (avans/yakuniy/to'liq) teskari qaytaradi.
// voidRequestPayments bilan bir xil mantiq — faqat ilova to'lovlari (requestId == null).
export async function voidAppPayments(
  appId: string,
  keptUsd: number,
  actor?: Actor,
  refundToWallet: boolean = true
): Promise<{ refundedUzs: number; keptUsd: number }> {
  const snap = await adminDb.collection(PAYMENTS).where("appId", "==", appId).where("requestId", "==", null).get();
  let refunded = 0;
  let keptRemaining = Math.max(0, Math.round(keptUsd));
  let keptTotal = 0;

  for (const doc of snap.docs) {
    const p = doc.data();
    if (p.status === "rejected") continue;

    if (p.status === "pending") {
      const applied = typeof p.walletAppliedUzs === "number" ? p.walletAppliedUzs : 0;
      if (applied > 0) { await adjustWallet(p.ownerUid as string, applied); refunded += applied; }
      await doc.ref.update({ status: "rejected", rejectedAt: FieldValue.serverTimestamp() });
      continue;
    }

    const origUsd = typeof p.amountUsd === "number" ? p.amountUsd : 0;
    const origUzs = typeof p.amountUzs === "number" ? p.amountUzs : 0;
    const rate = origUsd > 0 && origUzs > 0 ? origUzs / origUsd : 0;
    const kept = Math.min(keptRemaining, origUsd);
    keptRemaining -= kept;
    keptTotal += kept;
    const keptUzs = rate ? Math.round(kept * rate) : 0;
    const refundUzs = Math.max(0, origUzs - keptUzs);

    if (kept <= 0) {
      await doc.ref.update({
        status: "rejected",
        rejectedAt: FieldValue.serverTimestamp(),
        compensated: true,
        originalAmountUsd: origUsd,
        originalAmountUzs: origUzs,
        amountUsd: 0,
        amountUzs: 0,
      });
    } else {
      await doc.ref.update({
        compensated: true,
        originalAmountUsd: origUsd,
        originalAmountUzs: origUzs,
        amountUsd: kept,
        amountUzs: keptUzs,
      });
    }
    if (refundUzs > 0) {
      if (refundToWallet) await adjustWallet(p.ownerUid as string, refundUzs);
      refunded += refundUzs;
    }
    if (actor) {
      const dest = refundToWallet ? "hamyonga" : "kartaga";
      await logActivity(
        appId,
        "payment_rejected",
        `Ariza rad etildi — kompensatsiya $${kept} ushlandi, ${refundUzs.toLocaleString("en-US")} so'm ${dest} qaytarildi`,
        actor
      );
    }
  }

  return { refundedUzs: refunded, keptUsd: keptTotal };
}
