export interface SizeOption {
  id: string;
  label: string;
  desc: string;
  multiplier: number;
}

export const SIZE_OPTIONS: SizeOption[] = [
  { id: "classic", label: "استاندارد", desc: "همان‌طور که در تصویر می‌بینید", multiplier: 1 },
  { id: "deluxe", label: "ویژه", desc: "۳۰٪ گل بیشتر، بسته‌بندی لوکس‌تر", multiplier: 1.4 },
  { id: "luxury", label: "لوکس", desc: "دو برابر گل، گل‌های درجه‌یک وارداتی", multiplier: 1.9 },
];

export interface AddonOption {
  id: string;
  name: string;
  price: number;
  emoji: string;
}

export const ADDON_OPTIONS: AddonOption[] = [
  { id: "bear", name: "خرس عروسکی", price: 250_000, emoji: "🧸" },
  { id: "chocolate", name: "جعبه شکلات تلخ", price: 180_000, emoji: "🍫" },
  { id: "balloon", name: "بادکنک هلومی", price: 90_000, emoji: "🎈" },
  { id: "vase", name: "گلدان شیشه‌ای", price: 320_000, emoji: "🏺" },
];

export const DELIVERY_SLOTS = [
  { id: "morning", label: "صبح (۹ تا ۱۲)" },
  { id: "noon", label: "ظهر (۱۲ تا ۱۵)" },
  { id: "evening", label: "عصر (۱۵ تا ۱۸)" },
  { id: "night", label: "شب (۱۸ تا ۲۱)" },
];

/** Build the next `count` days as delivery date options with Persian labels. */
export function getDeliveryDates(count = 7): { value: string; label: string }[] {
  const formatter = new Intl.DateTimeFormat("fa-IR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const today = new Date();
  const days: { value: string; label: string }[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const label = formatter.format(d);
    days.push({ value: label, label: i === 0 ? `امروز — ${label}` : label });
  }
  return days;
}

/** ثبت سفارش در واتس‌آپ — شماره نمایش‌داده‌شده در سایت، دکمه شناور و فوتر */
export const WHATSAPP_NUMBER = "09127385527";
export const WHATSAPP_LINK = `https://wa.me/989127385527?text=${encodeURIComponent(
  "سلام! می‌خواهم سفارش گل ثبت کنم."
)}`;

/** اینستاگرام فروشگاه — آدرس رسمی نمایش‌داده‌شده در فوتر و پشتیبانی */
export const INSTAGRAM_HANDLE = "GolestaneHafez";
export const INSTAGRAM_LINK = `https://www.instagram.com/${INSTAGRAM_HANDLE}`;
