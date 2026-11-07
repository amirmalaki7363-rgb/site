"use client";

import { useState } from "react";
import { BookOpen, Clock, X } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

interface Article {
  id: string;
  title: string;
  excerpt: string;
  tag: string;
  minutes: number;
  emoji: string;
  content: string[];
}

const ARTICLES: Article[] = [
  {
    id: "rose-care",
    title: "راز تازه ماندن رز شاخه‌ای",
    excerpt: "با این ۶ نکته ساده، دسته‌گل رز شما تا دو هفته تازه و معطر می‌ماند.",
    tag: "مراقبت",
    minutes: 4,
    emoji: "🌹",
    content: [
      "رز شاخه‌ای ملکه‌ی گل‌هاست و مثل هر ملکه‌ای، کمی مراقبت خاص می‌خواهد. اولین و مهم‌ترین قانون این است که قبل از قرار دادن گل در گلدان، یک سانت از انتهای ساقه را با قیچی تیز و به‌صورت مورب برش بزنید. برش مورب سطح جذب آب را تا حد زیادی افزایش می‌دهد و گل می‌تواند مثل قبل نفس بکشد.",
      "آب گلدان را هر روز عوض کنید و هر بار که آب را تعویض می‌کنید، یک برش کوچک دیگر هم از انتهای ساقه‌ها بزنید. اگر فرصت روزانه ندارید، حداقل یک‌بار در دو روز آب را تعویض کنید و به آب کمی قند اضافه کنید؛ قند انرژی لازم برای باز شدن غنچه‌های تازه را فراهم می‌کند.",
      "جای گلدان اهمیت زیادی دارد: رزها را دور از نور مستقیم آفتاب، بخاری، کولر و میوه‌ها قرار دهید. میوه‌های رسیده گاز اتیلن آزاد می‌کنند که پیری گل را سرعت می‌بخشد. گلبرگ‌های پژمرده را هر روز جدا کنید تا بقیه دسته‌گل آسیب نبینند.",
      "یک نکته حرفه‌ای: اگر رزها زودتر از انتظار سرشان را پایین انداختند، ساقه‌ها را در آب گرم (نه داغ) تا نیمه غوطه‌ور کنید و یک ساعت در جای خنک بگذارید. این «حمام احیا» معمولاً گل‌ها را کاملاً برمی‌گرداند.",
    ],
  },
  {
    id: "language-of-flowers",
    title: "زبان گل‌ها؛ چه گلی چه پیامی دارد؟",
    excerpt: "قبل از خریدن گل، معنایش را بدانید؛ هر گل پیامی دارد که شاید بی‌مقال‌تر از کلمات باشد.",
    tag: "دانستنی",
    minutes: 5,
    emoji: "💌",
    content: [
      "گل‌ها از قرن‌ها پیش زبانی بی‌کلام بوده‌اند. در فرهنگ ایرانی هم مثل غرب، هر گل پیام مشخصی دارد. رز قرمز نماد عشق آتشین است، رز صورتی برای ابراز محبت و سپاس آمده و رز سفید نشانه‌ی احترام و آغازهای تازه است. اگر قصد خرید گل برای شخص خاصی را دارید، دانستن این معانی انتخاب شما را دقیق‌تر می‌کند.",
      "لاله در فرهنگ ما نماد شهادت و از خودگذشتگی است اما در زبان جهانی گل‌ها، عشق بی‌ادعا و حرارت جوانی را می‌رساند. میخک نماد عشق مادری است و برای روز مادر انتخابی کلاسیک و عمیق به شمار می‌آید. لیلیوم (سوسن) صداقت و اصالت قلب را می‌رساند و برای تبریک ازدواج بسیار مناسب است.",
      "آفتابگردان یعنی «تو مثل خورشید برای من می‌درخشی» و برای هدیه به دوستان پرانرژی عالی است. گل آزالیا پیام «مراقب خودت باش» را می‌رساند و بنفشه یعنی به فکر تو هستم. پیچ امین‌الدوله و رانانکولوس هم با رنگ‌های شادشان نماد جذابیت و دلربایی هستند.",
      "نکته‌ی آخر: تعداد هم مهم است! گل‌های فرد در فرهنگ ایرانی محبوب‌ترند و شاخه‌ی تکِ یک گل خاص (مثلاً یک رز قرمز) پیامی متمرکزتر و شخصی‌تر از یک دسته‌ی بزرگ دارد. اگر مطمئن نیستید، گل‌آرایان ما همیشه برای انتخاب پیام مناسب همراهتان هستند.",
    ],
  },
  {
    id: "low-light-plants",
    title: "۷ گیاه آپارتمانی که با نور کم هم خوشحال‌اند",
    excerpt: "خانه یا دفترتان نور کمی دارد؟ این گیاهان ترفندی برای بقا و زیبایی دارند.",
    tag: "گیاهان",
    minutes: 6,
    emoji: "🌿",
    content: [
      "همه خانه‌ها پنجره‌ی جنوبی ندارند و خبر خوب این است که گیاهان زیادی با نور کم هم به‌خوبی زندگی می‌کنند. اولین و مشهورترین گزینه سانسوریا (زبان مادرشوهر) است که تقریباً فراموش‌نکردنی است؛ هفته‌ای یک‌بار آبیاری کم و کافی است و حتی هوای خشک را هم تحمل می‌کند.",
      "آگلونما با برگ‌های نقش‌دار و رنگی‌اش یکی از زیباترین گزینه‌ها برای گوشه‌های کم‌نور است. سینگونیوم و پوتوس هم برای کسانی که به دنبال گیاهان رونده هستند عالی‌اند؛ می‌توانید بگذارید از لبه قفسه آویزان شوند یا دیوار کنارتان را سبز کنند.",
      "اگر دنبال چیپس بزرگ و حس جنگل در خانه هستید، زاموفیلیا انتخاب هوشمندانه‌ای است: ریزوم‌های زیرزمینی‌اش آب را ذخیره می‌کنند و آبیاری فراموش‌شده را می‌بخشند. اسپاتی‌فیلوم (سوسن صلح) هم گیاهی است که حتی در نور کم گل می‌دهد و طبق مطالعات ناسا یکی از بهترین تصفیه‌کننده‌های هوای داخلی است.",
      "قانون طلایی برای همه‌ی این گیاهان: در نور کم، آبیاری را نصف کنید. رطوبت کم یعنی آب در گلدان دیرتر تبخیر می‌شود و ریشه‌ها بیشتر در خطر پوسیدگی‌اند. انگشتتان را دو سانت داخل خاک کنید؛ اگر خنک و نم‌دار بود، هنوز نیازی به آب نیست.",
    ],
  },
  {
    id: "bouquet-wrapping",
    title: "دسته‌گل هدیه می‌برید؟ این‌ها را بخوانید",
    excerpt: "از انتخاب درست گل تا تحویل بی‌خراشی؛ راهنمای کامل هدیه‌دادن دسته‌گل.",
    tag: "راهنمای خرید",
    minutes: 4,
    emoji: "🎁",
    content: [
      "هدیه‌دادن دسته‌گل ظاهراً ساده است، اما چند نکته‌ی کوچک تفاوت بین یک هدیه‌ی معمولی و یک خاطره‌ی ماندگار را می‌سازد. اول از همه، موقعیت را در نظر بگیرید: برای تبریک تولد، رنگ‌های شاد و پرانرژی مثل لاله و آفتابگردان انتخاب عالی‌ای هستند؛ برای ابراز عشق، رز قرمز یا پیونیه همچنان بی‌رقیب‌اند.",
      "زمان تحویل اهمیت زیادی دارد. اگر قرار است گل را خودتان ببرید، سعی کنید مسیر را کوتاه انتخاب کنید و دسته‌گل را در ماشین زیر آفتاب یا کولر مستقیم نگذارید. در روزهای سرد سال، گلی که بیرون از بسته‌بندی در هوای سرباز می‌ماند ممکن است شوک سرما ببیند و غنچه‌هایش در روزهای بعد باز نشود.",
      "کارت تبریک را دست‌کم نگیرید. یک جمله‌ی کوتاه و شخصی روی کارت، ارزش احساسی هدیه را چند برابر می‌کند. در گلستان حافظ می‌توانید متن کارت را هنگام سفارش بنویسید تا با خوش‌خطی روی کارت اختصاصی چاپ و همراه دسته‌گل ارسال شود.",
      "و نکته‌ی آخر: اگر گیرنده‌ی گل شما در دفتر کار یا بیمارستان است، باکس گل به‌جای دسته‌گل انتخاب هوشمندانه‌تری است؛ گلدان لازم ندارد، حملش راحت است و تا آخرین گلبرگ سرپا می‌ماند. تیم ما آماده‌ی مشاوره برای انتخاب بهترین فرمت برای هر موقعیت است.",
    ],
  },
];

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
                  {a.title}
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
