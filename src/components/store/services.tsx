"use client";

import { HeartHandshake, Building2, CalendarHeart, PartyPopper, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const SERVICES = [
  {
    icon: PartyPopper,
    title: "گل‌آرایی مراسم عروسی",
    desc: "از سردر ورودی و میز عروس تا تاج گل و دسته‌گل عروس؛ تیم ما کل فضای مراسم شما را با گل‌های تازه و سلیقه‌ی شما می‌آراید. بازدید از محل، مشاوره رایگان و اجرای یک‌روزه.",
    features: ["بازدید و مشاوره رایگان", "طرح اختصاصی برای مراسم شما", "اجرای کامل در روز مراسم"],
  },
  {
    icon: Building2,
    title: "گل‌آرایی فضای کاری",
    desc: "گل و گیاه تازه، روحیه تیم و تصویر برند شما را متحول می‌کند. قرارداد ماهانه گل‌آرایی لابی، اتاق‌های جلسه و میز پذیرایی با تعویض منظم و نگهداری کامل.",
    features: ["قرارداد ماهانه با تعویض هفتگی", "نگهداری و تعویض گل‌ها", "فاکتور رسمی سازمانی"],
  },
  {
    icon: CalendarHeart,
    title: "اشتراک هفتگی گل",
    desc: "هر هفته یک دسته‌گل تازه و فصلی، دست‌چیده از بازار روز، به در خانه یا محل کار شما می‌رسد. ساده‌ترین راه برای اینکه خانه‌تان همیشه بوی زندگی بدهد.",
    features: ["ارسال هفتگی در روز دلخواه", "گل‌های فصلی متنوع", "لغو یا توقف در هر زمان"],
  },
  {
    icon: HeartHandshake,
    title: "سفارش‌های سازمانی",
    desc: "هدیه‌ی گل برای کارکنان، مشتریان و مناسبت‌های سازمانی؛ با درج لوگوی شما روی کارت و بسته‌بندی. تخفیف پلکانی برای سفارش‌های گروهی و ارسال هماهنگ به چند آدرس.",
    features: ["تخفیف سفارش‌های گروهی", "بسته‌بندی با برند سازمان شما", "ارسال هماهنگ چندآدرسه"],
  },
];

export default function Services() {
  function scrollToContact() {
    document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section id="services" className="py-16 md:py-24 px-4 bg-cream scroll-mt-16">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-bold tracking-widest text-gold-dark bg-gold-soft px-4 py-1.5 rounded-full inline-block">
            خدمات ویژه گلستان
          </span>
          <h2 className="mt-4 text-2xl md:text-4xl font-extrabold text-charcoal">
            فراتر از یک دسته‌گل
          </h2>
          <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-2xl mx-auto leading-7">
            گلستان حافظ فقط فروشگاه نیست؛ همراه شما در مهم‌ترین لحظات زندگی و کسب‌وکارتان است.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {SERVICES.map((s) => (
            <article
              key={s.title}
              className="group bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col"
            >
              <span className="grid place-items-center size-14 rounded-2xl bg-blush-soft text-charcoal mb-4 group-hover:bg-gold-soft transition-colors">
                <s.icon className="size-7" />
              </span>
              <h3 className="font-extrabold text-base text-charcoal">{s.title}</h3>
              <p className="mt-2.5 text-xs leading-6 text-muted-foreground">{s.desc}</p>
              <ul className="mt-4 space-y-1.5">
                {s.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[11px] text-charcoal/80">
                    <span className="mt-1.5 size-1.5 rounded-full bg-sage shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                onClick={scrollToContact}
                variant="ghost"
                className="mt-auto pt-4 justify-start gap-1.5 text-xs font-bold text-gold-dark hover:text-gold-dark hover:bg-transparent px-0"
              >
                درخواست مشاوره
                <ArrowLeft className="size-4" />
              </Button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
