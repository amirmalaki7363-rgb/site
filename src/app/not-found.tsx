import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/site/page-shell";

export const metadata: Metadata = { title: "صفحه پیدا نشد", robots: { index: false, follow: true } };

export default function NotFound() {
  return (
    <PageShell>
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-extrabold">۴۰۴ — این صفحه پیدا نشد</h1>
        <p className="mt-4 leading-8 text-charcoal/80">آدرس را اشتباه وارد کرده‌اید یا صفحه جابه‌جا شده است. از لینک‌های زیر ادامه دهید.</p>
        <p className="mt-6 flex flex-wrap justify-center gap-4 text-sm font-bold">
          <Link href="/" className="underline underline-offset-4">صفحه اصلی</Link>
          <Link href="/category/bouquet" className="underline underline-offset-4">دسته‌گل</Link>
          <Link href="/blog" className="underline underline-offset-4">مجله گلستان</Link>
        </p>
      </div>
    </PageShell>
  );
}
