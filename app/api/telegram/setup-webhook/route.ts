import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { SITE_URL } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Bir martalik: bot webhookini to'g'ri URL + allowed_updates bilan ro'yxatga oladi.
// message (/, /start) va callback_query (to'lov tugmalari) ikkalasi ham kelsin.
// Himoya: ?secret=APPROVE_SECRET
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!secret || secret !== process.env.APPROVE_SECRET) {
    return NextResponse.json({ ok: false, error: "Ruxsat yo'q" }, { status: 401 });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return NextResponse.json({ ok: false, error: "TELEGRAM_BOT_TOKEN yo'q" }, { status: 500 });

  const url = `${SITE_URL}/api/telegram/webhook`;
  try {
    const res = await axios.post(`https://api.telegram.org/bot${token}/setWebhook`, {
      url,
      secret_token: process.env.TELEGRAM_WEBHOOK_SECRET || undefined,
      allowed_updates: ["message", "callback_query"],
      drop_pending_updates: false,
    });
    const info = await axios.get(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    return NextResponse.json({
      ok: true,
      setWebhook: res.data,
      webhookInfo: {
        url: info.data?.result?.url,
        allowed_updates: info.data?.result?.allowed_updates ?? "(hammasi)",
        pending: info.data?.result?.pending_update_count,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
