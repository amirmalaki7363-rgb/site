"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    q: "ارسال سفارش‌ها چطور و چه زمانی انجام می‌شود؟",
    a: "سفارش‌های تهران در محل انتخابی شما و در بازه‌ی زمانی انتخابی (صبح، ظهر، عصر یا شب) تحویل داده می‌شوند.",
  },
  {
    q: "اگر گل‌ها تازه نبودند چه؟",
    a: "ضمانت تازگی ما بی‌قید و شرط است. اگر گل دریافتی تا ۷ روز پژمرده یا آسیب‌دیده بود، کافی است تصویری از آن را برای پشتیبانی بفرستید؛ همان محصول یا محصولی هم‌ارزش آن به‌صورت رایگان برایتان ارسال می‌شود یا کل مبلغ بدون هیچ سوالی بازگردانده می‌شود.",
  },
  {
    q: "می‌توانم سفارش را برای یک ساعت مشخص بفرستم؟",
    a: "بله! در مرحله‌ی تسویه‌حساب، روز ارسال را از ۷ روز آینده و بازه‌ی ساعتی (۹–۱۲، ۱۲–۱۵، ۱۵–۱۸ و ۱۸–۲۱) را انتخاب می‌کنید. پیک ما در همان بازه به گیرنده می‌رسد و قبل از ارسال هم برای هماهنگی با او تماس گرفته می‌شود (در صورت فعال بودن سرویس تماس پیش از تحویل).",
  },
  {
    q: "پیام روی کارت تبریک چطور نوشته می‌شود؟",
    a: "در مرحله‌ی دوم تسویه‌حساب، کادر «پیام روی کارت تبریک» را می‌بینید؛ متن دلخواهتان را بنویسید تا با خوش‌خطی روی کارت اختصاصی گلستان حافظ نوشته و همراه دسته‌گل تحویل شود. این سرویس کاملاً رایگان است.",
  },
  {
    q: "سفارش‌های سازمانی و مراسم را چطور ثبت کنم؟",
    a: "برای گل‌آرایی مراسم، فضای کاری و سفارش‌های گروهی، از بخش «خدمات ویژه» درخواست مشاوره ثبت کنید یا در واتس‌آپ به شماره ۰۹۱۲۷۳۸۵۵۲۷ پیام بدهید. کارشناسان ما در کمتر از یک روز کاری با شما تماس می‌گیرند، طرح پیشنهادی و قیمت دقیق را ارائه می‌دهند و برای مراسم بزرگ بازدید از محل هم انجام می‌شود.",
  },
  {
    q: "پرداخت با چه روش‌هایی انجام می‌شود؟",
    a: "پرداخت آنلاین از طریق درگاه امن بانکی با تمام کارت‌های عضو شتاب انجام می‌شود. برای سفارش‌های سازمانی، امکان صدور فاکتور رسمی و پرداخت کارتهایی نیز وجود دارد. کل فرآیند خرید روی پروتکل امن انجام می‌شود و اطلاعات کارت شما نزد ما ذخیره نمی‌گردد.",
  },
];

export default function Faq() {
  return (
    <section id="faq" className="py-16 md:py-24 px-4 bg-cream scroll-mt-16">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-xs font-bold tracking-widest text-gold-dark bg-gold-soft px-4 py-1.5 rounded-full inline-block">
            سوالات متداول
          </span>
          <h2 className="mt-4 text-2xl md:text-4xl font-extrabold text-charcoal">
            هر سوالی که درباره سفارش گل دارید
          </h2>
          <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-xl mx-auto leading-7">
            پاسخ پرتکرارترین سوالات مشتریان گلستان حافظ را این‌جا جمع کرده‌ایم؛ اگر پاسخ‌تان را پیدا نکردید، ما را صدا بزنید.
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {FAQS.map((f, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="bg-white rounded-3xl px-5 border border-border shadow-sm data-[state=open]:shadow-md transition-shadow"
            >
              <AccordionTrigger className="text-right text-sm md:text-base font-bold text-charcoal hover:no-underline py-4">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-xs md:text-sm leading-7 text-muted-foreground pb-4">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
