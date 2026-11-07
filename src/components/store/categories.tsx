"use client";

import Image from "next/image";

const CATEGORIES = [
  {
    title: "دسته‌گل",
    desc: "رز، لاله، آفتابگردان",
    image: "/images/roses-pink-1.jpg",
    filter: "bouquet",
  },
  {
    title: "باکس گل",
    desc: "لوکس و ماندگار",
    image: "/images/flowerbox-2.jpg",
    filter: "box",
  },
  {
    title: "گیاه آپارتمانی",
    desc: "سبز و همیشگی",
    image: "/images/plant-1.jpg",
    filter: "plant",
  },
  {
    title: "گل‌های فصلی",
    desc: "لاله و پیونی",
    image: "/images/peony-2.jpg",
    filter: "seasonal",
  },
  {
    title: "گل خشک",
    desc: "بوهمی و مینیمال",
    image: "/images/dried-2.jpg",
    filter: "dried",
  },
];

export default function Categories() {
  function scrollToProducts(filter: string) {
    const el = document.getElementById("products");
    el?.scrollIntoView({ behavior: "smooth" });
    window.dispatchEvent(new CustomEvent("gh:filter-category", { detail: filter }));
  }

  return (
    <section id="categories" className="py-16 md:py-24 px-4 scroll-mt-20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-xs font-bold tracking-widest text-gold-dark bg-gold-soft px-4 py-1.5 rounded-full inline-block">
            دسته‌بندی محصولات
          </span>
          <h2 className="mt-4 text-2xl md:text-4xl font-extrabold text-charcoal">
            دنبال چه گلی هستید؟
          </h2>
          <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-2xl mx-auto leading-7">
            از شاخه‌های تازه صبحگاهی تا گیاهان ماندگار؛ هر دسته دنیایی از رنگ و
            عطر دارد. دسته دلخواهتان را انتخاب کنید.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {CATEGORIES.map((c, i) => (
            <a
              key={c.title}
              href={`/category/${c.filter}`}
              onClick={(e) => { e.preventDefault(); scrollToProducts(c.filter); }}
              className={`group relative rounded-3xl overflow-hidden aspect-[3/4] shadow-md text-right focus-visible:ring-2 focus-visible:ring-blush focus-visible:outline-none ${
                i === 0 ? "col-span-2 md:col-span-1" : ""
              }`}
            >
              <Image
                src={c.image}
                alt={c.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 768px) 50vw, 20vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 p-4 text-white">
                <h3 className="font-extrabold text-base md:text-lg">{c.title}</h3>
                <p className="text-xs text-white/80 mt-0.5">{c.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
