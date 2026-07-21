"use client";

import { useTransition } from "react";
import type { AdminReview } from "@/lib/firestore/reviews";
import { SERVICE_SHORT, formatDate } from "@/lib/labels";
import { actSetReviewApproved, actDeleteReview } from "@/app/admin/actions";

const IS_DEV = process.env.NODE_ENV === "development";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} className={`w-3.5 h-3.5 ${s <= rating ? "text-amber-400" : "text-slate-200"}`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </span>
  );
}

export function AdminReviewRow({ review }: { review: AdminReview }) {
  const [pending, start] = useTransition();

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 truncate">{review.name}</p>
          <p className="text-xs text-slate-400">{formatDate(review.date)}</p>
        </div>
        <span
          className={`px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 flex-shrink-0 ${
            review.approved
              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
              : "bg-amber-50 text-amber-700 ring-amber-200"
          }`}
        >
          {review.approved ? "Saytda" : "Kutilmoqda"}
        </span>
      </div>

      <Stars rating={review.rating} />
      <p className="text-sm text-slate-700 leading-relaxed">{review.comment}</p>

      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
        {review.serviceType && <span>{SERVICE_SHORT[review.serviceType]}</span>}
        {review.appName && <span>· {review.appName}</span>}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          disabled={pending}
          onClick={() => start(() => actSetReviewApproved(review.id, !review.approved))}
          className={`h-8 px-3 rounded-lg text-xs font-semibold disabled:opacity-50 ${
            review.approved
              ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
              : "bg-emerald-600 text-white hover:bg-emerald-700"
          }`}
        >
          {review.approved ? "Saytdan olib tashlash" : "Tasdiqlash (saytda ko'rsatish)"}
        </button>
        {IS_DEV && (
          <button
            disabled={pending}
            onClick={() => {
              if (confirm("Sharhni butunlay o'chirasizmi?")) start(() => actDeleteReview(review.id));
            }}
            className="h-8 px-3 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 disabled:opacity-50"
          >
            O&apos;chirish
          </button>
        )}
      </div>
    </div>
  );
}
