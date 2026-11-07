"use client";

import { useState } from "react";
import { BookOpen, Sparkles, RotateCcw, MoonStar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";

const FALS = [
  {
    poem: "بگذار عشق را نقشِ جهان کنیم،\nو بر این خاکِ بی‌گل، گلستان کنیم",
    meaning:
      "زمانه در اختیار توست؛ با عشق و امید از آن گلستانی بساز. انتخاب تو است که سرنوشت را زیبا کند.",
  },
  {
    poem: "رسید مژده که ایامِ غمِ، نخواهد ماند\nچنان نماند چنین، هم بهارِ، خواهد ماند",
    meaning:
      "دوران سختی می‌گذرد و شادی در راه است. صبور باش؛ پس از هر زمستان، بهاری در انتظار توست.",
  },
  {
    poem: "سحرگه رهِ میخانه به گوشم زدند\nکه باده‌ای بده و دلِ خروشم زدند",
    meaning:
      "فرصتی تازه پیش روی توست؛ آن را با شادمانی و سبک‌دلی بپذیر و از گذشته ملالت نخور.",
  },
  {
    poem: "یاری در کس نمی‌بینیم یاران را\nچه شد که دوستی دنیا قراران را",
    meaning:
      "دوستی‌های صادقی را که داری قدر بدان و در حق کسانی که به تو بدی کردند، بزرگ‌وار بمان.",
  },
  {
    poem: "مژده ای دل که مسیحا نفسی می‌آید\nکه ز انفاسِ خوشش بویِ کسی می‌آید",
    meaning:
      "خبری خوش و دیداری شیرین در راه است؛ دلِ خود را برای آمدن یاری مهربان آماده نگه دار.",
  },
  {
    poem: "ما در پیاله عکسِ رخِ یار دیده‌ایم\nای بی‌خبر ز لذتِ شربِ مدامِ ما",
    meaning:
      "زیبایی در جزئیات ساده زندگی پنهان است؛ تو هم که شتاب‌زده‌ای، لحظه‌های طلایی را از دست نده.",
  },
];

export default function HafezSection() {
  const [fal, setFal] = useState<(typeof FALS)[number] | null>(null);
  const [spinning, setSpinning] = useState(false);

  function draw() {
    if (spinning) return;
    setSpinning(true);
    setTimeout(() => {
      let next = FALS[Math.floor(Math.random() * FALS.length)];
      if (fal && next.poem === fal.poem && FALS.length > 1) {
        next = FALS[(FALS.indexOf(next) + 1) % FALS.length];
      }
      setFal(next);
      setSpinning(false);
    }, 650);
  }

  return (
    <section id="hafez" className="py-16 md:py-24 px-4 scroll-mt-20">
      <div className="max-w-5xl mx-auto">
        <div className="relative rounded-[2.5rem] bg-charcoal text-white overflow-hidden shadow-2xl">
          {/* decor */}
          <div className="absolute -top-20 -left-20 size-64 rounded-full bg-gold/20 blur-3xl" aria-hidden="true" />
          <div className="absolute -bottom-24 -right-16 size-72 rounded-full bg-blush/20 blur-3xl" aria-hidden="true" />
          <div
            className="absolute top-6 right-8 text-gold/25 rotate-12 hidden md:block"
            aria-hidden="true"
          >
            <MoonStar className="size-16" />
          </div>

          <div className="relative px-6 py-12 md:p-16 text-center">
            <span className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-gold bg-gold/15 px-4 py-1.5 rounded-full">
              <BookOpen className="size-4" />
              امضای ویژه گلستان حافظ
            </span>
            <h2 className="mt-5 text-2xl md:text-4xl font-extrabold">
              فال حافظ بگیرید
            </h2>
            <p className="mt-3 text-sm md:text-base text-white/70 max-w-xl mx-auto leading-7">
              خرید گل از گلستان حافظ با تلمیح به دیوانِ لسان‌الغیب گره خورده است؛
              برای روحِ سفارشِ شما یک بیت تازه می‌خوانیم و برایتان تفسیر می‌کنیم.
            </p>

            <div className="mt-8 min-h-44 flex items-center justify-center">
              <AnimatePresence mode="wait">
                {fal ? (
                  <motion.blockquote
                    key={fal.poem}
                    initial={{ opacity: 0, y: 24, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -16, scale: 0.98 }}
                    transition={{ duration: 0.45 }}
                    className="bg-white/10 border border-gold/30 rounded-3xl px-6 py-6 md:px-10 max-w-2xl"
                  >
                    <p className="text-lg md:text-2xl font-bold leading-[2.2] text-gold whitespace-pre-line">
                      {fal.poem}
                    </p>
                    <p className="mt-4 text-sm md:text-base text-white/75 leading-7">
                      {fal.meaning}
                    </p>
                  </motion.blockquote>
                ) : (
                  <motion.p
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-white/50 text-sm"
                  >
                    برای دیدن فال، دکمه زیر را فشار دهید...
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button
                onClick={draw}
                disabled={spinning}
                className="rounded-full bg-gold hover:bg-gold-dark text-white font-bold h-12 px-8 shadow-lg shadow-gold/30 disabled:opacity-70"
              >
                {spinning ? (
                  <>
                    <RotateCcw className="size-5 animate-spin" />
                    در حال فالگیری...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-5" />
                    {fal ? "فال دیگری بگیر" : "فال بگیر"}
                  </>
                )}
              </Button>
              {fal && (
                <a href="#products">
                  <Button
                    variant="outline"
                    className="rounded-full border-white/25 bg-transparent hover:bg-white/10 text-white font-bold h-12 px-8"
                  >
                    هدیه همراه فال انتخاب کن
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
