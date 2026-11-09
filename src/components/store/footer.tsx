"use client";

import { useState } from "react";
import { Flower2, Instagram, Send, MessageCircle, PackageSearch, UserRound, LayoutDashboard } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useView } from "@/lib/panel-store";
import { WHATSAPP_NUMBER, WHATSAPP_LINK, INSTAGRAM_LINK, INSTAGRAM_HANDLE } from "@/lib/shop-options";

const SHOP_LINKS = [
  { label: "دسته‌گل", href: "/category/bouquet" },
  { label: "باکس گل", href: "/category/box" },
  { label: "گیاه آپارتمانی", href: "/category/plant" },
  { label: "گل‌های فصلی", href: "/category/seasonal" },
  { label: "گل خشک", href: "/category/dried" },
  { label: "خدمات ویژه", href: "#services" },
];
const GUIDE_LINKS = [
  { label: "سوالات متداول", href: "#faq" },
  { label: "مجله گلستان", href: "/blog" },
  { label: "رهگیری سفارش", href: "#tracking" },
  { label: "فال حافظ", href: "#hafez" },
  { label: "درباره ما", href: "/about" },
  { label: "ارسال و بازگشت", href: "/shipping-returns" },
  { label: "تماس با ما", href: "/contact" },
  { label: "قوانین و مقررات", href: "/terms" },
  { label: "حریم خصوصی", href: "/privacy" },
];

