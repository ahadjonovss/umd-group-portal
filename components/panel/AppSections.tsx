import Link from "next/link";
import type { AppView } from "@/lib/firestore/apps";
import type { RequestView } from "@/lib/firestore/requests";
import { getStatusFlow, isTerminalError, isTerminalSuccess } from "@/lib/app-status";
import { isRequestTerminalError, requestStatusLabel, REQUEST_STATUS_META, REQUEST_TYPE_LABEL, REQUEST_FLOW } from "@/lib/request-status";
import { STATUS_META, formatDate, platformOf } from "@/lib/labels";
import { PaymentView } from "@/components/panel/PaymentView";
import { requestAwaitingPayment } from "@/lib/panel-status";

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
}: {
  app: AppView;
  req: RequestView | null;
  cardNumber: string;
  cardHolder: string;
  paymentDone: boolean;
}) {
  // Faqat chiqarilgan + obunasi boshlangan + qolgan to'lovi yakunlangan ilovada
  if (app.status !== "published" || !app.subscription?.startDate || !paymentDone) return null;

  const active = req ? !isRequestTerminalError(req.status) && req.status !== "completed" : false;

  // Faol so'rov yo'q — (qayta) uzaytirish mumkin
  if (!req || !active) {
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
  const idx = REQUEST_FLOW.indexOf(req.status);
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
          {REQUEST_FLOW.map((s, i) => (
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
}: {
  app: AppView;
  req: RequestView | null;
  cardNumber: string;
  cardHolder: string;
  paymentDone: boolean;
}) {
  if (platformOf(app.serviceType) !== "ios" || !isTerminalSuccess(app.status) || !paymentDone) return null;

  const active = req ? !isRequestTerminalError(req.status) && req.status !== "completed" : false;

  if (!req || !active) {
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
  const idx = REQUEST_FLOW.indexOf(req.status);
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
          {REQUEST_FLOW.map((s, i) => (
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
}: {
  app: AppView;
  req: RequestView | null;
  cardNumber: string;
  cardHolder: string;
  paymentDone: boolean;
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
  const idx = REQUEST_FLOW.indexOf(req.status);
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
          {REQUEST_FLOW.map((s, i) => (
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
}: {
  app: AppView;
  req: RequestView | null;
  cardNumber: string;
  cardHolder: string;
  paymentDone: boolean;
}) {
  if (app.status !== "published" || !paymentDone) return null;

  const active = req ? !isRequestTerminalError(req.status) && req.status !== "completed" : false;

  // Faol so'rov yo'q — (qayta) update so'rovi mumkin
  if (!req || !active) {
    return (
      <Link
        href={`/panel/request/update/${app.id}`}
        className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:scale-[0.99] transition-all"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
        Update chiqarish
      </Link>
    );
  }

  const meta = REQUEST_STATUS_META[req.status];
  const idx = REQUEST_FLOW.indexOf(req.status);
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
          {REQUEST_FLOW.map((s, i) => (
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
