import { NextResponse } from "next/server";

export interface Review {
  id: string;
  date: string;
  name: string;
  rating: number;
  comment: string;
}

export async function GET() {
  const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
  if (!scriptUrl) {
    return NextResponse.json([] as Review[]);
  }

  try {
    const res = await fetch(`${scriptUrl}?action=get`, {
      redirect: "follow",
      cache: "no-store",
    });
    const text = await res.text();
    if (!text.trimStart().startsWith("[")) {
      return NextResponse.json([] as Review[]);
    }
    return NextResponse.json(JSON.parse(text) as Review[]);
  } catch {
    return NextResponse.json([] as Review[]);
  }
}
