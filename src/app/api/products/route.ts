import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withRealRatings } from "@/lib/catalog";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const category = req.nextUrl.searchParams.get("category") ?? "all";
    const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
    const includeInactive = req.nextUrl.searchParams.get("all") === "1";

    // only admins may see inactive products
    const showAll = includeInactive ? !!(await requireAdmin(req)) : false;

    const where: Record<string, unknown> = {};
    if (!showAll) where.isActive = true;
    if (category && category !== "all") where.category = category;
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { description: { contains: q } },
        { category: { contains: q } },
      ];
    }

    const products = await db.product.findMany({
      where,
      orderBy: [{ isBestseller: "desc" }, { createdAt: "asc" }],
    });
    return NextResponse.json({ success: true, products: await withRealRatings(products) });
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json(
      { success: false, products: [], error: "خطا در دریافت محصولات" },
      { status: 500 }
    );
  }
}
