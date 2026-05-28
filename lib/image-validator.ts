import sharp from "sharp";

export interface ImageValidationConfig {
  width: number;
  height: number;
  maxSizeBytes: number;
  strict: boolean;
  formats?: string[];
}

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  warning?: string;
}

export async function validateImageBuffer(
  buffer: Buffer,
  config: ImageValidationConfig
): Promise<ImageValidationResult> {
  try {
    if (buffer.length > config.maxSizeBytes) {
      const maxMB = (config.maxSizeBytes / 1024 / 1024).toFixed(0);
      return {
        valid: false,
        error: `Fayl hajmi ${maxMB}MB dan oshmasligi kerak`,
      };
    }

    const metadata = await sharp(buffer).metadata();

    if (config.strict) {
      if (metadata.width !== config.width || metadata.height !== config.height) {
        return {
          valid: false,
          error: `Rasm o'lchami ${config.width}×${config.height} px bo'lishi kerak. Siz ${metadata.width}×${metadata.height} px yubordingiz.`,
        };
      }
    } else {
      if (metadata.width !== config.width || metadata.height !== config.height) {
        return {
          valid: true,
          warning: `Tavsiya etilgan o'lcham: ${config.width}×${config.height} px. Siz ${metadata.width}×${metadata.height} px yubordingiz.`,
        };
      }
    }

    return { valid: true };
  } catch {
    return { valid: false, error: "Rasm faylini o'qishda xato yuz berdi" };
  }
}

export async function validateAppStoreIcon(buffer: Buffer): Promise<ImageValidationResult> {
  const result = await validateImageBuffer(buffer, {
    width: 1024,
    height: 1024,
    maxSizeBytes: 10 * 1024 * 1024,
    strict: true,
  });

  if (result.valid) {
    const metadata = await sharp(buffer).metadata();
    if (metadata.hasAlpha) {
      return {
        valid: false,
        error: "App Store ikonasi alpha channel (shaffoflik) bo'lmasligi kerak",
      };
    }
  }

  return result;
}
