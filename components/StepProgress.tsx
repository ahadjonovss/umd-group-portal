"use client";

interface StepProgressProps {
  steps: string[];
  currentStep: number;
}

export function StepProgress({ steps, currentStep }: StepProgressProps) {
  const progressPct = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="w-full">
      {/* Top: step label */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-500">
          Qadam {currentStep} / {steps.length}
        </span>
        <span className="text-xs font-semibold text-blue-600">
          {steps[currentStep - 1]}
        </span>
      </div>

      {/* Linear progress bar */}
      <div className="relative h-1.5 bg-slate-100 rounded-full overflow-hidden mb-5">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPct}%` }}
        />
        {/* Shimmer on active */}
        <div
          className="absolute inset-y-0 left-0 rounded-full overflow-hidden pointer-events-none"
          style={{ width: `${progressPct}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        </div>
      </div>

      {/* Step dots */}
      <div className="flex items-start justify-between">
        {steps.map((label, index) => {
          const stepNum = index + 1;
          const isCompleted = stepNum < currentStep;
          const isActive = stepNum === currentStep;

          return (
            <div key={index} className="flex flex-col items-center gap-1.5 flex-1">
              <div className="relative">
                {/* Pulse ring on active */}
                {isActive && (
                  <span className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-40" />
                )}
                <div
                  className={`
                    relative w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold
                    transition-all duration-300 ease-out
                    ${isCompleted
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-200 scale-90"
                      : isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-200 scale-100"
                      : "bg-white text-slate-400 border-2 border-slate-200"
                    }
                  `}
                >
                  {isCompleted ? (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : stepNum}
                </div>
              </div>
              <span className={`
                text-xs text-center leading-tight max-w-[64px] hidden sm:block transition-colors duration-200
                ${isActive ? "text-blue-600 font-semibold" : isCompleted ? "text-slate-600" : "text-slate-400"}
              `}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
