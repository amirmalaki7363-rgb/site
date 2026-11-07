"use client";

import { Star, Quote } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "سارا محمدی",
    role: "مشتری همیشگی، تهران",
    text: "برای تولد همسرم باکس گل رز سفارش دادم؛ دقیقاً همان چیزی رسید که در عکس دیده بودم، حتی خوش‌عطرتر! بسته‌بندی‌شان واقعاً حرف ندارد.",
    rating: 5,
  },
  {
    name: "علی رضایی",
    role: "سفارش شرکتی، شیراز",
    text: "برای افتتاحیه فروشگاه‌مان ۲۰ سبد گل سفارش دادیم. همه سرِ وقت و با همان نظم رسید. قیمت منصفانه و کیفیت بالاتر از انتظار بود.",
    rating: 5,
  },
  {
    name: "مریم احمدی",
    role: "مشتری، اصفهان",
    text: "اولین بار بود آنلاین گل می‌خریدم و نگران بودم گل در راه خراب شود. نه‌تنها تازه بود، ارکیده را با یک کارت دست‌نویس هم فرستاده بودند. ممنونم!",
    rating: 4.5,
  },
];

export default function Testimonials() {
  return (
    <section className="py-16 md:py-24 px-4 bg-cream">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-xs font-bold tracking-widest text-sage-dark bg-sage-soft px-4 py-1.5 rounded-full inline-block">
            رضایت مشتریان
          </span>
          <h2 className="mt-4 text-2xl md:text-4xl font-extrabold text-charcoal">
            زبان گل، زبانِ مشتریان ما
          </h2>
          <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-2xl mx-auto leading-7">
            بیش از ۹,۰۰۰ مشتری وفادار به ما اعتماد کرده‌اند؛ این چند نفر از میان
            هزاران تجربه شیرین، گوشه‌ای از داستان را روایت می‌کنند.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.name}
              className="relative bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl transition-shadow duration-300 flex flex-col gap-4"
            >
              <Quote className="absolute top-5 left-5 size-8 text-blush-soft" aria-hidden="true" />
              <div className="flex gap-0.5" aria-label={`امتیاز ${t.rating} از ۵`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`size-4 ${
                      i < Math.floor(t.rating)
                        ? "fill-gold text-gold"
                        : i < t.rating
                        ? "fill-gold/50 text-gold"
                        : "text-cream-dark"
                    }`}
                  />
                ))}
              </div>
              <blockquote className="text-sm text-charcoal/75 leading-7 flex-1">
                «{t.text}»
              </blockquote>
              <figcaption className="flex items-center gap-3 pt-2 border-t border-border/60">
                <span className="grid place-items-center size-11 rounded-full bg-blush-soft text-blush-dark font-extrabold">
                  {t.name.charAt(0)}
                </span>
                <span>
                  <span className="block text-sm font-bold text-charcoal">{t.name}</span>
                  <span className="block text-[11px] text-muted-foreground">{t.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
