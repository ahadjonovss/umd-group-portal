"use client";

import { forwardRef, TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
  hint?: string;
  charCount?: number;
  maxChars?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, label, hint, charCount, maxChars, className = "", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    const isOver = maxChars !== undefined && charCount !== undefined && charCount > maxChars;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <div className="flex items-center justify-between">
            <label htmlFor={inputId} className="text-sm font-medium text-slate-700 select-none">
              {label}
              {props.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {maxChars !== undefined && charCount !== undefined && (
              <span className={`text-xs tabular-nums transition-colors ${isOver ? "text-red-500 font-medium" : "text-slate-400"}`}>
                {charCount}/{maxChars}
              </span>
            )}
          </div>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={`
            w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900
            placeholder-slate-400 bg-white resize-y min-h-[100px]
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500
            hover:border-slate-400
            disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
            ${error
              ? "border-red-400 bg-red-50/50 focus:ring-red-400/40 focus:border-red-500"
              : "border-slate-200"
            }
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-600 flex items-center gap-1 animate-slide-down">
            <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8z"/>
              <path d="M7.25 4.75a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zm.75 7a.75.75 0 100-1.5.75.75 0 000 1.5z"/>
            </svg>
            {error}
          </p>
        )}
        {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
