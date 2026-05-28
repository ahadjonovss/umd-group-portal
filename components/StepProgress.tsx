"use client";

interface StepProgressProps {
  steps: string[];
  currentStep: number;
}

export function StepProgress({ steps, currentStep }: StepProgressProps) {
  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="relative h-2 bg-gray-200 rounded-full mb-6">
        <div
          className="absolute top-0 left-0 h-2 bg-blue-600 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />
      </div>

      {/* Step indicators */}
      <div className="flex items-start justify-between">
        {steps.map((label, index) => {
          const stepNum = index + 1;
          const isCompleted = stepNum < currentStep;
          const isActive = stepNum === currentStep;

          return (
            <div key={index} className="flex flex-col items-center gap-1 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                  isCompleted
                    ? "bg-blue-600 text-white"
                    : isActive
                    ? "bg-blue-600 text-white ring-4 ring-blue-100"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  stepNum
                )}
              </div>
              <span
                className={`text-xs text-center leading-tight max-w-[80px] hidden sm:block ${
                  isActive ? "text-blue-600 font-medium" : isCompleted ? "text-gray-600" : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-500 mt-3 sm:hidden text-center">
        Qadam {currentStep} / {steps.length}: <span className="font-medium text-gray-700">{steps[currentStep - 1]}</span>
      </p>
    </div>
  );
}
