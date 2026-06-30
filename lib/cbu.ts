import "server-only";

// Markaziy bank (cbu.uz) dan USD kursini oladi (so'mda). 1 soat cache.
export async function getUsdRate(): Promise<number | null> {
  try {
    const res = await fetch("https://cbu.uz/uz/arkhiv-kursov-valyut/json/USD/", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const rate = parseFloat(data?.[0]?.Rate);
    return Number.isFinite(rate) ? rate : null;
  } catch {
    return null;
  }
}
