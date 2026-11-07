import Link from "next/link";
import AppShell from "@/components/app-shell";
import { getActiveProducts } from "@/lib/catalog";
import { BUSINESS, CATEGORY_SEO, SITE_DESC, SITE_NAME, SITE_URL, absUrl, jsonLd } from "@/lib/site";
import { CATEGORY_LABELS } from "@/lib/types";

export const revalidate = 300;

export default async function Home() {
  const products = await getActiveProducts();

  const org = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Florist",
        "@id": `${SITE_URL}/#business`,
        name: SITE_NAME,
        url: SITE_URL,
        description: SITE_DESC,
        image: absUrl("/images/hero-1.jpg"),
        logo: absUrl("/logo.svg"),
        telephone: BUSINESS.phone,
        priceRange: "$$",
        address: {
          "@type": "PostalAddress",
          streetAddress: BUSINESS.streetAddress,
          addressLocality: BUSINESS.city,
          addressRegion: BUSINESS.region,
          addressCountry: BUSINESS.country,
        },
        areaServed: { "@type": "City", name: "تهران" },
        openingHoursSpecification: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
          opens: BUSINESS.opens,
          closes: BUSINESS.closes,
        },
        sameAs: [BUSINESS.instagram],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        inLanguage: "fa-IR",
        publisher: { "@id": `${SITE_URL}/#business` },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(org) }} />
      <AppShell>
      {/* Crawlable, user-visible catalogue index: real <a href> links to every category and product page */}
      <section aria-labelledby="catalog-index" className="bg-cream px-4 py-12 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <h2 id="catalog-index" className="text-xl md:text-2xl font-extrabold text-charcoal mb-6">
            فهرست دسته‌ها و محصولات گلستان حافظ
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {Object.keys(CATEGORY_SEO).map((slug) => {
              const list = products.filter((p) => p.category === slug);
              return (
                <div key={slug}>
                  <h3 className="font-extrabold text-charcoal mb-2">
                    <Link href={`/category/${slug}`} className="hover:text-blush-dark">
                      {CATEGORY_LABELS[slug] ?? slug}
                    </Link>
                  </h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {list.map((p) => (
                      <li key={p.id}>
                        <Link href={`/product/${p.slug}`} className="hover:text-charcoal">{p.name}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      </AppShell>
    </>
  );
}
