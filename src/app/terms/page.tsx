import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/site/page-shell";
import { SITE_NAME, SITE_URL, jsonLd } from "@/lib/site";

export const metadata: Metadata = {
  title: "قوانین و مقررات استفاده و خرید",
  description: "شرایط ثبت سفارش، قیمت‌ها، تحویل، لغو و ضمانت تازگی و مسئولیت‌ها در فروشگاه گلستان حافظ.",
  alternates: { canonical: "/terms" },
  openGraph: { type: "website", url: "/terms", title: `قوانین و مقررات | ${SITE_NAME}`, locale: "fa_IR" },
};

export default function Terms() {
  const schema = { "@context": "https://schema.org", "@type": "WebPage", name: "قوانین و مقررات", url: `${SITE_URL}/terms`, inLanguage: "fa-IR" };
  return (
    <PageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <nav aria-label="مسیر صفحه" className="text-xs text-muted-foreground mb-6 flex gap-2">
          <Link href="/" className="hover:text-charcoal">خانه</Link><span>/</span><span className="text-charcoal font-bold">قوانین و مقررات</span>
        </nav>
        <h1 className="text-2xl md:text-4xl font-extrabold leading-[1.5]">قوانین و مقررات</h1>
        <p className="mt-4 leading-9 text-charcoal/85">با ثبت سفارش یا ساخت حساب در گلستان حافظ، موارد زیر را می‌پذیرید.</p>
        <ol className="mt-6 space-y-5 leading-9 text-charcoal/85 list-decimal pr-5">
          <li><strong>قیمت‌ها:</strong> قیمت‌ها به تومان و بر اساس زمان نمایش در سایت هستند و ممکن است تغییر کنند. مبلغ نهایی، شامل هزینه‌ی ارسال و تخفیف، پیش از پرداخت نمایش داده می‌شود.</li>
          <li><strong>ثبت سفارش:</strong> صحت نشانی، شماره‌ی تماس و زمان تحویل بر عهده‌ی ثبت‌کننده‌ی سفارش است. گل‌ها طبیعی هستند و ممکن است جزئیات رنگ و فرم آن‌ها اندکی با تصویر نمونه تفاوت داشته باشد.</li>
          <li><strong>موجودی:</strong> در صورت تمام‌شدن موجودی یکی از اقلام پس از ثبت سفارش، با شما تماس می‌گیریم تا جایگزین یا بازگشت وجه را هماهنگ کنیم.</li>
          <li><strong>تحویل:</strong> تحویل در محدوده‌ی تهران و در بازه‌ی انتخابی شما انجام می‌شود. جزئیات در صفحه‌ی <Link href="/shipping-returns" className="underline underline-offset-4">ارسال و بازگشت</Link> آمده است.</li>
          <li><strong>لغو و بازگشت وجه:</strong> سفارش تا پیش از آغاز آماده‌سازی قابل لغو است. بازگشت وجه کیف پول بلافاصله و پرداخت اینترنتی تا ۷۲ ساعت انجام می‌شود.</li>
          <li><strong>ضمانت تازگی:</strong> اگر گل دریافتی تا ۷ روز پژمرده یا آسیب‌دیده بود، با ارسال تصویر برای پشتیبانی، محصول هم‌ارزش ارسال یا مبلغ بازگردانده می‌شود.</li>
          <li><strong>کدهای تخفیف:</strong> هر کد شرایط و تاریخ انقضای خود را دارد و قابل تبدیل به وجه نقد نیست.</li>
          <li><strong>حساب کاربری:</strong> نگهداری از رمز عبور بر عهده‌ی کاربر است. در صورت سوءاستفاده از سایت، دسترسی حساب ممکن است محدود شود.</li>
          <li><strong>حریم خصوصی:</strong> نحوه‌ی نگهداری اطلاعات شما در صفحه‌ی <Link href="/privacy" className="underline underline-offset-4">حریم خصوصی</Link> توضیح داده شده است.</li>
        </ol>
        <p className="mt-8 text-sm text-muted-foreground">برای هر سوال، از <Link href="/contact" className="underline underline-offset-4">صفحه‌ی تماس</Link> با ما در ارتباط باشید.</p>
      </div>
    </PageShell>
  );
}
