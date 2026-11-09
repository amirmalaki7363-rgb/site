"use client";

import { useState } from "react";
import { BookOpen, Clock, X } from "lucide-react";
import { ARTICLES, type Article } from "@/lib/articles";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

export default function Blog() {
  const [reading, setReading] = useState<Article | null>(null);

  return (
    <section id="blog" className="py-16 md:py-24 px-4 bg-white scroll-mt-16">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-bold tracking-widest text-sage-dark bg-sage-soft px-4 py-1.5 rounded-full inline-block">
            مجله گلستان
          </span>
          <h2 className="mt-4 text-2xl md:text-4xl font-extrabold text-charcoal">
            دانستنی‌های دنیای گل
          </h2>
          <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-2xl mx-auto leading-7">
            از رازهای مراقبت تا زبان رمزآلود گل‌ها؛ اینجا هر هفته چیزی برای دوست‌داران گل می‌نویسیم.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {ARTICLES.map((a) => (
            <article
              key={a.id}
              className="group bg-cream rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col cursor-pointer"
              onClick={() => setReading(a)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setReading(a)}
              aria-label={`مطالعه مقاله: ${a.title}`}
            >
              <div className="relative h-36 bg-gradient-to-bl from-blush-soft via-cream to-sage-soft grid place-items-center">
                <span className="text-5xl drop-shadow-sm transition-transform duration-500 group-hover:scale-125 group-hover:rotate-6">
                  {a.emoji}
                </span>
                <span className="absolute top-3 right-3 text-[10px] font-bold bg-white/90 backdrop-blur px-2.5 py-1 rounded-full text-charcoal shadow-sm">
                  {a.tag}
                </span>
              </div>
              <div className="p-5 flex flex-col gap-2 flex-1">
                <h3 className="font-extrabold text-sm text-charcoal leading-6 group-hover:text-gold-dark transition-colors">
                  <a href={`/blog/${a.id}`} onClick={(e) => e.preventDefault()}>{a.title}</a>
                </h3>
                <p className="text-xs text-muted-foreground leading-6 flex-1">{a.excerpt}</p>
                <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold">
                  <Clock className="size-3.5" />
                  {a.minutes} دقیقه مطالعه
                  <BookOpen className="size-3.5 mr-auto text-blush-dark" />
                </p>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-8 text-center">
          <a href="/blog" className="text-sm font-bold text-charcoal underline underline-offset-4 hover:text-blush-dark">
            مشاهده همه مقاله‌های مجله گلستان
          </a>
        </p>
      </div>

      {/* reading dialog */}
      <Dialog open={!!reading} onOpenChange={(v) => !v && setReading(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl bg-cream" aria-describedby={undefined}>
          {reading && (
            <>
              <div className="relative h-40 bg-gradient-to-bl from-blush-soft via-cream to-sage-soft grid place-items-center rounded-t-3xl -mx-6 -mt-6">
                <span className="text-6xl">{reading.emoji}</span>
                <span className="absolute top-4 right-4 text-[10px] font-bold bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-charcoal shadow-sm">
                  {reading.tag} • {reading.minutes} دقیقه مطالعه
                </span>
                <button
                  onClick={() => setReading(null)}
                  className="absolute top-4 left-4 grid place-items-center size-8 rounded-full bg-white/90 backdrop-blur shadow-sm hover:bg-white transition-colors"
                  aria-label="بستن مقاله"
                >
                  <X className="size-4" />
                </button>
              </div>
              <DialogHeader className="pt-4 space-y-2">
                <DialogTitle className="text-xl md:text-2xl font-extrabold text-charcoal text-right leading-9">
                  {reading.title}
                </DialogTitle>
                <DialogDescription className="text-right text-sm leading-7 text-charcoal/70">
                  {reading.excerpt}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pb-4">
                {reading.content.map((para, i) => (
                  <p key={i} className="text-sm leading-8 text-charcoal/80 text-justify">
                    {para}
                  </p>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
