import type { MetadataRoute } from "next";
import { SITE_URL, CATEGORY_SEO } from "@/lib/site";
import { getActiveProducts } from "@/lib/catalog";
import { ARTICLES } from "@/lib/articles";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getActiveProducts();
  return [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    ...Object.keys(CATEGORY_SEO).map((slug) => ({
      url: `${SITE_URL}/category/${slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    { url: `${SITE_URL}/blog`, changeFrequency: "weekly", priority: 0.7 },
    ...ARTICLES.map((a) => ({
      url: `${SITE_URL}/blog/${a.id}`,
      lastModified: new Date(a.date),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...["about", "shipping-returns", "contact", "terms", "privacy"].map((slug) => ({
      url: `${SITE_URL}/${slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...products.map((p) => ({
      url: `${SITE_URL}/product/${p.slug}`,
      lastModified: p.createdAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
