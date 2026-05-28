"use client";

const STAGES = [
  { label: "Ma'lumotlar yuklanmoqda...", until: 20 },
  { label: "Server ga yuborilmoqda...",  until: 80 },
  { label: "Telegram-ga yuborilmoqda...", until: 95 },
  { label: "Yakunlanmoqda...",            until: 100 },
];

function getLabel(p: number) {
  return STAGES.find((s) => p <= s.until)?.label ?? "Yakunlanmoqda...";
}

interface Props {
  progress: number;
  error?: string;
  onRetry?: () => void;
}

export function SubmitProgressOverlay({ progress, error, onRetry }: Props) {
  const label = getLabel(progress);
  const isDone = progress >= 100;

  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (progress / 100) * circ;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
      style={{ background: "rgba(15,23,42,0.65)", backdropFilter: "blur(6px)" }}>

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm mx-4 p-8 flex flex-col items-center gap-5 animate-scale-in">

        {error ? (
          <>
            <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center animate-bounce-in">
              <svg className="w-9 h-9 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-900 mb-1.5">Xato yuz berdi</p>
              <p className="text-sm text-red-600 leading-relaxed">{error}</p>
            </div>
            {onRetry && (
              <button
                onClick={onRetry}
                className="h-10 px-6 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 active:scale-95 transition-all"
              >
                Qayta urinib ko&apos;ring
              </button>
            )}
          </>

        ) : isDone ? (
          <>
            <div className="w-20 h-20 rounded-2xl bg-emerald-50 flex items-center justify-center animate-success">
              <svg className="w-9 h-9 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-900">Muvaffaqiyatli yuborildi!</p>
              <p className="text-sm text-slate-500 mt-1">Sahifa yuklanmoqda...</p>
            </div>
          </>

        ) : (
          <>
            {/* SVG circle progress */}
            <div className="relative w-32 h-32">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
                {/* Track */}
                <circle cx="64" cy="64" r={r} fill="none" stroke="#f1f5f9" strokeWidth="10" />
                {/* Progress arc */}
                <circle
                  cx="64" cy="64" r={r}
                  fill="none"
                  stroke="url(#progressGrad)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circ}
                  strokeDashoffset={offset}
                  style={{ transition: "stroke-dashoffset 0.4s ease-out" }}
                />
                <defs>
                  <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </svg>
              {/* Percentage */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-slate-900 tabular-nums">
                  {Math.round(progress)}%
                </span>
              </div>
            </div>

            {/* Label */}
            <div className="text-center">
              <p className="text-sm font-medium text-slate-700">{label}</p>
              <p className="text-xs text-slate-400 mt-0.5">Iltimos, sahifani yopmang</p>
            </div>

            {/* Linear bar */}
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, #3b82f6, #6366f1)",
                  transition: "width 0.4s ease-out",
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
