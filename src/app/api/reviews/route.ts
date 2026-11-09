import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clientIp, isRateLimited, tooManyRequests } from "@/lib/security";

export const dynamic = "force-dynamic";

/** Public: latest moderator-approved reviews (first name only). */
export async function GET(req: NextRequest) {
  if (isRateLimited(`reviews:${clientIp(req)}`, 60, 60_000)) return tooManyRequests();
  try {
    const rows = await db.review.findMany({
      where: { status: "approved" },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, author: true, rating: true, comment: true, productName: true },
    });
    return NextResponse.json({
      success: true,
      reviews: rows.map((r) => ({ ...r, author: (r.author || "مشتری").trim().split(/\s+/)[0] })),
    });
  } catch (e) {
    console.error("GET /api/reviews error:", e);
    return NextResponse.json({ success: true, reviews: [] });
  }
}
