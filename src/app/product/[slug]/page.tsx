import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AddToCart from "@/components/store/add-to-cart";
import { getActiveProducts, getApprovedReviewStats, getProductBySlug } from "@/lib/catalog";
import { SITE_NAME, SITE_URL, absUrl, faPrice, jsonLd } from "@/lib/site";
import { CATEGORY_LABELS } from "@/lib/types";
import { WHATSAPP_LINK } from "@/lib/shop-options";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "محصول یافت نشد", robots: { index: false, follow: false } };
  const desc = `${p.name} — ${p.description}`.replace(/\s+/g, " ").slice(0, 160);
  return {
    title: `خرید ${p.name}`,
    description: desc,
    alternates: { canonical: `/product/${p.slug}` },
    openGraph: {
      type: "website",
      url: `/product/${p.slug}`,
      title: `${p.name} | ${SITE_NAME}`,
      description: desc,
      images: [{ url: absUrl(p.image), alt: p.name }],
      locale: "fa_IR",
    },
    twitter: { card: "summary_large_image", title: p.name, description: desc, images: [absUrl(p.image)] },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) notFound();

  const [stats, all] = await Promise.all([getApprovedReviewStats(p.id), getActiveProducts(p.category)]);
  const related = all.filter((x) => x.id !== p.id).slice(0, 4);
  const catLabel = CATEGORY_LABELS[p.category] ?? p.category;
  const url = `${SITE_URL}/product/${p.slug}`;

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": `${url}#product`,
        name: p.name,
        description: p.description,
        image: [absUrl(p.image)],
        sku: p.slug,
        category: catLabel,
        brand: { "@type": "Brand", name: SITE_NAME },
        offers: {
          "@type": "Offer",
          url,
          priceCurrency: "IRR",
          price: String(p.price * 10), // prices are stored in toman; schema.org uses rial for IRR
          availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          itemCondition: "https://schema.org/NewCondition",
          seller: { "@type": "Organization", name: SITE_NAME },
        },
        ...(stats.count > 0
          ? { aggregateRating: { "@type": "AggregateRating", ratingValue: stats.avg, reviewCount: stats.count } }
          : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "خانه", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: catLabel, item: `${SITE_URL}/category/${p.category}` },
          { "@type": "ListItem", position: 3, name: p.name, item: url },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen bg-cream text-charcoal">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <nav aria-label="مسیر صفحه" className="text-xs text-muted-foreground mb-6 flex flex-wrap gap-2">
          <Link href="/" className="hover:text-charcoal">خانه</Link><span>/</span>
          <Link href={`/category/${p.category}`} className="hover:text-charcoal">{catLabel}</Link><span>/</span>
          <span className="text-charcoal font-bold">{p.name}</span>
        </nav>

        <div className="grid gap-8 md:grid-cols-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.image} alt={p.name} width={800} height={800} fetchPriority="high"
               className="w-full aspect-square object-cover rounded-3xl shadow-md" />
          <div>
            <h1 className="text-2xl md:text-4xl font-extrabold leading-[1.4]">{p.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              دسته: <Link href={`/category/${p.category}`} className="underline">{catLabel}</Link>
            </p>
            <div className="mt-5 flex items-baseline gap-3">
              <span className="text-2xl font-extrabold">{faPrice(p.price)} تومان</span>
              {p.oldPrice ? <del className="text-sm text-muted-foreground">{faPrice(p.oldPrice)}</del> : null}
            </div>
            <p className="mt-5 leading-8 text-charcoal/80">{p.description}</p>
            <p className="mt-3 text-sm font-bold">{p.stock > 0 ? "✔ موجود در انبار" : "✖ فعلاً ناموجود"}</p>
            <ul className="mt-5 text-sm text-muted-foreground space-y-1">
              <li>• تحویل در تهران با انتخاب روز و ساعت</li>
              <li>• کارت پیام رایگان</li>
              <li>• گل تازه و دست‌چین هر روز</li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3 items-center">
              <AddToCart id={p.id} name={p.name} price={p.price} image={p.image} disabled={p.stock <= 0} />
              <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer"
                 className="rounded-full border border-charcoal/30 px-6 py-3 text-sm font-bold hover:bg-white">
                سفارش در واتس‌آپ
              </a>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-14" aria-labelledby="related">
            <h2 id="related" className="text-xl font-extrabold mb-4">محصولات مشابه</h2>
            <ul className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {related.map((r) => (
                <li key={r.id} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                  <Link href={`/product/${r.slug}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.image} alt={r.name} width={400} height={400} loading="lazy" className="w-full aspect-square object-cover" />
                    <div className="p-3 text-sm font-bold">{r.name}</div>
                    <div className="px-3 pb-3 text-xs text-muted-foreground">{faPrice(r.price)} تومان</div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        <p className="mt-10"><Link href="/" className="text-sm underline">← بازگشت به فروشگاه</Link></p>
      </div>
    </main>
  );
}
