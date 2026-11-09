import Link from "next/link";
import { BUSINESS, CATEGORY_SEO, SITE_NAME } from "@/lib/site";
import { CATEGORY_LABELS } from "@/lib/types";
import { WHATSAPP_LINK, WHATSAPP_NUMBER } from "@/lib/shop-options";

/** Lightweight server-rendered chrome for the standalone SEO pages (product, category, blog, info). */
export default function PageShell({ children }: { children: React.ReactNode }) {
  const cats = Object.keys(CATEGORY_SEO);
  return (
    <div className="min-h-screen flex flex-col bg-cream text-charcoal">
      <header className="bg-white/90 backdrop-blur border-b border-border sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link href="/" className="text-lg font-extrabold">{SITE_NAME}</Link>
          <nav aria-label="منوی اصلی" className="flex flex-wrap gap-x-5 gap-y-1 text-sm font-semibold text-charcoal/80">
            {cats.map((c) => (
              <Link key={c} href={`/category/${c}`} className="hover:text-blush-dark">{CATEGORY_LABELS[c] ?? c}</Link>
            ))}
            <Link href="/blog" className="hover:text-blush-dark">مجله</Link>
            <Link href="/about" className="hover:text-blush-dark">درباره ما</Link>
            <Link href="/contact" className="hover:text-blush-dark">تماس</Link>
          </nav>
        </div>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="bg-charcoal text-white/80 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-10 grid gap-8 md:grid-cols-3 text-sm">
          <div>
            <p className="text-white font-extrabold text-base mb-2">{SITE_NAME}</p>
            <p className="leading-7">فروشگاه آنلاین گل و گیاه با تحویل در تهران؛ انتخاب روز و ساعت تحویل، کارت پیام رایگان.</p>
          </div>
          <div>
            <p className="text-white font-bold mb-2">دسترسی سریع</p>
            <ul className="space-y-1.5">
              {cats.map((c) => (
                <li key={c}><Link href={`/category/${c}`} className="hover:text-white">{CATEGORY_LABELS[c] ?? c}</Link></li>
              ))}
              <li><Link href="/blog" className="hover:text-white">مجله گلستان</Link></li>
              <li><Link href="/shipping-returns" className="hover:text-white">ارسال و بازگشت</Link></li>
              <li><Link href="/about" className="hover:text-white">درباره ما</Link></li>
              <li><Link href="/contact" className="hover:text-white">تماس با ما</Link></li>
              <li><Link href="/terms" className="hover:text-white">قوانین و مقررات</Link></li>
              <li><Link href="/privacy" className="hover:text-white">حریم خصوصی</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-white font-bold mb-2">تماس</p>
            <address className="not-italic space-y-1.5 leading-7">
              <p>{BUSINESS.city}، {BUSINESS.streetAddress}</p>
              <p><a href={`tel:${BUSINESS.phone}`} className="hover:text-white" dir="ltr">{BUSINESS.displayPhone}</a></p>
              <p><a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="hover:text-white">واتس‌آپ {WHATSAPP_NUMBER}</a></p>
              <p><a href={BUSINESS.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-white">اینستاگرام</a></p>
            </address>
          </div>
        </div>
      </footer>
    </div>
  );
}
