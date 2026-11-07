// Single source of truth for SEO / structured data. Set SITE_URL in .env (e.g. https://your-domain.ir).
export const SITE_URL = (process.env.SITE_URL || "https://golestanhafez.ir").replace(/\/+$/, "");
export const SITE_NAME = "گلستان حافظ";
export const SITE_TITLE = "گلستان حافظ | فروشگاه آنلاین گل و گیاه با تحویل در تهران";
export const SITE_DESC =
  "خرید آنلاین دسته‌گل، باکس گل، گل آپارتمانی و گل خشک از گلستان حافظ؛ گل تازه و دست‌ساز با ارسال سریع در تهران، انتخاب زمان تحویل و کارت پیام رایگان.";

export const BUSINESS = {
  phone: "+989127385527",
  displayPhone: "09127385527",
  streetAddress: "خیابان ولیعصر، کوچه یاس، پلاک ۸",
  city: "تهران",
  region: "تهران",
  country: "IR",
  instagram: "https://www.instagram.com/GolestaneHafez",
  opens: "09:00",
  closes: "21:00",
};

export const CATEGORY_SEO: Record<string, { title: string; h1: string; description: string; intro: string }> = {
  bouquet: {
    title: "خرید دسته گل تازه آنلاین در تهران",
    h1: "دسته‌گل تازه و دست‌ساز",
    description: "خرید آنلاین دسته گل رز، لاله و آفتابگردان با گل تازه روز و ارسال سریع در تهران. انتخاب زمان تحویل و کارت پیام رایگان.",
    intro: "دسته‌گل‌های گلستان حافظ هر صبح از گل‌های تازه آماده می‌شوند. از دسته گل رز برای عاشقانه‌ترین لحظه‌ها تا لاله و آفتابگردان برای تولد و قدردانی؛ همه با بسته‌بندی شیک و ارسال در بازه‌ی زمانی دلخواه شما در تهران.",
  },
  box: {
    title: "خرید باکس گل لوکس و هدیه | ارسال در تهران",
    h1: "باکس گل لوکس",
    description: "باکس گل لوکس و ماندگار برای هدیه، سالگرد و خواستگاری؛ طراحی دست‌ساز، بسته‌بندی شیک و تحویل در محل انتخابی شما در تهران.",
    intro: "باکس گل انتخابی ماندگار و متفاوت برای هدیه دادن است. هر باکس با ترکیب رنگ هماهنگ و گل درجه‌یک چیده می‌شود و می‌توانید کارت پیام شخصی و افزونه‌هایی مثل شکلات یا خرس عروسکی به آن اضافه کنید.",
  },
  plant: {
    title: "خرید گل و گیاه آپارتمانی آنلاین | گلستان حافظ",
    h1: "گیاه آپارتمانی",
    description: "خرید گیاه آپارتمانی کم‌نیاز و زیبا برای خانه و محل کار، همراه با راهنمای نگهداری و ارسال امن در تهران.",
    intro: "گیاهان آپارتمانی گلستان حافظ برای فضای خانه و دفتر کار انتخاب شده‌اند: مقاوم، کم‌نیاز و سرسبز. هر گیاه با گلدان مناسب و راهنمای نگهداری تحویل داده می‌شود.",
  },
  seasonal: {
    title: "خرید گل فصلی تازه (لاله، پیونی و ...) | گلستان حافظ",
    h1: "گل‌های فصلی",
    description: "گل‌های فصلی تازه مثل لاله و پیونی با کیفیت بالا؛ سفارش آنلاین و تحویل سریع در تهران.",
    intro: "گل‌های فصلی فقط در زمان خودشان بهترین کیفیت را دارند. در این دسته، تازه‌ترین گل‌های فصل را با قیمت مناسب و تحویل سریع پیدا می‌کنید.",
  },
  dried: {
    title: "خرید دسته گل خشک و بوهمی | گلستان حافظ",
    h1: "گل خشک",
    description: "دسته گل خشک بوهمی و مینیمال برای دکور و هدیه؛ ماندگار، شیک و آماده‌ی ارسال در تهران.",
    intro: "گل خشک زیبایی‌اش را ماه‌ها حفظ می‌کند و برای دکور خانه، میز کار و هدیه‌های ماندگار انتخابی عالی است. طرح‌های بوهمی و مینیمال ما را ببینید.",
  },
};

export function absUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function faPrice(n: number): string {
  return new Intl.NumberFormat("fa-IR").format(n);
}

/** safe JSON for <script type="application/ld+json"> (prevents </script> breakout) */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
