"use client";

import Image from "next/image";
import { Cake, Heart, Crown, Flower, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const OCCASIONS = [
  {
    title: "تولد",
    desc: "جشن گرفتنِ تولدِ عزیزان با رنگ‌های شاد و پرانرژی",
    image: "/images/birthday-1.jpg",
    icon: Cake,
    filter: "bouquet",
  },
  {
    title: "عروسی و نامزدی",
    desc: "دسته‌عروس و آرایش مراسم با طراحی اختصاصی",
    image: "/images/wedding-1.jpg",
    icon: Crown,
    filter: "seasonal",
  },
  {
    title: "عاشقانه",
    desc: "برای گفتن «دوستت دارم» به بهترین زبان دنیا",
    image: "/images/roses-red-2.jpg",
    icon: Heart,
    filter: "box",
  },
  {
    title: "تسلیت و یادبود",
    desc: "همدلی محترمانه با تاج گل‌های سفید و آرام",
    image: "/images/orchid-1.jpg",
    icon: Flower,
    filter: "all",
  },
];

export default function Occasions() {
  function scrollToProducts(filter: string) {
    const el = document.getElementById("products");
    el?.scrollIntoView({ behavior: "smooth" });
    window.dispatchEvent(new CustomEvent("gh:filter-category", { detail: filter }));
  }

  return (
    <section id="occasions" className="py-16 md:py-24 px-4 bg-gradient-to-b from-cream via-cream to-blush-soft/40 scroll-mt-20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-xs font-bold tracking-widest text-blush-dark bg-white px-4 py-1.5 rounded-full inline-block shadow-sm">
            مناسبتی که در دلش دارید
          </span>
          <h2 className="mt-4 text-2xl md:text-4xl font-extrabold text-charcoal">
            گل، برای هر مناسبتِ شما
          </h2>
          <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-2xl mx-auto leading-7">
            تولد، عروسی، آغاز یک مسیر تازه یا یک معذرت‌خواهی دلنشین؛ کافیست
            مناسبت را بگویید، گلِ درستش را ما می‌دانیم.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {OCCASIONS.map((o, i) => (
            <div
              key={o.title}
              className="group relative rounded-3xl overflow-hidden h-80 shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              <Image
                src={o.image}
                alt={o.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/40 to-charcoal/10" />

              {i === 2 && (
                <span className="absolute top-4 left-4 bg-gold text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow flex items-center gap-1">
                  <Sparkles className="size-3" />
                  ویژه سپندارمذگان
                </span>
              )}

              <div className="absolute bottom-0 inset-x-0 p-5 text-white">
                <span className="inline-grid place-items-center size-11 rounded-2xl bg-white/15 backdrop-blur border border-white/25 mb-3">
                  <o.icon className="size-6" />
                </span>
                <h3 className="font-extrabold text-lg">{o.title}</h3>
                <p className="text-xs text-white/80 mt-1.5 leading-6">{o.desc}</p>
                <Button
                  size="sm"
                  onClick={() => scrollToProducts(o.filter)}
                  className="mt-3 rounded-full bg-white/20 hover:bg-white hover:text-charcoal backdrop-blur border border-white/30 text-white text-xs h-8 px-4 opacity-0 group-hover:opacity-100 transition-all duration-300"
                >
                  مشاهده پیشنهادها
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
