import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  if (!checkRateLimit(ip).allowed) {
    return NextResponse.json({ success: false, error: "Juda ko'p so'rov" }, { status: 429 });
  }

  const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
  if (!scriptUrl) {
    return NextResponse.json({ success: false, error: "Script URL sozlanmagan" }, { status: 500 });
  }

  let body: { name?: string; rating?: number; comment?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Noto'g'ri format" }, { status: 400 });
  }

  const { name, rating, comment } = body;

  if (!name || !rating || !comment) {
    return NextResponse.json({ success: false, error: "Barcha maydonlar to'ldirilishi kerak" }, { status: 400 });
  }
  if (rating < 1 || rating > 5) {
    return NextResponse.json({ success: false, error: "Reyting 1-5 orasida bo'lishi kerak" }, { status: 400 });
  }
  if (comment.length > 500) {
    return NextResponse.json({ success: false, error: "Izoh 500 belgidan oshmasin" }, { status: 400 });
  }

  try {
    const res = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "submit", name, rating, comment }),
    });
    if (!res.ok) throw new Error("Script error");
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Yuborishda xato yuz berdi" }, { status: 500 });
  }
}
