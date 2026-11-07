import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getActiveProducts } from "@/lib/catalog";
import { CATEGORY_SEO, SITE_NAME, SITE_URL, absUrl, faPrice, jsonLd } from "@/lib/site";
import { CATEGORY_LABELS } from "@/lib/types";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return Object.keys(CATEGORY_SEO).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = CATEGORY_SEO[slug];
  if (!c) return { title: "دسته یافت نشد", robots: { index: false, follow: false } };
  return {
    title: c.title,
    description: c.description,
    alternates: { canonical: `/category/${slug}` },
    openGraph: { type: "website", url: `/category/${slug}`, title: `${c.title} | ${SITE_NAME}`, description: c.description, locale: "fa_IR" },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const c = CATEGORY_SEO[slug];
  if (!c) notFound();
  const products = await getActiveProducts(slug);

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: c.h1,
        description: c.description,
        url: `${SITE_URL}/category/${slug}`,
        inLanguage: "fa-IR",
        mainEntity: {
          "@type": "ItemList",
          itemListElement: products.map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${SITE_URL}/product/${p.slug}`,
            name: p.name,
            image: absUrl(p.image),
          })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "خانه", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: CATEGORY_LABELS[slug] ?? c.h1, item: `${SITE_URL}/category/${slug}` },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen bg-cream text-charcoal">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <nav aria-label="مسیر صفحه" className="text-xs text-muted-foreground mb-6 flex gap-2">
          <Link href="/" className="hover:text-charcoal">خانه</Link><span>/</span>
          <span className="text-charcoal font-bold">{CATEGORY_LABELS[slug]}</span>
        </nav>
        <h1 className="text-2xl md:text-4xl font-extrabold">{c.h1}</h1>
        <p className="mt-4 max-w-3xl leading-8 text-charcoal/80">{c.intro}</p>

        {products.length === 0 ? (
          <p className="mt-10 text-muted-foreground">محصولی در این دسته موجود نیست.</p>
        ) : (
          <ul className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.map((p, i) => (
              <li key={p.id} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                <Link href={`/product/${p.slug}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt={p.name} width={400} height={400} loading={i < 4 ? "eager" : "lazy"} className="w-full aspect-square object-cover" />
                  <h2 className="p-3 text-sm font-bold">{p.name}</h2>
                  <div className="px-3 pb-3 text-xs text-muted-foreground">{faPrice(p.price)} تومان</div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <nav aria-label="سایر دسته‌ها" className="mt-12 flex flex-wrap gap-3 text-sm">
          {Object.keys(CATEGORY_SEO).filter((k) => k !== slug).map((k) => (
            <Link key={k} href={`/category/${k}`} className="rounded-full border border-charcoal/20 px-4 py-2 hover:bg-white">
              {CATEGORY_LABELS[k]}
            </Link>
          ))}
        </nav>
        <p className="mt-8"><Link href="/" className="text-sm underline">← بازگشت به فروشگاه</Link></p>
      </div>
    </main>
  );
}
