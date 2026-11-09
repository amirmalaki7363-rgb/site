import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/site/page-shell";
import { BUSINESS, SITE_NAME, SITE_URL, jsonLd } from "@/lib/site";

export const metadata: Metadata = {
  title: "حریم خصوصی و حفاظت از اطلاعات کاربران",
  description: "گلستان حافظ چه اطلاعاتی از شما نگه می‌دارد، چرا و چگونه از آن محافظت می‌کند؛ کوکی‌ها، پرداخت و درخواست حذف اطلاعات.",
  alternates: { canonical: "/privacy" },
  openGraph: { type: "website", url: "/privacy", title: `حریم خصوصی | ${SITE_NAME}`, locale: "fa_IR" },
};

export default function Privacy() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "حریم خصوصی",
    url: `${SITE_URL}/privacy`,
    inLanguage: "fa-IR",
  };
  return (
    <PageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <nav aria-label="مسیر صفحه" className="text-xs text-muted-foreground mb-6 flex gap-2">
          <Link href="/" className="hover:text-charcoal">خانه</Link><span>/</span><span className="text-charcoal font-bold">حریم خصوصی</span>
        </nav>
        <h1 className="text-2xl md:text-4xl font-extrabold leading-[1.5]">حریم خصوصی</h1>
        <div className="mt-6 space-y-6 leading-9 text-charcoal/85">
          <section>
            <h2 className="text-xl font-extrabold mb-2">چه اطلاعاتی نگه می‌داریم؟</h2>
            <ul className="list-disc pr-5 space-y-1">
              <li>هنگام ساخت حساب: نام، شماره موبایل و در صورت تمایل ایمیل.</li>
              <li>هنگام سفارش: نام و شماره‌ی گیرنده، نشانی تحویل، متن کارت پیام و جزئیات سفارش.</li>
              <li>در بخش‌های دیگر سایت: نظرها، تیکت‌های پشتیبانی و در صورت عضویت، ایمیل خبرنامه.</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-extrabold mb-2">اطلاعات پرداخت</h2>
            <p>پرداخت اینترنتی از طریق درگاه بانکی انجام می‌شود و شماره کارت، رمز یا CVV شما نزد ما ذخیره نمی‌شود. فقط وضعیت پرداخت و شماره‌ی پیگیری تراکنش را نگه می‌داریم.</p>
          </section>
          <section>
            <h2 className="text-xl font-extrabold mb-2">رمز عبور</h2>
            <p>رمز عبور شما به‌صورت رمزنگاری‌شده (هش) ذخیره می‌شود و برای ما قابل خواندن نیست. پشتیبانی هرگز رمز شما را از شما نمی‌پرسد.</p>
          </section>
          <section>
            <h2 className="text-xl font-extrabold mb-2">کوکی‌ها</h2>
            <p>سایت از یک کوکی ضروری برای نگه داشتن ورود شما به حساب استفاده می‌کند. در حال حاضر از کوکی‌های تبلیغاتی یا ردیابی شخص‌ثالث استفاده نمی‌کنیم.</p>
          </section>
          <section>
            <h2 className="text-xl font-extrabold mb-2">استفاده از اطلاعات</h2>
            <p>اطلاعات شما فقط برای ثبت و ارسال سفارش، پشتیبانی، اعلان‌های مربوط به سفارش و (در صورت عضویت) ارسال خبرنامه استفاده می‌شود. اطلاعات شما فروخته نمی‌شود و فقط به اندازه‌ی لازم برای تحویل سفارش یا انجام پرداخت با طرف‌های مرتبط (مثل درگاه پرداخت) به اشتراک گذاشته می‌شود.</p>
          </section>
          <section>
            <h2 className="text-xl font-extrabold mb-2">اصلاح و حذف اطلاعات</h2>
            <p>می‌توانید اطلاعات حساب خود را از «حساب من» ویرایش کنید. برای حذف حساب یا لغو عضویت خبرنامه، با ما تماس بگیرید: <a href={`tel:${BUSINESS.phone}`} dir="ltr" className="underline underline-offset-4">{BUSINESS.displayPhone}</a> یا از <Link href="/contact" className="underline underline-offset-4">صفحه‌ی تماس</Link>.</p>
          </section>
        </div>
      </div>
    </PageShell>
  );
}
