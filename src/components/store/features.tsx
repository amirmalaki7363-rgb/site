import { Truck, Flower2, Gift, Headset } from "lucide-react";

const FEATURES = [
  {
    icon: Truck,
    title: "ارسال سریع",
    text: "تحویل در محل انتخابی شما",
  },
  {
    icon: Flower2,
    title: "تازگی تضمینی با توجه به شرایط اعلام شده",
    text: "گل‌های مستقیم از بازار روز با ضمانت ۷ روزه تازگی",
  },
  {
    icon: Gift,
    title: "بسته‌بندی خاص",
    text: "کرافت، ساتن و کارت دست‌نویس اختصاصی گلستان حافظ",
  },
  {
    icon: Headset,
    title: "پشتیبانی مهربان",
    text: "هر روز هفته از ۸ صبح تا ۱۰ شب همراه شما هستیم",
  },
];

export default function Features() {
  return (
    <section className="relative -mt-0 md:-mt-8 z-10 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="bg-white rounded-3xl p-4 md:p-6 shadow-sm border border-border/60 flex flex-col items-center text-center gap-2.5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
          >
            <span className="grid place-items-center size-12 md:size-14 rounded-2xl bg-blush-soft text-blush-dark">
              <f.icon className="size-6 md:size-7" />
            </span>
            <h3 className="font-bold text-sm md:text-base text-charcoal">{f.title}</h3>
            <p className="text-[11px] md:text-xs text-muted-foreground leading-5 md:leading-6">
              {f.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
