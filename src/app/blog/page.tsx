import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/site/page-shell";
import { ARTICLES } from "@/lib/articles";
import { SITE_NAME, SITE_URL, jsonLd } from "@/lib/site";

export const metadata: Metadata = {
  title: "مجله گلستان؛ راهنمای نگهداری گل و گیاه و انتخاب هدیه",
  description: "مقاله‌های کاربردی درباره‌ی تازه نگه داشتن گل رز، معنی گل‌ها، گیاهان آپارتمانی کم‌نور و راهنمای هدیه‌دادن دسته‌گل.",
  alternates: { canonical: "/blog" },
  openGraph: { type: "website", url: "/blog", title: `مجله گلستان | ${SITE_NAME}`, locale: "fa_IR" },
};

export default function BlogIndex() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Blog",
        name: "مجله گلستان",
        url: `${SITE_URL}/blog`,
        inLanguage: "fa-IR",
        blogPost: ARTICLES.map((a) => ({ "@type": "BlogPosting", headline: a.title, url: `${SITE_URL}/blog/${a.id}`, datePublished: a.date })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "خانه", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "مجله گلستان", item: `${SITE_URL}/blog` },
        ],
      },
    ],
  };
  return (
    <PageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <nav aria-label="مسیر صفحه" className="text-xs text-muted-foreground mb-6 flex gap-2">
          <Link href="/" className="hover:text-charcoal">خانه</Link><span>/</span><span className="text-charcoal font-bold">مجله گلستان</span>
        </nav>
        <h1 className="text-2xl md:text-4xl font-extrabold">مجله گلستان؛ دانستنی‌های دنیای گل</h1>
        <p className="mt-3 max-w-2xl leading-8 text-charcoal/80">از راز تازه ماندن گل تا معنی هر گل و نگهداری گیاهان آپارتمانی؛ راهنماهای کوتاه و کاربردی برای انتخاب و نگهداری بهتر.</p>
        <ul className="mt-8 grid gap-5 sm:grid-cols-2">
          {ARTICLES.map((a) => (
            <li key={a.id} className="bg-white rounded-3xl p-6 shadow-sm">
              <p className="text-xs font-bold text-sage-dark">{a.tag} • {a.minutes} دقیقه مطالعه</p>
              <h2 className="mt-2 text-lg font-extrabold leading-8">
                <Link href={`/blog/${a.id}`} className="hover:text-blush-dark">{a.emoji} {a.title}</Link>
              </h2>
              <p className="mt-2 text-sm leading-7 text-charcoal/70">{a.excerpt}</p>
              <Link href={`/blog/${a.id}`} className="mt-3 inline-block text-sm font-bold underline underline-offset-4">ادامه مطلب</Link>
            </li>
          ))}
        </ul>
      </div>
    </PageShell>
  );
}
