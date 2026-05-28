"use client";

import { useState } from "react";

interface ReviewModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const LABELS = ["", "Yomon", "Past", "O'rtacha", "Yaxshi", "Ajoyib!"];
const LABEL_COLORS = ["", "text-red-500", "text-orange-500", "text-yellow-600", "text-blue-600", "text-emerald-600"];

function StarSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="transition-transform hover:scale-125 active:scale-95 focus:outline-none"
          >
            <svg
              className={`w-10 h-10 transition-all duration-150 drop-shadow-sm ${
                star <= active ? "text-amber-400" : "text-slate-200"
              }`}
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        ))}
      </div>
      <span className={`text-sm font-semibold h-5 transition-all ${active ? LABEL_COLORS[active] : "text-transparent"}`}>
        {active ? LABELS[active] : "x"}
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
    if (!rating) { setError("Reyting tanlang"); return; }
    if (!name.trim()) { setError("Ismingizni kiriting"); return; }
    if (!comment.trim()) { setError("Izoh yozing"); return; }

    setStatus("loading");
    setError("");

    try {
      const res = await fetch("/api/reviews/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), rating, comment: comment.trim() }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Xato yuz berdi");
      onSuccess();
    } catch (err: unknown) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Xato yuz berdi");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 animate-fade-in"
      style={{ background: "rgba(15,23,42,0.6)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm animate-scale-in">

        {/* Header gradient */}
        <div className="bg-gradient-to-br from-blue-600 to-violet-600 px-6 pt-6 pb-6 text-center relative rounded-t-3xl">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-white">Baho bering</h2>
          <p className="text-white/70 text-xs mt-1">Xizmatimiz haqida fikringizni bildiring</p>
        </div>

        {/* Stars */}
        <div className="px-4 pt-5 pb-3 flex flex-col items-center">
          <StarSelector value={rating} onChange={setRating} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 pt-4 pb-5 space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ismingiz"
            maxLength={60}
            className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 hover:border-slate-300 transition-all bg-slate-50/50"
          />

          <div className="relative">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Fikringizni yozing..."
              maxLength={500}
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 hover:border-slate-300 transition-all bg-slate-50/50 pb-6"
            />
            <span className={`absolute bottom-2 right-3 text-[10px] tabular-nums ${comment.length > 450 ? "text-amber-500" : "text-slate-400"}`}>
              {comment.length}/500
            </span>
          </div>

          {error && (
            <p className="text-xs text-red-500 flex items-center gap-1.5 animate-slide-down">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              {error}
            </p>
          )}

          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 active:scale-[0.98] transition-all"
            >
              Bekor
            </button>
            <button
              type="submit"
              disabled={status === "loading"}
              className="flex-[2] h-11 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm shadow-blue-200"
            >
              {status === "loading" ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Yuborilmoqda...
                </>
              ) : "Yuborish →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
