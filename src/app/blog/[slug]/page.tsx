import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageShell from "@/components/site/page-shell";
import { ARTICLES, getArticle } from "@/lib/articles";
import { getActiveProducts } from "@/lib/catalog";
import { SITE_NAME, SITE_URL, absUrl, faPrice, jsonLd } from "@/lib/site";
import { CATEGORY_LABELS } from "@/lib/types";

export const revalidate = 600;
type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const a = getArticle(slug);
  if (!a) return { title: "مقاله یافت نشد", robots: { index: false, follow: false } };
  return {
    title: a.title,
    description: a.excerpt,
    alternates: { canonical: `/blog/${a.id}` },
    openGraph: {
      type: "article",
      url: `/blog/${a.id}`,
      title: `${a.title} | ${SITE_NAME}`,
      description: a.excerpt,
      publishedTime: a.date,
      locale: "fa_IR",
      images: [{ url: absUrl("/images/hero-2.jpg"), alt: a.title }],
    },
    twitter: { card: "summary_large_image", title: a.title, description: a.excerpt },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const a = getArticle(slug);
  if (!a) notFound();

  const products = (await getActiveProducts(a.category)).slice(0, 4);
  const more = ARTICLES.filter((x) => x.id !== a.id).slice(0, 3);
  const url = `${SITE_URL}/blog/${a.id}`;
  const words = a.content.join(" ").split(/\s+/).length;

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${url}#article`,
        headline: a.title,
        description: a.excerpt,
        inLanguage: "fa-IR",
        wordCount: words,
        datePublished: a.date,
        dateModified: a.date,
        mainEntityOfPage: url,
        image: [absUrl("/images/hero-2.jpg")],
        author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
        publisher: { "@type": "Organization", name: SITE_NAME, logo: { "@type": "ImageObject", url: absUrl("/logo.svg") } },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "خانه", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "مجله گلستان", item: `${SITE_URL}/blog` },
          { "@type": "ListItem", position: 3, name: a.title, item: url },
        ],
      },
    ],
  };

  return (
    <PageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />
      <article className="max-w-3xl mx-auto px-4 py-10">
        <nav aria-label="مسیر صفحه" className="text-xs text-muted-foreground mb-6 flex flex-wrap gap-2">
          <Link href="/" className="hover:text-charcoal">خانه</Link><span>/</span>
          <Link href="/blog" className="hover:text-charcoal">مجله گلستان</Link><span>/</span>
          <span className="text-charcoal font-bold">{a.title}</span>
        </nav>
        <h1 className="text-2xl md:text-4xl font-extrabold leading-[1.5]">{a.title}</h1>
        <p className="mt-3 text-xs text-muted-foreground">
          {a.tag} • {a.minutes} دقیقه مطالعه •{" "}
          <time dateTime={a.date}>{new Intl.DateTimeFormat("fa-IR", { dateStyle: "long" }).format(new Date(a.date))}</time>
        </p>
        <p className="mt-5 text-lg leading-9 text-charcoal/80">{a.excerpt}</p>
        <div className="mt-6 space-y-5">
          {a.content.map((p, i) => (<p key={i} className="leading-9 text-charcoal/85">{p}</p>))}
        </div>

        {products.length > 0 && (
          <section className="mt-12" aria-labelledby="rel-products">
            <h2 id="rel-products" className="text-xl font-extrabold mb-4">
              محصولات مرتبط از دسته <Link href={`/category/${a.category}`} className="underline underline-offset-4">{CATEGORY_LABELS[a.category]}</Link>
            </h2>
            <ul className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {products.map((p) => (
                <li key={p.id} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                  <Link href={`/product/${p.slug}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image} alt={p.name} width={400} height={400} loading="lazy" className="w-full aspect-square object-cover" />
                    <h3 className="p-3 text-sm font-bold">{p.name}</h3>
                    <div className="px-3 pb-3 text-xs text-muted-foreground">{faPrice(p.price)} تومان</div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-12" aria-labelledby="more">
          <h2 id="more" className="text-xl font-extrabold mb-3">مقاله‌های بیشتر</h2>
          <ul className="space-y-2 text-sm">
            {more.map((m) => (<li key={m.id}><Link href={`/blog/${m.id}`} className="underline underline-offset-4 hover:text-blush-dark">{m.title}</Link></li>))}
          </ul>
        </section>
      </article>
    </PageShell>
  );
}
