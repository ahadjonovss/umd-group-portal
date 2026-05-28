"use client";

import { useRef, useState, DragEvent, ChangeEvent, useEffect } from "react";

export interface ImageValidationConfig {
  width: number;
  height: number;
  maxSizeMB: number;
  strict: boolean;
  label?: string;
}

interface ImageUploadProps {
  label: string;
  required?: boolean;
  error?: string;
  value?: File | null;
  onChange: (file: File | null) => void;
  validation: ImageValidationConfig;
  multiple?: false;
}

interface MultiImageUploadProps {
  label: string;
  required?: boolean;
  error?: string;
  value: File[];
  onChange: (files: File[]) => void;
  validation: ImageValidationConfig;
  multiple: true;
  minCount?: number;
  maxCount?: number;
}

type Props = ImageUploadProps | MultiImageUploadProps;

async function validateClientImage(
  file: File,
  config: ImageValidationConfig
): Promise<{ valid: boolean; warning?: string; error?: string; preview?: string }> {
  return new Promise((resolve) => {
    if (file.size > config.maxSizeMB * 1024 * 1024) {
      resolve({ valid: false, error: `Fayl hajmi ${config.maxSizeMB}MB dan oshmasligi kerak` });
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (config.strict) {
        if (img.width !== config.width || img.height !== config.height) {
          resolve({
            valid: false,
            error: `Rasm o'lchami ${config.width}×${config.height} px bo'lishi kerak. Siz ${img.width}×${img.height} px yubordingiz.`,
          });
        } else {
          resolve({ valid: true });
        }
      } else {
        if (img.width !== config.width || img.height !== config.height) {
          resolve({
            valid: true,
            warning: `Tavsiya etilgan o'lcham: ${config.width}×${config.height} px. Siz ${img.width}×${img.height} px yubordingiz.`,
          });
        } else {
          resolve({ valid: true });
        }
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ valid: false, error: "Rasm faylini o'qishda xato" });
    };
    img.src = url;
  });
}

interface PreviewItem {
  file: File;
  preview: string;
  error?: string;
  warning?: string;
}

export function ImageUpload(props: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previews, setPreviews] = useState<PreviewItem[]>([]);

  const isMultiple = props.multiple === true;

  useEffect(() => {
    if (!isMultiple) return;
    const multiProps = props as MultiImageUploadProps;
    if (multiProps.value.length === 0) setPreviews([]);
  }, [isMultiple, (props as MultiImageUploadProps).value?.length]);

  async function processFiles(files: File[]) {
    if (!isMultiple) {
      const file = files[0];
      if (!file) return;
      const result = await validateClientImage(file, props.validation);
      const preview = URL.createObjectURL(file);
      setPreviews([{ file, preview, error: result.error, warning: result.warning }]);
      if (result.valid) {
        (props as ImageUploadProps).onChange(file);
      } else {
        (props as ImageUploadProps).onChange(null);
      }
      return;
    }

    const multiProps = props as MultiImageUploadProps;
    const maxCount = multiProps.maxCount ?? 10;
    const currentCount = multiProps.value.length;
    const remaining = maxCount - currentCount;
    const toProcess = files.slice(0, remaining);

    const newPreviews: PreviewItem[] = [];
    const validFiles: File[] = [];

    for (const file of toProcess) {
      const result = await validateClientImage(file, props.validation);
      const preview = URL.createObjectURL(file);
      newPreviews.push({ file, preview, error: result.error, warning: result.warning });
      if (result.valid) validFiles.push(file);
    }

    setPreviews((prev) => [...prev, ...newPreviews]);
    multiProps.onChange([...multiProps.value, ...validFiles]);
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length) processFiles(files);
    e.target.value = "";
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) processFiles(files);
  }

  function removeImage(index: number) {
    const updated = previews.filter((_, i) => i !== index);
    URL.revokeObjectURL(previews[index].preview);
    setPreviews(updated);
    if (isMultiple) {
      const multiProps = props as MultiImageUploadProps;
      multiProps.onChange(updated.filter((p) => !p.error).map((p) => p.file));
    } else {
      (props as ImageUploadProps).onChange(null);
    }
  }

  const singleValue = !isMultiple ? (props as ImageUploadProps).value : null;
  const hasValue = isMultiple ? previews.length > 0 : !!singleValue;
  const displayError = props.error;

  const { width, height } = props.validation;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          {props.label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <span className="text-xs text-gray-400">{width}×{height} px</span>
      </div>

      {/* Upload zone */}
      {(!hasValue || isMultiple) && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`cursor-pointer border-2 border-dashed rounded-xl p-4 text-center transition-all duration-200 ${
            isDragging
              ? "border-blue-400 bg-blue-50"
              : displayError
              ? "border-red-300 bg-red-50"
              : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"
          }`}
        >
          <svg className="w-7 h-7 text-gray-400 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-xs text-gray-600">
            <span className="text-blue-600 font-medium">Rasm tanlash</span> yoki sudrab tashlang
          </p>
          <p className="text-xs text-gray-400 mt-0.5">PNG, JPEG • max {props.validation.maxSizeMB}MB</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg"
        multiple={isMultiple}
        className="hidden"
        onChange={handleChange}
      />

      {/* Previews */}
      {previews.length > 0 && (
        <div className={`grid gap-3 ${isMultiple ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-1"}`}>
          {previews.map((item, i) => (
            <div key={i} className="relative group">
              <div className={`relative aspect-square rounded-lg overflow-hidden border-2 ${item.error ? "border-red-400" : item.warning ? "border-yellow-400" : "border-green-400"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.preview}
                  alt={`preview-${i}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {item.error && (
                <p className="text-xs text-red-600 mt-1 leading-tight">❌ {item.error}</p>
              )}
              {item.warning && !item.error && (
                <p className="text-xs text-yellow-600 mt-1 leading-tight">⚠️ {item.warning}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {displayError && <p className="text-xs text-red-600">❌ {displayError}</p>}
    </div>
  );
}
