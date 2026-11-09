"use client";

import { useEffect, useState } from "react";
import { Star, Quote } from "lucide-react";

interface PublicReview { id: string; author: string; rating: number; comment: string; productName: string }

export default function Testimonials() {
  const [reviews, setReviews] = useState<PublicReview[]>([]);

  useEffect(() => {
    let alive = true;
    fetch("/api/reviews")
      .then((r) => r.json())
      .then((d) => { if (alive && Array.isArray(d.reviews)) setReviews(d.reviews); })
      .catch(() => undefined);
    return () => { alive = false; };
  }, []);

  // Only genuine, moderator-approved customer reviews are shown; no reviews => no section.
  if (reviews.length === 0) return null;

  return (
    <section className="py-16 md:py-24 px-4 bg-cream">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-xs font-bold tracking-widest text-sage-dark bg-sage-soft px-4 py-1.5 rounded-full inline-block">
            رضایت مشتریان
          </span>
          <h2 className="mt-4 text-2xl md:text-4xl font-extrabold text-charcoal">
            نظر مشتریان درباره‌ی گلستان حافظ
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          {reviews.map((t) => (
            <figure
              key={t.id}
              className="relative bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl transition-shadow duration-300 flex flex-col gap-4"
            >
              <Quote className="absolute top-5 left-5 size-8 text-blush-soft" aria-hidden="true" />
              <div className="flex gap-0.5" aria-label={`امتیاز ${t.rating} از ۵`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`size-4 ${i < t.rating ? "fill-gold text-gold" : "text-cream-dark"}`} />
                ))}
              </div>
              <blockquote className="text-sm text-charcoal/75 leading-7 flex-1">«{t.comment}»</blockquote>
              <figcaption className="flex items-center gap-3 pt-2 border-t border-border/60">
                <span className="grid place-items-center size-11 rounded-full bg-blush-soft text-blush-dark font-extrabold">
                  {t.author.charAt(0)}
                </span>
                <span>
                  <span className="block text-sm font-bold text-charcoal">{t.author}</span>
                  <span className="block text-[11px] text-muted-foreground">خریدار «{t.productName}»</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
