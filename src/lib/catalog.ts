import { db } from "@/lib/db";

export type CatalogProduct = {
  id: string; slug: string; name: string; description: string; category: string;
  price: number; oldPrice: number | null; image: string; stock: number;
  rating: number; reviews: number; isBestseller: boolean; isNew: boolean;
  createdAt: Date;
};

export async function getActiveProducts(category?: string): Promise<CatalogProduct[]> {
  try {
    return await db.product.findMany({
      where: { isActive: true, ...(category ? { category } : {}) },
      orderBy: [{ isBestseller: "desc" }, { createdAt: "asc" }],
    });
  } catch {
    return []; // DB unavailable (e.g. at build time) — pages still render
  }
}

export async function getProductBySlug(slug: string): Promise<CatalogProduct | null> {
  try {
    return await db.product.findFirst({ where: { slug, isActive: true } });
  } catch {
    return null;
  }
}

/** Only genuine, moderator-approved reviews may feed aggregateRating (Google policy). */
export async function getApprovedReviewStats(productId: string): Promise<{ count: number; avg: number }> {
  try {
    const rows = await db.review.findMany({ where: { productId, status: "approved" }, select: { rating: true } });
    if (!rows.length) return { count: 0, avg: 0 };
    return { count: rows.length, avg: Math.round((rows.reduce((s, r) => s + r.rating, 0) / rows.length) * 10) / 10 };
  } catch {
    return { count: 0, avg: 0 };
  }
}
