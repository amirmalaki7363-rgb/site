import AppShell from "@/components/app-shell";
import { BUSINESS, SITE_DESC, SITE_NAME, SITE_URL, absUrl, jsonLd } from "@/lib/site";

export const revalidate = 300;

export default function Home() {
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
      <AppShell />
    </>
  );
}
