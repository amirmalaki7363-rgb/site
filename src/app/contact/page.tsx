import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/site/page-shell";
import { BUSINESS, SITE_NAME, SITE_URL, jsonLd } from "@/lib/site";
import { getPublicSettings } from "@/lib/catalog";
import { WHATSAPP_LINK, WHATSAPP_NUMBER } from "@/lib/shop-options";

export const revalidate = 600;

export const metadata: Metadata = {
  title: { absolute: "تماس با گلستان حافظ؛ تلفن، واتس‌آپ و آدرس" },
  description: "راه‌های ارتباط با گلستان حافظ: تلفن، واتس‌آپ، اینستاگرام و نشانی در تهران. ثبت سفارش و مشاوره‌ی انتخاب گل.",
  alternates: { canonical: "/contact" },
  openGraph: { type: "website", url: "/contact", title: `تماس با ${SITE_NAME}`, locale: "fa_IR" },
};

export default async function Contact() {
  const s = await getPublicSettings();
  const schema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: `تماس با ${SITE_NAME}`,
    url: `${SITE_URL}/contact`,
    inLanguage: "fa-IR",
    about: { "@id": `${SITE_URL}/#business` },
  };
  return (
    <PageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <nav aria-label="مسیر صفحه" className="text-xs text-muted-foreground mb-6 flex gap-2">
          <Link href="/" className="hover:text-charcoal">خانه</Link><span>/</span><span className="text-charcoal font-bold">تماس با ما</span>
        </nav>
        <h1 className="text-2xl md:text-4xl font-extrabold leading-[1.5]">تماس با گلستان حافظ</h1>
        <p className="mt-4 leading-9 text-charcoal/85">برای ثبت سفارش، مشاوره‌ی انتخاب گل یا پیگیری سفارش با ما در ارتباط باشید.</p>
        <address className="not-italic mt-6 space-y-3 leading-8">
          <p><strong>نشانی:</strong> {s.address}</p>
          <p><strong>تلفن:</strong> <a href={`tel:${BUSINESS.phone}`} dir="ltr" className="underline underline-offset-4">{s.phone}</a></p>
          <p><strong>واتس‌آپ:</strong> <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">{WHATSAPP_NUMBER}</a></p>
          <p><strong>اینستاگرام:</strong> <a href={BUSINESS.instagram} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">GolestaneHafez</a></p>
          <p><strong>ساعات کاری:</strong> {s.hours}</p>
        </address>
        <p className="mt-8 text-sm">شرایط تحویل و ضمانت تازگی: <Link href="/shipping-returns" className="underline underline-offset-4">ارسال و بازگشت</Link>.</p>
      </div>
    </PageShell>
  );
}
