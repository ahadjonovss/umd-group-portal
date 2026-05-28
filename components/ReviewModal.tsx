"use client";

import { useState } from "react";

interface ReviewModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function StarSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="p-0.5 transition-transform hover:scale-110 active:scale-95"
        >
          <svg
            className={`w-8 h-8 transition-colors duration-100 ${
              star <= (hovered || value) ? "text-amber-400" : "text-slate-200"
            }`}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
      <span className="ml-1 text-sm text-slate-500 min-w-[60px]">
        {hovered || value
          ? ["", "Yomon", "Past", "O'rtacha", "Yaxshi", "Ajoyib"][hovered || value]
          : "Baholang"}
      </span>
    </div>
  );
}

export function ReviewModal({ onClose, onSuccess }: ReviewModalProps) {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) { setError("Iltimos, reyting bering"); return; }
    if (!name.trim()) { setError("Ismingizni kiriting"); return; }
    if (!comment.trim()) { setError("Izoh yozing"); return; }

    setStatus("loading");
    setError("");

    try {
      const scriptUrl = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL;
      if (!scriptUrl) throw new Error("Script URL sozlanmagan");

      const reviewId = crypto.randomUUID();
      const params = new URLSearchParams({
        action: "submit",
        id: reviewId,
        name: name.trim(),
        rating: String(rating),
        comment: comment.trim(),
      });

      // To'g'ridan Apps Script ga GET so'rov (CORS muammo yo'q)
      const res = await fetch(`${scriptUrl}?${params.toString()}`, {
        method: "GET",
        mode: "no-cors", // redirect HTML ga to'xtamaslik uchun
      });

      // no-cors da response body o'qilmaydi, ammo so'rov yetib boradi
      // Telegram xabar server orqali yuboriladi (bloklamas)
      fetch("/api/reviews/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), rating, comment: comment.trim(), id: reviewId }),
      }).catch(() => {});

      onSuccess();
    } catch (err: unknown) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Xato yuz berdi");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 animate-fade-in"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h2 className="font-semibold text-slate-900">Baho berish</h2>
            <p className="text-xs text-slate-500 mt-0.5">Xizmatimiz haqida fikringizni bildiring</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Stars */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">
              Reyting <span className="text-red-500">*</span>
            </label>
            <StarSelector value={rating} onChange={setRating} />
          </div>

          {/* Name */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">
              Ismingiz <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sardor Abdullayev"
              maxLength={60}
              className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 hover:border-slate-400 transition-all"
            />
          </div>

          {/* Comment */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-slate-700">
                Izoh <span className="text-red-500">*</span>
              </label>
              <span className={`text-xs tabular-nums ${comment.length > 450 ? "text-amber-500" : "text-slate-400"}`}>
                {comment.length}/500
              </span>
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Xizmat haqida fikringizni yozing..."
              maxLength={500}
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 hover:border-slate-400 transition-all"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 flex items-center gap-1 animate-slide-down">
              <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1.5a6.5 6.5 0 100 13A6.5 6.5 0 008 1.5zM0 8a8 8 0 1116 0A8 8 0 010 8z"/>
                <path d="M7.25 4.75a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zm.75 7a.75.75 0 100-1.5.75.75 0 000 1.5z"/>
              </svg>
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={status === "loading"}
              className="flex-1 h-11 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {status === "loading" ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Yuborilmoqda...
                </>
              ) : "Yuborish ✓"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
