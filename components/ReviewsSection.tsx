"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ReviewModal } from "@/components/ReviewModal";
import type { Review } from "@/app/api/reviews/route";

const REVIEW_TOKEN = process.env.NEXT_PUBLIC_REVIEW_TOKEN;

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          className={`w-3.5 h-3.5 ${s <= rating ? "text-amber-400" : "text-slate-200"}`}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

function formatDate(raw: string) {
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

function ReviewCard({ review }: { review: Review }) {
  const initial = review.name.charAt(0).toUpperCase();
  const colors = ["bg-blue-500","bg-violet-500","bg-emerald-500","bg-orange-500","bg-pink-500"];
  const color = colors[initial.charCodeAt(0) % colors.length];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col gap-3 hover:shadow-lg hover:shadow-slate-100 hover:-translate-y-0.5 transition-all duration-200">
      {/* Author + date */}
      <div className="flex items-center gap-2.5">
        <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
          {initial}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800 leading-tight">{review.name}</p>
          <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{formatDate(review.date)}</p>
        </div>
      </div>

      {/* Stars */}
      <StarDisplay rating={review.rating} />

      {/* Comment */}
      <p className="text-sm text-slate-700 leading-relaxed">
        &ldquo;{review.comment}&rdquo;
      </p>
    </div>
  );
}

interface ReviewsSectionProps {
  initialReviews: Review[];
}

export function ReviewsSection({ initialReviews }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [showModal, setShowModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("review");
    if (REVIEW_TOKEN && token === REVIEW_TOKEN) {
      setCanReview(true);
      setShowModal(true);
      // URL dan tokenni tozalaymiz (ko'rsatmaslik uchun)
      const url = new URL(window.location.href);
      url.searchParams.delete("review");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  async function handleSuccess() {
    setShowModal(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 4000);

    // Yangi sharhlarni yuklash
    try {
      const res = await fetch("/api/reviews");
      if (res.ok) setReviews(await res.json());
    } catch {}
  }

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <>
      {/* Section header */}
      <div className="flex items-center justify-between mb-4 animate-slide-up delay-300">
        <div>
          <h2 className="font-semibold text-slate-900">Mijozlar sharhlari</h2>
          {avg && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span className="text-sm font-bold text-slate-900">{avg}</span>
              <span className="text-xs text-slate-500">({reviews.length} sharh)</span>
            </div>
          )}
        </div>
        {canReview && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 h-9 px-4 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-sm shadow-blue-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            Baho berish
          </button>
        )}
      </div>

      {/* Success toast */}
      {showSuccess && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 flex items-center gap-2 animate-slide-down">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          Rahmat! Sharh muvaffaqiyatli yuborildi.
        </div>
      )}

      {/* Reviews grid */}
      {reviews.length > 0 ? (
        <div className="grid sm:grid-cols-3 gap-3">
          {reviews.slice(0, 6).map((r, i) => (
            <div key={r.id || i} className="animate-slide-up" style={{ animationDelay: `${300 + i * 75}ms` }}>
              <ReviewCard review={r} />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center animate-slide-up delay-300">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-700 mb-1">Hali sharh yo&apos;q</p>
          <p className="text-xs text-slate-400">Birinchi bo&apos;lib fikr bildiring!</p>
        </div>
      )}

      {showModal && <ReviewModal onClose={() => setShowModal(false)} onSuccess={handleSuccess} />}
    </>
  );
}
