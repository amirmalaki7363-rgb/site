"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Flower2, Users, PackageCheck, HeartHandshake } from "lucide-react";
import { faNumber } from "@/lib/format";

const STATS = [
  { icon: PackageCheck, value: 12500, suffix: "+", label: "سفارش موفق" },
  { icon: Flower2, value: 180, suffix: "+", label: "تنوع گل و گیاه" },
  { icon: Users, value: 9400, suffix: "+", label: "مشتری وفادار" },
  { icon: HeartHandshake, value: 98, suffix: "٪", label: "رضایت مشتریان" },
];

function useCountUp(target: number, active: boolean, duration = 1600) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration]);
  return value;
}

function StatItem({
  icon: Icon,
  value,
  suffix,
  label,
  active,
}: {
  icon: React.ElementType;
  value: number;
  suffix: string;
  label: string;
  active: boolean;
}) {
  const n = useCountUp(value, active);
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <span className="grid place-items-center size-12 rounded-2xl bg-white/15 backdrop-blur border border-white/20 text-gold">
        <Icon className="size-6" />
      </span>
      <span className="text-2xl md:text-3xl font-extrabold text-white tabular-nums">
        {faNumber(n)}
        <span className="text-gold">{suffix}</span>
      </span>
      <span className="text-xs md:text-sm text-white/70">{label}</span>
    </div>
  );
}

export default function About() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setActive(true),
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="about" className="py-16 md:py-24 px-4 bg-white scroll-mt-20">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <div ref={ref} className="relative">
          <div className="absolute -top-4 -right-4 w-full h-full rounded-[3rem] bg-blush-soft" aria-hidden="true" />
          <div className="relative rounded-[3rem] overflow-hidden shadow-xl aspect-[4/3] border-8 border-white">
            <Image
              src="/images/hero-3.jpg"
              alt="گل‌آرای گلستان حافظ در حال چیدن دسته‌گل"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 90vw, 45vw"
            />
          </div>
          <div className="absolute -bottom-6 right-8 bg-white rounded-2xl shadow-lg px-5 py-3.5 flex items-center gap-3 border border-border/50">
            <span className="grid place-items-center size-10 rounded-xl bg-gold-soft text-gold-dark">
              <Flower2 className="size-5" />
            </span>
            <div>
              <p className="text-sm font-extrabold text-charcoal">+۱۵ سال تجربه</p>
              <p className="text-[11px] text-muted-foreground">از قلب بازار گل تهران</p>
            </div>
          </div>
        </div>

        <div>
          <span className="text-xs font-bold tracking-widest text-gold-dark bg-gold-soft px-4 py-1.5 rounded-full inline-block">
            داستان ما
          </span>
          <h2 className="mt-4 text-2xl md:text-4xl font-extrabold text-charcoal leading-[1.4]">
            گلستان حافظ؛ از یک غنچه در حیاطِ خانه،
            <span className="text-blush-dark"> تا گلستانی از عشق</span>
          </h2>
          <p className="mt-5 text-sm md:text-base text-charcoal/70 leading-8">
            داستان ما سال‌ها پیش، با یک گلابِ کوچک در حیاط خانه‌ای قدیمی در شیراز
            آغاز شد؛ جایی که مادربزرگ‌های ما یاد داده بودند گل را با دست چیدن و با
            دل هدیه دادن. امروز گلستان حافظ با تکیه بر همان سنت، هر روز صبح تازه‌ترین
            گل‌ها را از بازار انتخاب می‌کند، در کارگاه خود دسته می‌چیند و همان روز
            به دست عزیزانتان می‌رساند.
          </p>
          <p className="mt-4 text-sm md:text-base text-charcoal/70 leading-8">
            برای ما هر سفارش فقط یک خرید نیست؛ نامه‌ای است که شما با زبان گل برای
            کسی می‌فرستید. به همین باوریم اگر گل درست، درست چیده شود، حتی بدون یک
            کلمه نوشتار، همه‌چیز را می‌گوید.
          </p>

          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 rounded-3xl bg-charcoal p-6">
            {STATS.map((s) => (
              <StatItem key={s.label} {...s} active={active} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
