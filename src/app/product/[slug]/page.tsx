import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AddToCart from "@/components/store/add-to-cart";
import { getActiveProducts, getApprovedReviewStats, getApprovedReviews, getProductBySlug } from "@/lib/catalog";
import PageShell from "@/components/site/page-shell";
import { ARTICLES } from "@/lib/articles";
import { CATEGORY_ARTICLES, CATEGORY_CARE, COMMON_FAQ, SITE_NAME, SITE_URL, absUrl, faPrice, jsonLd } from "@/lib/site";
import { CATEGORY_LABELS } from "@/lib/types";
import { WHATSAPP_LINK } from "@/lib/shop-options";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "محصول یافت نشد", robots: { index: false, follow: false } };
  const base = p.description.trim() || `${p.name} از گلستان حافظ`;
  const desc = `${p.name} — ${base}. تحویل در تهران، کارت پیام رایگان.`.replace(/\s+/g, " ").slice(0, 160);
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

  const [stats, all, reviews] = await Promise.all([getApprovedReviewStats(p.id), getActiveProducts(p.category), getApprovedReviews(p.id)]);
  const related = all.filter((x) => x.id !== p.id).slice(0, 4);
  const catLabel = CATEGORY_LABELS[p.category] ?? p.category;
  const guideArticles = (CATEGORY_ARTICLES[p.category] ?? []).map((id) => ARTICLES.find((a) => a.id === id)).filter((a): a is NonNullable<typeof a> => !!a);
  const url = `${SITE_URL}/product/${p.slug}`;
  const bodyText = p.description.trim() || `${p.name} از دسته‌ی ${catLabel} گلستان حافظ؛ با تحویل در تهران، انتخاب زمان ارسال و کارت پیام رایگان.`;

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": `${url}#product`,
        name: p.name,
        description: bodyText,
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
    <PageShell>
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
            <p className="mt-5 leading-8 text-charcoal/80">{bodyText}</p>
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


        <section className="mt-12 grid gap-8 md:grid-cols-2" aria-label="اطلاعات بیشتر">
          <div>
            <h2 className="text-xl font-extrabold mb-3">نکات نگهداری {p.name}</h2>
            <ul className="space-y-2 leading-8 text-charcoal/85 list-disc pr-5">
              {(CATEGORY_CARE[p.category] ?? []).map((t) => (<li key={t}>{t}</li>))}
            </ul>
            {guideArticles.length > 0 && (
              <p className="mt-4 text-sm">
                بیشتر بخوانید:{" "}
                {guideArticles.map((a, i) => (
                  <span key={a.id}>{i > 0 ? "، " : ""}<Link href={`/blog/${a.id}`} className="underline underline-offset-4 hover:text-blush-dark">{a.title}</Link></span>
                ))}
              </p>
            )}
          </div>
          <div>
            <h2 className="text-xl font-extrabold mb-3">ارسال و ضمانت</h2>
            <p className="leading-8 text-charcoal/85">
              تحویل در تهران با انتخاب روز و ساعت دلخواه، کارت پیام رایگان و ضمانت ۷ روزه‌ی تازگی. جزئیات کامل در صفحه‌ی{" "}
              <Link href="/shipping-returns" className="underline underline-offset-4">ارسال و بازگشت</Link>.
            </p>
          </div>
        </section>


        {reviews.length > 0 && (
          <section className="mt-12" aria-labelledby="reviews">
            <h2 id="reviews" className="text-xl font-extrabold mb-4">
              نظرات مشتریان ({faPrice(stats.count)} نظر، میانگین {faPrice(stats.avg)} از ۵)
            </h2>
            <ul className="space-y-4">
              {reviews.map((r) => (
                <li key={r.id} className="bg-white rounded-2xl p-4 shadow-sm">
                  <p className="text-sm font-bold">{r.author} <span className="text-gold-dark">{"★".repeat(r.rating)}</span></p>
                  <p className="mt-1 text-sm leading-7 text-charcoal/80">{r.comment}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-12" aria-labelledby="faq">
          <h2 id="faq" className="text-xl font-extrabold mb-4">سوالات متداول درباره‌ی {p.name}</h2>
          <dl className="space-y-4">
            {COMMON_FAQ(p.name).map((f) => (
              <div key={f.q}><dt className="font-bold">{f.q}</dt><dd className="mt-1 leading-8 text-charcoal/80">{f.a}</dd></div>
            ))}
          </dl>
        </section>

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
    </PageShell>
  );
}
