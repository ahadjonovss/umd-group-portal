/**
 * Next.js App Router (nodejs runtime) da formData.get() turli
 * File/Blob implementatsiyalarini qaytarishi mumkin. Ushbu funksiya
 * arrayBuffer(), bytes(), stream() va Buffer kabi usullarni ketma-ket sinab ko'radi.
 */
export async function readFormFile(
  formData: FormData,
  key: string
): Promise<{ buffer: Buffer; name: string } | null> {
  const entry = formData.get(key);
  if (!entry || typeof entry === "string") return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const file = entry as any;
  const size: number = file.size ?? file.length ?? 0;
  if (!size) return null;

  let buffer: Buffer;

  if (typeof file.arrayBuffer === "function") {
    // Standard Web API Blob / File
    buffer = Buffer.from(await file.arrayBuffer());
  } else if (typeof file.bytes === "function") {
    // Node.js 22+ Blob.bytes()
    buffer = Buffer.from(await file.bytes());
  } else if (Buffer.isBuffer(file)) {
    buffer = file as Buffer;
  } else if (typeof file.stream === "function") {
    // ReadableStream fallback
    const reader = (file.stream() as ReadableStream<Uint8Array>).getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
    buffer = Buffer.concat(chunks.map((c) => Buffer.from(c)));
  } else {
    const type = Object.prototype.toString.call(file);
    throw new Error(`"${key}" faylini o'qib bo'lmadi (tur: ${type})`);
  }

  const name: string = file.name ?? file.filename ?? key;
  return { buffer, name };
}
