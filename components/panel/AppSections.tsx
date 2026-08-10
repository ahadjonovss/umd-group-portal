import Link from "next/link";
import type { AppView } from "@/lib/firestore/apps";
import type { RequestView } from "@/lib/firestore/requests";
import { getStatusFlow, isTerminalError, isTerminalSuccess } from "@/lib/app-status";
import { isRequestTerminalError, requestStatusLabel, REQUEST_STATUS_META, REQUEST_TYPE_LABEL, requestFlow } from "@/lib/request-status";
import { STATUS_META, formatDate, platformOf } from "@/lib/labels";
import { PaymentView } from "@/components/panel/PaymentView";
import { requestAwaitingPayment } from "@/lib/panel-status";
import { pkgActive, pkgDaysLeft, getInstallment, isPayable, type PayState } from "@/lib/payment-state";

export function ClockIcon() {
  return (
    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export function RenewalSection({
  app,
  req,
  cardNumber,
  cardHolder,
  paymentDone,
  walletUzs = 0,
}: {
  app: AppView;
  req: RequestView | null;
  cardNumber: string;
  cardHolder: string;
  paymentDone: boolean;
  walletUzs?: number;
}) {
  // Faqat chiqarilgan + obunasi boshlangan + qolgan to'lovi yakunlangan ilovada
  if (app.status !== "published" || !app.subscription?.startDate || !paymentDone) return null;

  const active = req ? !isRequestTerminalError(req.status) && req.status !== "completed" : false;

  // Faol so'rov yo'q — (qayta) uzaytirish mumkin
  if (!req || (!active && !requestAwaitingPayment(req))) {
    return (
      <Link
        href={`/panel/request/renewal/${app.id}`}
        className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 active:scale-[0.99] transition-all"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Obunani uzaytirish (+9 oy)
      </Link>
    );
  }

  const meta = REQUEST_STATUS_META[req.status];
  const flow = requestFlow(req.type);
  const idx = flow.indexOf(req.status);
  return (
    <div className="rounded-xl bg-slate-50 ring-1 ring-slate-100 p-3.5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">Obunani uzaytirish (+9 oy)</span>
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 ${meta.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
          {requestStatusLabel(req.type, req.status)}
        </span>
      </div>
      {idx >= 0 && (
        <div className="flex gap-1">
          {flow.map((s, i) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= idx ? meta.dot : "bg-slate-200"}`} />
          ))}
        </div>
      )}
      {requestAwaitingPayment(req) && (
        <PaymentView
          endpoint="/api/requests/receipt"
          idPayload={{ requestId: req.id }}
          usd={req.amountUsd}
          rate={req.rate}
          uzs={req.amountUzs}
          cardNumber={cardNumber}
          cardHolder={cardHolder}
          walletUzs={walletUzs}
          amountLabel={`${REQUEST_TYPE_LABEL[req.type]} to'lovi`}
          receiptSent={req.receiptSent}
          askTaxPhone
        />
      )}
      {req.status === "in_progress" && req.receiptSent && (
        <p className="text-xs text-slate-500 leading-snug">
          To&apos;lov tasdiqlandi. Obuna muddati tez orada uzaytiriladi.
        </p>
      )}
    </div>
  );
}

// Apple push notification sertifikati — faqat Apple (iOS) ilovalarda.
export function PushCertSection({
  app,
  req,
  cardNumber,
  cardHolder,
  paymentDone,
  walletUzs = 0,
}: {
  app: AppView;
  req: RequestView | null;
  cardNumber: string;
  cardHolder: string;
  paymentDone: boolean;
  walletUzs?: number;
}) {
  if (platformOf(app.serviceType) !== "ios" || !isTerminalSuccess(app.status) || !paymentDone) return null;

  const active = req ? !isRequestTerminalError(req.status) && req.status !== "completed" : false;

  if (!req || (!active && !requestAwaitingPayment(req))) {
    return (
      <Link
        href={`/panel/request/push-certificate/${app.id}`}
        className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 active:scale-[0.99] transition-all"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        Push sertifikat olish
      </Link>
    );
  }

  const meta = REQUEST_STATUS_META[req.status];
  const flow = requestFlow(req.type);
  const idx = flow.indexOf(req.status);
  return (
    <div className="rounded-xl bg-slate-50 ring-1 ring-slate-100 p-3.5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">Push sertifikat</span>
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 ${meta.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
          {requestStatusLabel(req.type, req.status)}
        </span>
      </div>
      {idx >= 0 && (
        <div className="flex gap-1">
          {flow.map((s, i) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= idx ? meta.dot : "bg-slate-200"}`} />
          ))}
        </div>
      )}
      {requestAwaitingPayment(req) && (
        <PaymentView
          endpoint="/api/requests/receipt"
          idPayload={{ requestId: req.id }}
          usd={req.amountUsd}
          rate={req.rate}
          uzs={req.amountUzs}
          cardNumber={cardNumber}
          cardHolder={cardHolder}
          walletUzs={walletUzs}
          amountLabel={`${REQUEST_TYPE_LABEL[req.type]} to'lovi`}
          receiptSent={req.receiptSent}
          askTaxPhone
        />
      )}
      {req.status === "in_progress" && req.receiptSent && (
        <p className="text-xs text-slate-500 leading-snug">
          To&apos;lov tasdiqlandi. Sertifikat tayyorlanib, Telegram orqali yuboriladi.
        </p>
      )}
    </div>
  );
}

export function StatusProgress({ app }: { app: AppView }) {
  if (isTerminalError(app.status)) {
    const meta = STATUS_META[app.status];
    return (
      <div className="flex items-center gap-2 rounded-lg bg-red-50 ring-1 ring-red-100 px-2.5 py-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
        <span className="text-xs font-medium text-red-600">
          {app.status === "rejected" ? "Ariza rad etildi" : "Ariza bekor qilindi"}
        </span>
      </div>
    );
  }

  const flow = getStatusFlow(app.serviceType);
  const currentIndex = flow.indexOf(app.status);
  const meta = STATUS_META[app.status];

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-medium text-slate-500">
          Bosqich {Math.max(currentIndex + 1, 1)}/{flow.length}
        </span>
        <span className={`text-[11px] font-semibold ${meta.text}`}>{meta.label}</span>
      </div>
      <div className="flex gap-1">
        {flow.map((s, i) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= currentIndex ? meta.dot : "bg-slate-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

type SubData = NonNullable<AppView["subscription"]>;

// Ilova chiqarilgandan keyin: bosqich bari o'rnida obuna muddati foizda.
export function SubscriptionProgress({ sub }: { sub: SubData }) {
  const start = sub.startDate ? new Date(sub.startDate).getTime() : 0;
  const end = sub.endDate ? new Date(sub.endDate).getTime() : 0;
  const now = Date.now();

  const total = Math.max(end - start, 1);
  const remainingMs = end - now;
  const dLeft = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
  const expired = remainingMs <= 0;
  const pctLeft = Math.max(0, Math.min(100, Math.round((remainingMs / total) * 100)));
  const low = !expired && dLeft <= 30;

  const barColor = expired ? "bg-red-500" : low ? "bg-amber-500" : "bg-emerald-500";
  const textColor = expired ? "text-red-600" : low ? "text-amber-600" : "text-emerald-600";

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
          <ClockIcon />
          Obuna muddati
        </span>
        <span className={`text-[11px] font-semibold ${textColor}`}>
          {expired ? "Muddati tugagan" : `${pctLeft}% · ${dLeft} kun qoldi`}
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-500`}
          style={{ width: `${expired ? 100 : pctLeft}%` }}
        />
      </div>
      <p className="text-[11px] text-slate-400 mt-1">
        {formatDate(sub.startDate)} → {formatDate(sub.endDate)}
        {sub.renewedCount > 0 ? ` · ${sub.renewedCount}× uzaytirilgan` : ""}
      </p>
    </div>
  );
}

export function TransferSection({
  app,
  req,
  cardNumber,
  cardHolder,
  paymentDone,
  walletUzs = 0,
}: {
  app: AppView;
  req: RequestView | null;
  cardNumber: string;
  cardHolder: string;
  paymentDone: boolean;
  walletUzs?: number;
}) {
  if (app.status !== "published") return null;
  // Qolgan to'lov yakunlanmaguncha transfer so'rovi ochilmaydi
  // (faol/yakunlangan so'rov bo'lsa holatini ko'rsatishda davom etamiz).
  if (!paymentDone && (!req || isRequestTerminalError(req.status))) return null;

  // Transfer yakunlangan — jarayon tugadi
  if (req && req.status === "completed") {
    return (
      <div className="inline-flex items-center gap-1.5 self-start rounded-lg bg-emerald-50 ring-1 ring-emerald-200 px-2.5 py-1.5 text-xs font-medium text-emerald-700">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
        Transfer yakunlandi
      </div>
    );
  }

  // So'rov yo'q yoki rad etilgan/bekor qilingan — (qayta) so'rov qilish mumkin
  if (!req || isRequestTerminalError(req.status)) {
    return (
      <Link
        href={`/panel/request/transfer/${app.id}`}
        className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 active:scale-[0.99] transition-all"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Transferga so&apos;rov yuborish
      </Link>
    );
  }

  const meta = REQUEST_STATUS_META[req.status];
  const flow = requestFlow(req.type);
  const idx = flow.indexOf(req.status);
  return (
    <div className="rounded-xl bg-slate-50 ring-1 ring-slate-100 p-3.5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">Transfer so&apos;rovi</span>
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 ${meta.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
          {requestStatusLabel(req.type, req.status)}
        </span>
      </div>
      {idx >= 0 && (
        <div className="flex gap-1">
          {flow.map((s, i) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= idx ? meta.dot : "bg-slate-200"}`} />
          ))}
        </div>
      )}
      {requestAwaitingPayment(req) && (
        <PaymentView
          endpoint="/api/requests/receipt"
          idPayload={{ requestId: req.id }}
          usd={req.amountUsd}
          rate={req.rate}
          uzs={req.amountUzs}
          cardNumber={cardNumber}
          cardHolder={cardHolder}
          walletUzs={walletUzs}
          amountLabel={`${REQUEST_TYPE_LABEL[req.type]} to'lovi`}
          receiptSent={req.receiptSent}
          askTaxPhone
        />
      )}
    </div>
  );
}

export function UpdateSection({
  app,
  req,
  cardNumber,
  cardHolder,
  paymentDone,
  walletUzs = 0,
}: {
  app: AppView;
  req: RequestView | null;
  cardNumber: string;
  cardHolder: string;
  paymentDone: boolean;
  walletUzs?: number;
}) {
  if (app.status !== "published" || !paymentDone) return null;

  const active = req ? !isRequestTerminalError(req.status) && req.status !== "completed" : false;

  const freeByPackage = pkgActive(app.updatePackage);

  // Faol so'rov yo'q — (qayta) update so'rovi mumkin
  if (!req || (!active && !requestAwaitingPayment(req))) {
    return (
      <Link
        href={`/panel/request/update/${app.id}`}
        className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:scale-[0.99] transition-all"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
        {freeByPackage ? "Update chiqarish (paketdan, bepul)" : "Update chiqarish"}
      </Link>
    );
  }

  const meta = REQUEST_STATUS_META[req.status];
  const flow = requestFlow(req.type);
  const idx = flow.indexOf(req.status);
  return (
    <div className="rounded-xl bg-slate-50 ring-1 ring-slate-100 p-3.5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">Update so&apos;rovi</span>
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 ${meta.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
          {requestStatusLabel(req.type, req.status)}
        </span>
      </div>
      {idx >= 0 && (
        <div className="flex gap-1">
          {flow.map((s, i) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= idx ? meta.dot : "bg-slate-200"}`} />
          ))}
        </div>
      )}
      {requestAwaitingPayment(req) && (
        <PaymentView
          endpoint="/api/requests/receipt"
          idPayload={{ requestId: req.id }}
          usd={req.amountUsd}
          rate={req.rate}
          uzs={req.amountUzs}
          cardNumber={cardNumber}
          cardHolder={cardHolder}
          walletUzs={walletUzs}
          amountLabel={`${REQUEST_TYPE_LABEL[req.type]} to'lovi`}
          receiptSent={req.receiptSent}
          askTaxPhone
        />
      )}
      {req.status === "in_progress" && req.receiptSent && (
        <div className="rounded-lg bg-white ring-1 ring-slate-100 p-3 text-xs text-slate-600 leading-snug">
          {app.serviceType === "app-store" ? (
            <>Yangi kodni <strong>GitHub</strong> repozitoriyangizga <strong>push</strong> qiling — jamoamiz App Store&apos;ga yuklaydi.</>
          ) : (
            <>Yangi <strong>.aab</strong> faylni Telegram <strong>@umdgroupadmin</strong> ga yuboring.</>
          )}
        </div>
      )}
    </div>
  );
}

// Update paketi — 1 oylik / N ta update. Faol bo'lsa updatelar bepul.
export function UpdatePackageSection({
  app,
  cardNumber,
  cardHolder,
  paymentDone,
  walletUzs = 0,
  priceUsd,
  quota,
  rate,
  purchasePending = false,
}: {
  app: AppView;
  cardNumber: string;
  cardHolder: string;
  paymentDone: boolean;
  walletUzs?: number;
  priceUsd: number;
  quota: number;
  rate: number | null;
  purchasePending?: boolean;
}) {
  if (!paymentDone || isTerminalError(app.status)) return null;

  const pkg = app.updatePackage;
  const active = pkgActive(pkg);
  const daysLeft = pkgDaysLeft(pkg);
  const uzs = rate ? Math.round(priceUsd * rate) : null;

  // Faol paket — holat kartasi (updatelar bepul)
  if (active && pkg) {
    const pct = pkg.quota > 0 ? Math.round((pkg.used / pkg.quota) * 100) : 0;
    return (
      <div className="rounded-xl bg-cyan-50 ring-1 ring-cyan-100 p-3.5 flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-800">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Update paketi faol
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-white text-cyan-700 ring-1 ring-cyan-200">
            <ClockIcon />
            {daysLeft} kun qoldi
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-cyan-700/90">
          <span>Ishlatilgan updatelar</span>
          <span className="font-semibold">{pkg.used} / {pkg.quota}</span>
        </div>
        <div className="h-1.5 rounded-full bg-cyan-100 overflow-hidden">
          <div className="h-full rounded-full bg-cyan-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-[11px] text-cyan-700/80 leading-snug">
          Paket amal qilar ekan, updatelar bepul chiqariladi. Kvota yoki muddat tugasa — yangi paket olishingiz mumkin.
        </p>
      </div>
    );
  }

  // Paket yo'q yoki tugagan — sotib olish
  const expired = Boolean(pkg && pkg.active); // bor edi, lekin kvota/muddat tugadi
  return (
    <details className="rounded-xl bg-slate-50 ring-1 ring-slate-100 overflow-hidden">
      <summary className="flex items-center justify-between gap-2 p-3.5 cursor-pointer list-none select-none">
        <span className="flex flex-col">
          <span className="text-sm font-semibold text-slate-700">
            {expired ? "Update paketi tugadi — yangilash" : "Update paketi"}
          </span>
          <span className="text-xs text-slate-500">1 oy · {quota} ta update bepul</span>
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-600 text-white text-xs font-semibold">
          ${priceUsd}
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </summary>
      <div className="px-3.5 pb-3.5 border-t border-slate-100 pt-3 flex flex-col gap-3">
        <p className="text-xs text-slate-500 leading-snug">
          Paket faollashgach, <strong>1 oy</strong> davomida <strong>{quota} tagacha</strong> update
          qo&apos;shimcha to&apos;lovsiz chiqariladi. Har bir alohida update {app.serviceType === "app-store" ? "$5" : "$3"} bo&apos;ladi.
        </p>
        <PaymentView
          endpoint="/api/payment/receipt"
          idPayload={{ appId: app.id, kind: "update_package" }}
          usd={priceUsd}
          rate={rate}
          uzs={uzs}
          cardNumber={cardNumber}
          cardHolder={cardHolder}
          walletUzs={walletUzs}
          amountLabel="Update paketi"
          receiptSent={purchasePending}
          askTaxPhone
        />
      </div>
    </details>
  );
}

const CUSTOM_INVOICE_BADGE: Record<PayState, { text: string; cls: string; dot: string }> = {
  due: { text: "To'lanmagan", cls: "bg-amber-50 text-amber-700 ring-amber-200", dot: "bg-amber-500" },
  rejected: { text: "Rad etilgan — qayta yuboring", cls: "bg-red-50 text-red-700 ring-red-200", dot: "bg-red-500" },
  submitted: { text: "Yuborildi — tekshiruvda", cls: "bg-blue-50 text-blue-700 ring-blue-200", dot: "bg-blue-500" },
  confirmed: { text: "To'langan", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500" },
  locked: { text: "Keyinroq", cls: "bg-slate-100 text-slate-500 ring-slate-200", dot: "bg-slate-400" },
};

// Admin biriktirgan qo'shimcha (custom) hisob-fakturalar — mustaqil to'lov sifatida.
export function CustomInvoiceSection({
  reqs,
  cardNumber,
  cardHolder,
  walletUzs = 0,
}: {
  reqs: RequestView[];
  cardNumber: string;
  cardHolder: string;
  walletUzs?: number;
}) {
  const items = reqs.filter((r) => r.type === "custom");
  if (!items.length) return null;

  return (
    <div className="flex flex-col gap-3">
      {items.map((req) => {
        const full = getInstallment(req.payment, "full");
        const state: PayState = (full?.state as PayState) ?? "due";
        const badge = CUSTOM_INVOICE_BADGE[state] ?? CUSTOM_INVOICE_BADGE.due;
        const title = req.appName || "Qo'shimcha to'lov";
        const payable = isPayable(full);
        return (
          <div key={req.id} className="rounded-xl bg-slate-50 ring-1 ring-slate-100 p-3.5 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{title}</p>
                <p className="text-xs text-slate-500">
                  ${req.amountUsd}
                  {req.amountUzs ? <span className="text-slate-400"> · ~{req.amountUzs.toLocaleString("en-US")} so&apos;m</span> : null}
                </p>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 flex-shrink-0 ${badge.cls}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                {badge.text}
              </span>
            </div>
            {payable && (
              <PaymentView
                endpoint="/api/requests/receipt"
                idPayload={{ requestId: req.id }}
                usd={req.amountUsd}
                rate={req.rate}
                uzs={req.amountUzs}
                cardNumber={cardNumber}
                cardHolder={cardHolder}
                walletUzs={walletUzs}
                amountLabel={title}
                receiptSent={req.receiptSent}
                askTaxPhone
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
