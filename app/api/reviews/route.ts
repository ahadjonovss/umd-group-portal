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
      next: { revalidate: 60 },
    });
    const contentType = res.headers.get("content-type") || "";
    if (!res.ok || !contentType.includes("application/json")) {
      return NextResponse.json([] as Review[]);
    }
    const data = await res.json();
    return NextResponse.json(data as Review[]);
  } catch {
    return NextResponse.json([] as Review[]);
  }
}
