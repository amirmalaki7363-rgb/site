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
  } catch (e) {
    console.error("[catalog] getActiveProducts failed:", e);
    return []; // DB unavailable (e.g. at build time) — pages still render
  }
}

export async function getProductBySlug(slug: string): Promise<CatalogProduct | null> {
  try {
    const p = await db.product.findFirst({ where: { slug, isActive: true } });
    if (!p) console.warn(`[catalog] no active product with slug "${slug}"`);
    return p;
  } catch (e) {
    console.error(`[catalog] getProductBySlug("${slug}") failed:`, e);
    return null;
  }
}

/** Only genuine, moderator-approved reviews may feed aggregateRating (Google policy). */
export async function getApprovedReviewStats(productId: string): Promise<{ count: number; avg: number }> {
  try {
    const rows = await db.review.findMany({ where: { productId, status: "approved" }, select: { rating: true } });
    if (!rows.length) return { count: 0, avg: 0 };
    return { count: rows.length, avg: Math.round((rows.reduce((s, r) => s + r.rating, 0) / rows.length) * 10) / 10 };
  } catch (e) {
    console.error("[catalog] getApprovedReviewStats failed:", e);
    return { count: 0, avg: 0 };
  }
}

export async function getPublicSettings() {
  const fallback = {
    shopName: "گلستان حافظ", phone: "09127385527", address: "تهران، خیابان ولیعصر، کوچه یاس، پلاک ۸",
    hours: "هر روز از ۹ صبح تا ۹ شب", shippingFee: 0, freeShippingMin: 0, email: "",
  };
  try {
    const s = await db.settings.findFirst();
    return s ? { ...fallback, ...s } : fallback;
  } catch {
    return fallback;
  }
}

/** Approved reviews only; author is reduced to the first name for privacy. */
export async function getApprovedReviews(productId: string, take = 10) {
  try {
    const rows = await db.review.findMany({
      where: { productId, status: "approved" },
      orderBy: { createdAt: "desc" },
      take,
      select: { id: true, author: true, rating: true, comment: true, createdAt: true },
    });
    return rows.map((r) => ({ ...r, author: (r.author || "مشتری").trim().split(/\s+/)[0] }));
  } catch (e) {
    console.error("[catalog] getApprovedReviews failed:", e);
    return [];
  }
}

/**
 * Star ratings shown on the storefront come ONLY from real, moderator-approved reviews.
 * (The rating/reviews columns in the Product table hold demo seed values and are never shown.)
 */
export async function withRealRatings<T extends { id: string; rating: number; reviews: number }>(products: T[]): Promise<T[]> {
  try {
    const groups = await db.review.groupBy({
      by: ["productId"],
      where: { status: "approved" },
      _avg: { rating: true },
      _count: { _all: true },
    });
    const m = new Map(groups.map((g) => [g.productId, { rating: Math.round((g._avg.rating ?? 0) * 10) / 10, reviews: g._count._all }]));
    return products.map((p) => ({ ...p, rating: m.get(p.id)?.rating ?? 0, reviews: m.get(p.id)?.reviews ?? 0 }));
  } catch (e) {
    console.error("[catalog] withRealRatings failed:", e);
    return products.map((p) => ({ ...p, rating: 0, reviews: 0 }));
  }
}
