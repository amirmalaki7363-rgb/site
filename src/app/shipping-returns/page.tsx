import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/site/page-shell";
import { COMMON_FAQ, SITE_NAME, SITE_URL, faPrice, jsonLd } from "@/lib/site";
import { getPublicSettings } from "@/lib/catalog";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "ارسال، تحویل و ضمانت تازگی گل",
  description: "شرایط ارسال گل در تهران، بازه‌های تحویل، هزینه‌ی ارسال، لغو سفارش و ضمانت ۷ روزه‌ی تازگی در گلستان حافظ.",
  alternates: { canonical: "/shipping-returns" },
  openGraph: { type: "website", url: "/shipping-returns", title: `ارسال و بازگشت | ${SITE_NAME}`, locale: "fa_IR" },
};

export default async function ShippingReturns() {
  const s = await getPublicSettings();
  const faq = COMMON_FAQ();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "خانه", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "ارسال و بازگشت", item: `${SITE_URL}/shipping-returns` },
        ],
      },
    ],
  };
  return (
    <PageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <nav aria-label="مسیر صفحه" className="text-xs text-muted-foreground mb-6 flex gap-2">
          <Link href="/" className="hover:text-charcoal">خانه</Link><span>/</span><span className="text-charcoal font-bold">ارسال و بازگشت</span>
        </nav>
        <h1 className="text-2xl md:text-4xl font-extrabold leading-[1.5]">ارسال، تحویل و ضمانت تازگی</h1>

        <h2 className="mt-8 text-xl font-extrabold">محدوده و زمان تحویل</h2>
        <p className="mt-3 leading-9 text-charcoal/85">سفارش‌ها در تهران و در محل انتخابی شما تحویل داده می‌شوند. هنگام ثبت سفارش، روز تحویل را از ۷ روز آینده انتخاب می‌کنید و یکی از بازه‌های ساعتی ۹ تا ۱۲، ۱۲ تا ۱۵، ۱۵ تا ۱۸ یا ۱۸ تا ۲۱ را برمی‌گزینید. ساعات کاری: {s.hours}.</p>

        <h2 className="mt-8 text-xl font-extrabold">هزینه‌ی ارسال</h2>
        <p className="mt-3 leading-9 text-charcoal/85">
          هزینه‌ی ارسال هر سفارش {faPrice(s.shippingFee)} تومان است
          {s.freeShippingMin > 0 ? ` و برای سفارش‌های بالای ${faPrice(s.freeShippingMin)} تومان رایگان است` : ""}. مبلغ نهایی پیش از پرداخت در مرحله‌ی تسویه‌حساب نمایش داده می‌شود.
        </p>

        <h2 className="mt-8 text-xl font-extrabold">پرداخت</h2>
        <p className="mt-3 leading-9 text-charcoal/85">در مرحله‌ی تسویه‌حساب می‌توانید از پرداخت اینترنتی، کیف پول یا پرداخت در محل (در صورت فعال بودن) استفاده کنید. اطلاعات کارت بانکی شما نزد ما ذخیره نمی‌شود.</p>

        <h2 className="mt-8 text-xl font-extrabold">لغو سفارش</h2>
        <p className="mt-3 leading-9 text-charcoal/85">تا پیش از آغاز آماده‌سازی می‌توانید سفارش را از «سفارش‌های من» لغو کنید. برای سفارش‌های پرداخت‌شده با کیف پول، مبلغ بلافاصله به کیف پول برمی‌گردد؛ برای پرداخت اینترنتی بازگشت وجه تا ۷۲ ساعت طول می‌کشد.</p>

        <h2 className="mt-8 text-xl font-extrabold">ضمانت تازگی</h2>
        <p className="mt-3 leading-9 text-charcoal/85">اگر گل دریافتی تا ۷ روز پژمرده یا آسیب‌دیده بود، تصویری از آن را برای پشتیبانی بفرستید؛ محصول هم‌ارزش برایتان ارسال می‌شود یا مبلغ بازگردانده می‌شود.</p>

        <h2 className="mt-10 text-xl font-extrabold">سوالات متداول</h2>
        <dl className="mt-3 space-y-5">
          {faq.map((f) => (
            <div key={f.q}><dt className="font-bold">{f.q}</dt><dd className="mt-1 leading-8 text-charcoal/80">{f.a}</dd></div>
          ))}
        </dl>
      </div>
    </PageShell>
  );
}