export default function Footer() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const setView = useView((s) => s.setView);

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || !d.success) {
        toast({ title: "ثبت عضویت انجام نشد", description: d.error ?? "دوباره تلاش کنید.", variant: "destructive" });
        return;
      }
      setEmail("");
      toast({
        title: "عضویت شما ثبت شد! 🌸",
        description: "از این پس تخفیف‌های فصلی و گل‌های تازه‌رسیده را زودتر از همه می‌بینید.",
      });
    } catch {
      toast({ title: "ارتباط با سرور برقرار نشد", description: "دوباره تلاش کنید.", variant: "destructive" });
    }
  }

  function openTracking() {
    window.dispatchEvent(new CustomEvent("gh:open-tracking"));
  }

  return (
    <footer id="contact" className="bg-charcoal text-white/80 mt-auto scroll-mt-20">
      {/* newsletter */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="relative -translate-y-12 bg-gradient-to-l from-blush to-blush-soft rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-blush/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-right">
            <h3 className="text-xl md:text-2xl font-extrabold text-charcoal">
              عضو گلستان‌داران شوید!
            </h3>
            <p className="mt-2 text-sm text-charcoal/70 leading-7 max-w-md">
              اولین نفری باشید که از تخفیف‌های فصلی، گل‌های تازه‌رسیده و
              پیشنهادهای ویژه باخبر می‌شود.
            </p>
          </div>
          <form className="flex w-full max-w-md gap-2" onSubmit={subscribe}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ایمیل شما..."
              dir="ltr"
              className="flex-1 h-12 rounded-full bg-white px-5 text-sm text-charcoal placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-gold/60"
              aria-label="ایمیل برای عضویت در خبرنامه"
            />
            <button
              type="submit"
              className="h-12 px-6 rounded-full bg-charcoal text-white text-sm font-bold hover:bg-charcoal/85 transition-colors shrink-0"
            >
              عضویت
            </button>
          </form>
        </div>
      </div>

      {/* main footer */}
      <div className="max-w-7xl mx-auto px-4 pb-8 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid place-items-center size-10 rounded-2xl bg-blush text-charcoal">
              <Flower2 className="size-6" />
            </span>
            <span>
              <span className="block font-extrabold text-lg text-white">گلستان حافظ</span>
              <span className="block text-[10px] text-white/50">گل، شعر و عشق در هر سفارش</span>
            </span>
          </div>
          <p className="mt-4 text-sm leading-7 text-white/60">
            گلستان حافظ، فروشگاه آنلاین گل و گیاه با بیش از ۱۵ سال سابقه در چیدن
            دسته‌گل‌های تازه و تحویل در محل انتخابی شما در تهران. هر بوت ما، امضای یک گل‌آرای
            حرفه‌ای را دارد.
          </p>
          <div className="mt-5 flex items-center gap-2">
            {[
              { icon: Instagram, label: "اینستاگرام گلستان حافظ", href: INSTAGRAM_LINK },
              { icon: MessageCircle, label: "واتساپ گلستان حافظ", href: WHATSAPP_LINK },
            ].map((s) => (
              <a
                key={s.label}
                href={s.href}
                target={s.href !== "#" ? "_blank" : undefined}
                rel={s.href !== "#" ? "noopener noreferrer" : undefined}
                title={s.label.includes("واتساپ") ? `ثبت سفارش در واتس‌آپ — ${WHATSAPP_NUMBER}` : s.label}
                aria-label={s.label}
                className="grid place-items-center size-10 rounded-full bg-white/10 hover:bg-blush hover:text-charcoal transition-colors"
              >
                <s.icon className="size-5" />
              </a>
            ))}
          </div>
        </div>

        <nav aria-label="دسترسی سریع فروشگاه">
          <h4 className="font-extrabold text-white mb-4">دسترسی سریع</h4>
          <ul className="space-y-2.5 text-sm">
            {SHOP_LINKS.map((l) => (
              <li key={l.label}>
                <a href={l.href} className="text-white/60 hover:text-blush transition-colors">
                  {l.label}
                </a>
              </li>
            ))}
            <li>
              <button
                onClick={() => setView("user")}
                className="flex items-center gap-1.5 text-white/60 hover:text-blush transition-colors"
              >
                <UserRound className="size-4" />
                پنل کاربری
              </button>
            </li>
            <li>
              <button
                onClick={() => setView("admin")}
                className="flex items-center gap-1.5 text-white/60 hover:text-blush transition-colors"
              >
                <LayoutDashboard className="size-4" />
                پنل مدیریت
              </button>
            </li>
          </ul>
        </nav>

        <nav aria-label="راهنمای مشتریان">
          <h4 className="font-extrabold text-white mb-4">راهنمای مشتریان</h4>
          <ul className="space-y-2.5 text-sm">
            {GUIDE_LINKS.map((l) =>
              l.href === "#tracking" ? (
                <li key={l.label}>
                  <button
                    onClick={openTracking}
                    className="flex items-center gap-1.5 text-white/60 hover:text-blush transition-colors"
                  >
                    <PackageSearch className="size-4" />
                    {l.label}
                  </button>
                </li>
              ) : (
                <li key={l.label}>
                  <a href={l.href} className="text-white/60 hover:text-blush transition-colors">
                    {l.label}
                  </a>
                </li>
              )
            )}
          </ul>
        </nav>

        <div>
          <h4 className="font-extrabold text-white mb-4">تماس با ما</h4>
          <ul className="space-y-3.5 text-sm text-white/60">
            <li className="flex items-center gap-2.5">
              <MessageCircle className="size-5 text-blush shrink-0" />
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                dir="ltr"
                className="hover:text-blush transition-colors"
                title={`ثبت سفارش در واتس‌آپ — ${WHATSAPP_NUMBER}`}
              >
                {WHATSAPP_NUMBER}
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Instagram className="size-5 text-blush shrink-0" />
              <a
                href={INSTAGRAM_LINK}
                target="_blank"
                rel="noopener noreferrer"
                dir="ltr"
                className="hover:text-blush transition-colors"
                title="اینستاگرام گلستان حافظ"
              >
                {INSTAGRAM_HANDLE}
              </a>
            </li>
          </ul>
          <div className="mt-5 flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
            <span className="grid place-items-center size-9 rounded-xl bg-gold/20 text-gold">
              <Flower2 className="size-5" />
            </span>
            <p className="text-[11px] leading-5 text-white/50">
              عضو اتحادیه گل‌فروشان تهران
              <br />
              ضمانت تازگی و بازگشت ۷ روزه
            </p>
          </div>
        </div>
      </div>

      <Separator className="bg-white/10" />

      <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-white/40">
        <p>© ۱۴۰۴ گلستان حافظ — تمامی حقوق محفوظ است.</p>
        <p>
          ساخته‌شده با <span className="text-blush">♥</span> برای عاشقان گل و شعر حافظ
        </p>
      </div>
    </footer>
  );
}
