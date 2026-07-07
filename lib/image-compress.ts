// Rasmni brauzerda JPEG'ga siqadi. O'LCHAM (piksel) o'zgarmaydi — faqat fayl hajmi
// kamayadi (App Store/Play Market skrinshot o'lchami talablari buzilmaydi).
// Katta PNG skrinshotlar ko'pincha 5-10x kichrayadi → 413 (payload too large) oldi olinadi.
export async function compressImage(file: File, quality = 0.82): Promise<File> {
  if (typeof window === "undefined" || !file.type.startsWith("image/")) return file;

  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file; // o'qib bo'lmasa asl faylni qoldiramiz
  }

  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    // JPEG shaffoflikni qo'llamaydi — oq fon beramiz
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0);

    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", quality));
    if (!blob || blob.size >= file.size) return file; // foyda bermasa asl faylni qoldiramiz

    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
  } finally {
    bitmap.close?.();
  }
}

export async function compressImages(files: File[], quality = 0.82): Promise<File[]> {
  return Promise.all(files.map((f) => compressImage(f, quality)));
}
