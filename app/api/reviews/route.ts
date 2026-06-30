import { NextResponse } from "next/server";
import { getApprovedReviews } from "@/lib/firestore/reviews";
import type { ServiceType } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Landing uchun: Firestore'dagi tasdiqlangan (approved) reviewlar.
export interface Review {
  id: string;
  date: string;
  name: string;
  rating: number;
  comment: string;
  serviceType: ServiceType | null;
  appName: string | null;
  isPublished: boolean;
}

export async function GET() {
  try {
    const reviews = await getApprovedReviews();
    return NextResponse.json(reviews as Review[]);
  } catch {
    return NextResponse.json([] as Review[]);
  }
}
