"use client";

interface Stage {
  label: string;
  until: number; // progress % gacha
}

const STAGES: Stage[] = [
  { label: "Ma'lumotlar tayyorlanmoqda...", until: 20 },
  { label: "ZIP arxiv yaratilmoqda...", until: 65 },
  { label: "Telegram-ga yuborilmoqda...", until: 90 },
  { label: "Yakunlanmoqda...", until: 100 },
];

function getCurrentLabel(progress: number): string {
  for (const stage of STAGES) {
    if (progress <= stage.until) return stage.label;
  }
  return "Yakunlanmoqda...";
}

interface Props {
  progress: number; // 0–100
  error?: string;
  onRetry?: () => void;
}

export function SubmitProgressOverlay({ progress, error, onRetry }: Props) {
  const label = getCurrentLabel(progress);
  const isComplete = progress >= 100;

  // SVG doira parametrlari
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (progress / 100) * circ;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-8 flex flex-col items-center gap-6">

        {error ? (
          <>
            {/* Xato holati */}
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-900 mb-1">Xato yuz berdi</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
            {onRetry && (
              <button
                onClick={onRetry}
                className="h-10 px-6 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Qayta urinib ko&apos;ring
              </button>
            )}
          </>
        ) : isComplete ? (
          <>
            {/* Muvaffaqiyat */}
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-semibold text-gray-900">Muvaffaqiyatli yuborildi!</p>
          </>
        ) : (
          <>
            {/* Progress doirasi */}
            <div className="relative w-32 h-32">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                {/* Orqa doira */}
                <circle
                  cx="60" cy="60" r={r}
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="10"
                />
                {/* Progress doirasi */}
                <circle
                  cx="60" cy="60" r={r}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circ}
                  strokeDashoffset={offset}
                  className="transition-all duration-500 ease-out"
                />
              </svg>
              {/* Foiz */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">
                  {Math.round(progress)}%
                </span>
              </div>
            </div>

            {/* Status matni */}
            <div className="text-center">
              <p className="font-medium text-gray-800">{label}</p>
              <p className="text-xs text-gray-400 mt-1">Iltimos kuting...</p>
            </div>

            {/* Pastki linear progress bar */}
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
