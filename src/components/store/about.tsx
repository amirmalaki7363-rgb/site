"use client";

import Image from "next/image";

export default function About() {
  return (
    <section id="about" className="py-16 md:py-24 px-4 bg-white scroll-mt-20">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <div className="relative">
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
        </div>
      </div>
    </section>
  );
}
