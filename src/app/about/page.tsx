import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/site/page-shell";
import { CATEGORY_SEO, SITE_NAME, SITE_URL, jsonLd } from "@/lib/site";
import { CATEGORY_LABELS } from "@/lib/types";

export const metadata: Metadata = {
  title: { absolute: "درباره گلستان حافظ؛ داستان ما" },
  description: "با گلستان حافظ، فروشگاه آنلاین گل و گیاه در تهران آشنا شوید: انتخاب روزانه‌ی گل تازه، چیدن دست‌ساز و تحویل در زمان دلخواه شما.",
  alternates: { canonical: "/about" },
  openGraph: { type: "website", url: "/about", title: `درباره ${SITE_NAME}`, locale: "fa_IR" },
};

export default function About() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: `درباره ${SITE_NAME}`,
    url: `${SITE_URL}/about`,
    inLanguage: "fa-IR",
    about: { "@id": `${SITE_URL}/#business` },
  };
  return (
    <PageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <nav aria-label="مسیر صفحه" className="text-xs text-muted-foreground mb-6 flex gap-2">
          <Link href="/" className="hover:text-charcoal">خانه</Link><span>/</span><span className="text-charcoal font-bold">درباره ما</span>
        </nav>
        <h1 className="text-2xl md:text-4xl font-extrabold leading-[1.5]">درباره گلستان حافظ</h1>
        <div className="mt-6 space-y-5 leading-9 text-charcoal/85">
          <p>داستان ما با یک گلابِ کوچک در حیاط خانه‌ای قدیمی در شیراز آغاز شد؛ جایی که یاد گرفتیم گل را با دست چیدن و با دل هدیه دادن. گلستان حافظ با تکیه بر همین سنت، گل‌ها را انتخاب می‌کند، در کارگاه خود دسته می‌چیند و به دست عزیزانتان می‌رساند.</p>
          <p>برای ما هر سفارش فقط یک خرید نیست؛ نامه‌ای است که شما با زبان گل برای کسی می‌فرستید. به همین دلیل کارت پیام شخصی رایگان است و روز و ساعت تحویل را خودتان انتخاب می‌کنید.</p>
        </div>
        <h2 className="mt-10 text-xl font-extrabold">چه چیزهایی عرضه می‌کنیم؟</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 text-sm">
          {Object.keys(CATEGORY_SEO).map((c) => (
            <li key={c}><Link href={`/category/${c}`} className="underline underline-offset-4 hover:text-blush-dark">{CATEGORY_LABELS[c]}</Link> — {CATEGORY_SEO[c].description}</li>
          ))}
        </ul>
        <p className="mt-8 text-sm">شرایط ارسال و ضمانت تازگی را در صفحه‌ی <Link href="/shipping-returns" className="underline underline-offset-4">ارسال و بازگشت</Link> ببینید یا از طریق <Link href="/contact" className="underline underline-offset-4">صفحه‌ی تماس</Link> با ما در ارتباط باشید.</p>
      </div>
    </PageShell>
  );
}
