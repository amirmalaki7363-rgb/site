"use client";

import Image from "next/image";
import { Flower2, Truck, Sparkles, ShieldCheck, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const PETALS = Array.from({ length: 14 }, (_, i) => ({
  left: `${(i * 7 + 4) % 96}%`,
  size: 8 + ((i * 5) % 10),
  duration: 9 + (i % 5) * 2.2,
  delay: (i * 1.3) % 9,
}));

export default function Hero() {
  return (
    <section id="home" className="relative overflow-hidden pt-28 md:pt-36 pb-16 md:pb-24 bg-gradient-to-bl from-blush-soft via-cream to-cream">
      {/* falling petals */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {PETALS.map((p, i) => (
          <span
            key={i}
            className="petal"
            style={{
              left: p.left,
              width: p.size,
              height: p.size,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      {/* decorative blobs */}
      <div className="absolute -top-24 -right-24 size-72 rounded-full bg-blush/30 blur-3xl" aria-hidden="true" />
      <div className="absolute bottom-0 -left-32 size-96 rounded-full bg-sage/25 blur-3xl" aria-hidden="true" />

      <div className="relative max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        {/* text */}
        <div className="text-center lg:text-right">
          <span className="inline-flex items-center gap-1.5 bg-white/80 backdrop-blur px-4 py-1.5 rounded-full text-xs font-semibold text-charcoal shadow-sm border border-blush/40">
            <Sparkles className="size-3.5 text-gold" />
            تازه‌ترین گل‌های روز، هر صبح از بازار گل تهران
          </span>

          <h1 className="mt-5 text-4xl md:text-6xl font-extrabold leading-[1.25] text-charcoal">
            گلستان حافظ
            <span className="block mt-3 text-2xl md:text-4xl font-bold text-blush-dark">
              جایی که گل، زبانِ دل می‌شود
            </span>
          </h1>

          <p className="mt-6 text-base md:text-lg text-charcoal/70 leading-8 max-w-xl mx-auto lg:mx-0">
            از دسته‌گل‌های رمانتیک تا باکس‌های لوکس و گیاهان آپارتمانی خاص؛ هر سفارش
            با عشق چیده می‌شود، با سلیقه بسته‌بندی می‌گردد و در همان روز به آغوش
            دوست‌داشتنی‌هایتان می‌رسد.
          </p>

          <blockquote className="mt-6 inline-block bg-white/70 backdrop-blur border-r-4 border-gold rounded-l-2xl rounded-r-none px-5 py-3 text-sm md:text-base text-charcoal/80 italic leading-8 shadow-sm">
            «بگذار عشق را نقشِ جهان کنیم، و بر این خاکِ بی‌گل، گلستان کنیم»
            <span className="block text-xs mt-1 not-italic text-muted-foreground">— حافظ</span>
          </blockquote>

          <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-3">
            <a href="#products">
              <Button className="rounded-full bg-blush text-charcoal hover:bg-blush-dark hover:text-white font-bold h-12 px-7 shadow-lg shadow-blush/40 text-base">
                <Flower2 className="size-5" />
                مشاهده محصولات
              </Button>
            </a>
            <a href="#occasions">
              <Button
                variant="outline"
                className="rounded-full border-2 border-charcoal/15 bg-white/60 backdrop-blur hover:bg-white text-charcoal font-bold h-12 px-7 text-base"
              >
                <Truck className="size-5 text-sage-dark" />
                گل برای مناسبت‌ها
              </Button>
            </a>
          </div>

          <div className="mt-8 flex items-center justify-center lg:justify-start gap-6 text-xs md:text-sm text-charcoal/70">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-sage-dark" />
              ضمانت تازگی ۷ روزه
            </span>
            <span className="flex items-center gap-1.5">
              <Truck className="size-4 text-sage-dark" />
              تحویل در محل انتخابی شما در همان روز
            </span>
          </div>
        </div>

        {/* image */}
        <div className="relative mx-auto w-full max-w-md lg:max-w-lg">
          <div className="absolute inset-6 rounded-[3rem] bg-blush/40 rotate-6 scale-105" aria-hidden="true" />
          <div className="relative rounded-[3rem] overflow-hidden shadow-2xl shadow-blush/30 border-8 border-white aspect-[4/5]">
            <Image
              src="/images/hero-1.jpg"
              alt="دسته‌گل صورتی لوکس گلستان حافظ"
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 90vw, 45vw"
            />
            {/* floating card */}
            <div className="absolute bottom-4 right-4 left-4 bg-white/90 backdrop-blur rounded-2xl p-3.5 flex items-center gap-3 shadow-lg animate-floaty">
              <span className="grid place-items-center size-11 rounded-xl bg-sage-soft text-sage-dark shrink-0">
                <Truck className="size-6" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-charcoal">تحویل در محل انتخابی شما</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  در روز و ساعت انتخابی شما
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <a
        href="#categories"
        className="absolute bottom-4 left-1/2 -translate-x-1/2 hidden md:grid place-items-center size-10 rounded-full bg-white/70 backdrop-blur text-charcoal/60 hover:text-charcoal transition-colors"
        aria-label="اسکرول به پایین"
      >
        <ArrowDown className="size-5 animate-bounce" />
      </a>
    </section>
  );
}
