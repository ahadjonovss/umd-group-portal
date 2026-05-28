import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const token = searchParams.get("token");

  if (!id || !token || token !== process.env.APPROVE_SECRET) {
    return new NextResponse("Ruxsat yo'q", { status: 403 });
  }

  const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
  if (!scriptUrl || scriptUrl.includes("your_apps_script")) {
    return new NextResponse("Script URL sozlanmagan", { status: 500 });
  }

  try {
    const res = await fetch(scriptUrl, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve", id }),
    });
    await res.text();
  } catch {
    return new NextResponse("Xato yuz berdi", { status: 500 });
  }

  // Muvaffaqiyat — chiroyli HTML sahifasi qaytaradi
  return new NextResponse(
    `<!doctype html><html lang="uz"><head><meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Sharh tasdiqlandi</title>
    <style>
      body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8fafc}
      .card{background:#fff;border-radius:20px;padding:40px;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.08);max-width:360px}
      .icon{font-size:48px;margin-bottom:16px}
      h1{color:#0f172a;font-size:20px;margin:0 0 8px}
      p{color:#64748b;font-size:14px;margin:0 0 20px}
      a{display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 24px;border-radius:12px;font-size:14px;font-weight:600}
    </style></head><body>
    <div class="card">
      <div class="icon">✅</div>
      <h1>Sharh tasdiqlandi!</h1>
      <p>Sharh saytda ko'rinadi</p>
      <a href="/">Saytga qaytish</a>
    </div></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
