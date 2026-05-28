"use client";

import { useRef, useState, DragEvent, ChangeEvent } from "react";

interface FileUploadProps {
  label: string;
  accept?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  value?: File | null;
  onChange: (file: File | null) => void;
  maxSizeMB?: number;
}

export function FileUpload({ label, accept, required, error, hint, value, onChange, maxSizeMB = 50 }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  function handleFile(file: File) {
    setLocalError(null);
    if (file.size > maxSizeMB * 1024 * 1024) {
      setLocalError(`Fayl hajmi ${maxSizeMB}MB dan oshmasligi kerak`);
      return;
    }
    onChange(file);
  }

  const displayError = error || localError;

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-700 select-none">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {value ? (
        <div className="flex items-center gap-3 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl animate-scale-in">
          <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{value.name}</p>
            <p className="text-xs text-slate-500">{(value.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
          <button
            type="button"
            onClick={() => { onChange(null); if (inputRef.current) inputRef.current.value = ""; }}
            className="w-7 h-7 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e: DragEvent<HTMLDivElement>) => {
            e.preventDefault(); setIsDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
          className={`
            cursor-pointer border-2 border-dashed rounded-xl p-6 text-center
            transition-all duration-200
            ${isDragging
              ? "border-blue-400 bg-blue-50 scale-[1.01]"
              : displayError
              ? "border-red-300 bg-red-50/50"
              : "border-slate-200 bg-slate-50/50 hover:border-blue-300 hover:bg-blue-50/50"
            }
          `}
        >
          <div className={`w-10 h-10 rounded-xl mx-auto mb-2.5 flex items-center justify-center transition-colors ${isDragging ? "bg-blue-100" : "bg-white"}`}>
            <svg className={`w-5 h-5 transition-colors ${isDragging ? "text-blue-600" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <p className="text-sm text-slate-600">
            <span className="text-blue-600 font-medium">Fayl tanlash</span>
            <span className="text-slate-400"> yoki sudrab tashlang</span>
          </p>
          {accept && <p className="text-xs text-slate-400 mt-1">{accept}</p>}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {displayError && (
        <p className="text-xs text-red-600 flex items-center gap-1 animate-slide-down">
          <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8z"/>
            <path d="M7.25 4.75a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zm.75 7a.75.75 0 100-1.5.75.75 0 000 1.5z"/>
          </svg>
          {displayError}
        </p>
      )}
      {hint && !displayError && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
