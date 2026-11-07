import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const products = [
  { slug: "rose-dream-pink", name: "دسته‌گل رز صورتی رویایی", description: "دسته‌ای خیره‌کننده از رزهای صورتی هلندی همراه با فیلینگ و بسته‌بندی کرافت اختصاصی گلستان حافظ. انتخابی بی‌نظیر برای هدیه‌ای به‌یادماندنی.", category: "bouquet", price: 890000, oldPrice: 1150000, image: "/images/roses-pink-2.jpg", stock: 14, rating: 4.9, reviews: 132, isBestseller: true, isNew: false },
  { slug: "red-love-box", name: "باکس گل رز قرمز عاشقانه", description: "باکس گرد مخملی سرخابی در آمیخته با رزهای قرمز تازه؛ نماد عشقی بی‌پایان. همراه با روبان ساتن و کارت تبریک دست‌نویس.", category: "box", price: 1250000, oldPrice: null, image: "/images/roses-red-1.jpg", stock: 9, rating: 4.8, reviews: 98, isBestseller: true, isNew: false },
  { slug: "luxury-pink-box", name: "باکس گل صورتی لوکس", description: "آرایشی مجلل از رز پیچ صورتی، رانانکولوس و میخک در باکس مخصوص گل‌های تازه. برای مناسبت‌هایی که خاص بودنشان مهم است.", category: "box", price: 1590000, oldPrice: 1850000, image: "/images/flowerbox-1.jpg", stock: 6, rating: 5.0, reviews: 64, isBestseller: true, isNew: true },
  { slug: "spring-tulips", name: "دسته‌گل لاله بهاری", description: "لاله‌های تازه بهاری در رنگ‌های شاد و روشن؛ نویدبخش روزهایی پر از امید و طراوت. مناسب برای شروع‌های تازه و هدیه‌های صمیمانه.", category: "seasonal", price: 650000, oldPrice: null, image: "/images/tulips-1.jpg", stock: 22, rating: 4.7, reviews: 87, isBestseller: false, isNew: true },
  { slug: "white-orchid-pot", name: "گلدان ارکیده سفید فالانوپسیس", description: "ارکیده فالانوپسیس سفید در گلدان سرامیکی شیک؛ هدیه‌ای ماندگار که سال‌ها خانه شما را معطر و زیبا نگه می‌دارد.", category: "plant", price: 980000, oldPrice: 1200000, image: "/images/orchid-1.jpg", stock: 7, rating: 4.9, reviews: 76, isBestseller: false, isNew: false },
  { slug: "sunshine-bouquet", name: "دسته‌گل آفتابگردان آفتاب", description: "آفتابگردان‌های سرزنده و پرطراوت با بسته‌بندی کرافت طبیعی؛ انرژی و نشاط را به آدم‌های خاص زندگیتان هدیه دهید.", category: "bouquet", price: 490000, oldPrice: null, image: "/images/sunflower-1.jpg", stock: 18, rating: 4.8, reviews: 143, isBestseller: true, isNew: false },
  { slug: "peony-elegance", name: "دسته‌گل پیونی کاملاً شیک", description: "پیونی‌های صورتی لوکس با گل‌های درشت و معطر، سلطان گل‌های فصل بهار. دسته‌ای فرازمانه برای فرازمانه‌ها.", category: "seasonal", price: 1450000, oldPrice: null, image: "/images/peony-1.jpg", stock: 4, rating: 5.0, reviews: 51, isBestseller: false, isNew: true },
  { slug: "monstera-plant", name: "گیاه آپارتمانی مونسترا", description: "مونسترا دلکیوزا سالم و پربرگ در گلدان سفالی مدرن؛ همراه با راهنمای نگهداری. رفیق همیشگی گوشه دنج خانه‌تان.", category: "plant", price: 780000, oldPrice: 950000, image: "/images/plant-1.jpg", stock: 11, rating: 4.6, reviews: 112, isBestseller: false, isNew: false },
  { slug: "eternal-rose-box", name: "باکس رز ماندگار ابدی", description: "رزهای ماندگار (Stabilized) در باکس مخملی لوکس؛ بدون نیاز به آب و نور، تا ۵ سال زیبایی‌اش را حفظ می‌کند.", category: "box", price: 1890000, oldPrice: 2350000, image: "/images/flowerbox-2.jpg", stock: 5, rating: 4.9, reviews: 89, isBestseller: true, isNew: false },
  { slug: "classic-red-roses", name: "دسته‌گل رز قرمز کلاسیک", description: "دسته‌ای خوش‌دست از رزهای قرمز رد نعیمی با گل‌های درشت و ساقه‌های بلند. کلاسیک‌ترین راه گفتنِ دوستت دارم.", category: "bouquet", price: 950000, oldPrice: null, image: "/images/roses-red-2.jpg", stock: 15, rating: 4.7, reviews: 167, isBestseller: false, isNew: false },
  { slug: "boho-dried-flowers", name: "آرایش گل خشک بوهمی", description: "ترکیبی هنرمندانه از گل‌های خشک طبیعی، پامچال و گندم طلایی؛ ماندگار، مینیمال و کاملاً اینستاگرامی.", category: "dried", price: 550000, oldPrice: 690000, image: "/images/dried-1.jpg", stock: 20, rating: 4.5, reviews: 43, isBestseller: false, isNew: true },
  { slug: "velvet-tulips", name: "دسته‌گل لاله مخملی صورتی", description: "لاله‌های صورتی مخملی با ساقه‌های لطیف؛ رنگ آرام و دلنشین آن هر فضا را به باغ بهاری تبدیل می‌کند.", category: "seasonal", price: 590000, oldPrice: null, image: "/images/tulips-2.jpg", stock: 25, rating: 4.6, reviews: 58, isBestseller: false, isNew: false },
  { slug: "pink-peony-heart", name: "دسته‌گل پیونی صورتی رؤیایی", description: "پیونی‌های صورتی پاستلی با غنچه‌های تازه و سبزی‌های معطر؛ لطیف و دل‌نشین مثل یک شعر حافظ.", category: "seasonal", price: 1290000, oldPrice: null, image: "/images/peony-2.jpg", stock: 8, rating: 4.9, reviews: 37, isBestseller: false, isNew: true },
  { slug: "purple-orchid", name: "ارکیده بنفش خاص", description: "ارکیده بنفش پرطراوت در گلدان سفالی مات؛ ترکیبی جسورانه و شیک برای فضاهای مدرن.", category: "plant", price: 1050000, oldPrice: null, image: "/images/orchid-2.jpg", stock: 6, rating: 4.8, reviews: 45, isBestseller: false, isNew: false },
  { slug: "single-sunflower", name: "آفتابگردان تک‌شاخه ویژه", description: "یک شاخه آفتابگردان درشت و سرحال با بسته‌بندی مینیمال؛ هدیه‌ای کوچک با لبخندی بزرگ.", category: "bouquet", price: 190000, oldPrice: 250000, image: "/images/sunflower-2.jpg", stock: 30, rating: 4.7, reviews: 203, isBestseller: true, isNew: false },
  { slug: "snake-plant", name: "گیاه سانسور ورقه‌ای", description: "سانسور زبرینا با برگ‌های نقش‌دار در گلدان سرامیکی؛ تصفیه‌کننده طبیعی هوا و بی‌نیاز از نگهداری سخت.", category: "plant", price: 420000, oldPrice: null, image: "/images/plant-2.jpg", stock: 13, rating: 4.8, reviews: 94, isBestseller: false, isNew: false },
];

const MY_PHONE = "09121234567";

function daysAgo(n: number, hour = 10, min = 30): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, min, 0, 0);
  return d;
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function genCode(i: number): string {
  let s = "";
  let x = 1000 + i * 7919;
  for (let k = 0; k < 6; k++) {
    s += CODE_ALPHABET[x % CODE_ALPHABET.length];
    x = Math.floor(x / CODE_ALPHABET.length) + 137;
  }
  return `GH-${s}`;
}

const seedOrders: {
  code: string; customerName: string; phone: string; address: string; province: string; city: string;
  items: { id: string; name: string; price: number; qty: number }[]; total: number; status: string;
  paymentMethod: string; day: number; hour: number; deliveryDate: string; deliverySlot: string; cardMessage: string; addons: string;
}[] = [
  { code: genCode(1), customerName: "مریم احمدی", phone: MY_PHONE, address: "سعادت‌آباد، بلوار دریا، خیابان مطهری، پلاک ۱۲، واحد ۳", province: "تهران", city: "تهران", items: [{ id: "rose-dream-pink", name: "دسته‌گل رز صورتی رویایی", price: 890000, qty: 1 }], total: 890000, status: "delivered", paymentMethod: "online", day: 28, hour: 11, deliveryDate: "پنجشنبه", deliverySlot: "۱۴ تا ۱۸", cardMessage: "تولدت مبارک عزیزم", addons: "[]" },
  { code: genCode(2), customerName: "مریم احمدی", phone: MY_PHONE, address: "سعادت‌آباد، بلوار دریا، خیابان مطهری، پلاک ۱۲، واحد ۳", province: "تهران", city: "تهران", items: [{ id: "luxury-pink-box", name: "باکس گل صورتی لوکس", price: 2226000, qty: 1 }], total: 2315000, status: "delivered", paymentMethod: "wallet", day: 21, hour: 16, deliveryDate: "شنبه", deliverySlot: "۱۰ تا ۱۴", cardMessage: "", addons: '[{"id":"bear","name":"خرس عروسکی","price":180000}]' },
  { code: genCode(3), customerName: "مریم احمدی", phone: MY_PHONE, address: "سعادت‌آباد، بلوار دریا، خیابان مطهری، پلاک ۱۲، واحد ۳", province: "تهران", city: "تهران", items: [{ id: "single-sunflower", name: "آفتابگردان تک‌شاخه ویژه", price: 190000, qty: 2 }], total: 380000, status: "cancelled", paymentMethod: "online", day: 17, hour: 9, deliveryDate: "یکشنبه", deliverySlot: "۱۸ تا ۲۲", cardMessage: "", addons: "[]" },
  { code: genCode(4), customerName: "مریم احمدی", phone: MY_PHONE, address: "سعادت‌آباد، بلوار دریا، خیابان مطهری، پلاک ۱۲، واحد ۳", province: "تهران", city: "تهران", items: [{ id: "white-orchid-pot", name: "گلدان ارکیده سفید فالانوپسیس", price: 980000, qty: 1 }], total: 980000, status: "delivered", paymentMethod: "online", day: 12, hour: 14, deliveryDate: "سه‌شنبه", deliverySlot: "۱۰ تا ۱۴", cardMessage: "", addons: "[]" },
  { code: genCode(5), customerName: "مریم احمدی", phone: MY_PHONE, address: "سعادت‌آباد، بلوار دریا، خیابان مطهری، پلاک ۱۲، واحد ۳", province: "تهران", city: "تهران", items: [{ id: "eternal-rose-box", name: "باکس رز ماندگار ابدی", price: 1890000, qty: 1 }, { id: "single-sunflower", name: "آفتابگردان تک‌شاخه ویژه", price: 190000, qty: 1 }], total: 2080000, status: "delivered", paymentMethod: "wallet", day: 8, hour: 12, deliveryDate: "جمعه", deliverySlot: "۱۴ تا ۱۸", cardMessage: "سالگرد عاشقانه‌مان مبارک", addons: '[{"id":"chocolate","name":"شکلات لوکس","price":250000}]' },
  { code: genCode(6), customerName: "مریم احمدی", phone: MY_PHONE, address: "سعادت‌آباد، بلوار دریا، خیابان مطهری، پلاک ۱۲، واحد ۳", province: "تهران", city: "تهران", items: [{ id: "spring-tulips", name: "دسته‌گل لاله بهاری", price: 650000, qty: 1 }], total: 650000, status: "shipped", paymentMethod: "online", day: 2, hour: 10, deliveryDate: "امروز", deliverySlot: "۱۸ تا ۲۲", cardMessage: "", addons: "[]" },
  { code: genCode(7), customerName: "مریم احمدی", phone: MY_PHONE, address: "سعادت‌آباد، بلوار دریا، خیابان مطهری، پلاک ۱۲، واحد ۳", province: "تهران", city: "تهران", items: [{ id: "peony-elegance", name: "دسته‌گل پیونی کاملاً شیک", price: 1450000, qty: 1 }], total: 1450000, status: "preparing", paymentMethod: "online", day: 1, hour: 18, deliveryDate: "فردا", deliverySlot: "۱۰ تا ۱۴", cardMessage: "برای مادربزرگ مهربان", addons: '[{"id":"balloon","name":"بادکنک فویلی","price":90000}]' },
  { code: genCode(8), customerName: "مریم احمدی", phone: MY_PHONE, address: "سعادت‌آباد، بلوار دریا، خیابان مطهری، پلاک ۱۲، واحد ۳", province: "تهران", city: "تهران", items: [{ id: "sunshine-bouquet", name: "دسته‌گل آفتابگردان آفتاب", price: 490000, qty: 1 }], total: 490000, status: "pending", paymentMethod: "online", day: 0, hour: 9, deliveryDate: "امروز", deliverySlot: "۱۸ تا ۲۲", cardMessage: "", addons: "[]" },
  { code: genCode(9), customerName: "سارا محمدی", phone: "09123334455", address: "میدان ونک، خیابان ملاصدرا، پلاک ۴۵", province: "تهران", city: "تهران", items: [{ id: "red-love-box", name: "باکس گل رز قرمز عاشقانه", price: 1250000, qty: 1 }], total: 1250000, status: "delivered", paymentMethod: "online", day: 26, hour: 20, deliveryDate: "پنجشنبه", deliverySlot: "۱۴ تا ۱۸", cardMessage: "دوستت دارم", addons: "[]" },
  { code: genCode(10), customerName: "علی رضایی", phone: "09351112233", address: "کرج، گوهردشت، فاز ۴، بلوار ۱۵ متری", province: "البرز", city: "کرج", items: [{ id: "classic-red-roses", name: "دسته‌گل رز قرمز کلاسیک", price: 950000, qty: 2 }], total: 1900000, status: "delivered", paymentMethod: "online", day: 24, hour: 13, deliveryDate: "شنبه", deliverySlot: "۱۰ تا ۱۴", cardMessage: "", addons: '[{"id":"bear","name":"خرس عروسکی","price":180000}]' },
  { code: genCode(11), customerName: "نازنین کریمی", phone: "09127778899", address: "تهرانپارس، فلکه دوم، خیابان جشنواره", province: "تهران", city: "تهران", items: [{ id: "monstera-plant", name: "گیاه آپارتمانی مونسترا", price: 780000, qty: 1 }], total: 780000, status: "delivered", paymentMethod: "cod", day: 22, hour: 11, deliveryDate: "یکشنبه", deliverySlot: "۱۸ تا ۲۲", cardMessage: "", addons: "[]" },
  { code: genCode(12), customerName: "حسین موسوی", phone: "09194445566", address: "شیراز، بلوار زند، کوچه ۱۲", province: "فارس", city: "شیراز", items: [{ id: "velvet-tulips", name: "دسته‌گل لاله مخملی صورتی", price: 590000, qty: 3 }], total: 1770000, status: "delivered", paymentMethod: "online", day: 19, hour: 15, deliveryDate: "دوشنبه", deliverySlot: "۱۰ تا ۱۴", cardMessage: "", addons: "[]" },
  { code: genCode(13), customerName: "زهرا حسینی", phone: "09105556677", address: "اصفهان، خیابان چهارباغ بالا", province: "اصفهان", city: "اصفهان", items: [{ id: "boho-dried-flowers", name: "آرایش گل خشک بوهمی", price: 550000, qty: 1 }, { id: "snake-plant", name: "گیاه سانسور ورقه‌ای", price: 420000, qty: 1 }], total: 970000, status: "delivered", paymentMethod: "online", day: 16, hour: 17, deliveryDate: "سه‌شنبه", deliverySlot: "۱۴ تا ۱۸", cardMessage: "", addons: "[]" },
  { code: genCode(14), customerName: "امیر تهرانی", phone: "09128889900", address: "جردن، بلوار گلشهر، پلاک ۸", province: "تهران", city: "تهران", items: [{ id: "luxury-pink-box", name: "باکس گل صورتی لوکس", price: 2226000, qty: 1 }], total: 2226000, status: "delivered", paymentMethod: "wallet", day: 14, hour: 12, deliveryDate: "چهارشنبه", deliverySlot: "۱۰ تا ۱۴", cardMessage: "ولنتاین مبارک", addons: '[{"id":"chocolate","name":"شکلات لوکس","price":250000},{"id":"balloon","name":"بادکنک فویلی","price":90000}]' },
  { code: genCode(15), customerName: "شیرین نادری", phone: "09363334411", address: "تبریز، خیابان آزادی، کوی مهر", province: "آذربایجان شرقی", city: "تبریز", items: [{ id: "pink-peony-heart", name: "دسته‌گل پیونی صورتی رؤیایی", price: 1290000, qty: 1 }], total: 1290000, status: "delivered", paymentMethod: "online", day: 11, hour: 10, deliveryDate: "پنجشنبه", deliverySlot: "۱۸ تا ۲۲", cardMessage: "", addons: "[]" },
  { code: genCode(16), customerName: "کاوه شریفی", phone: "09172223344", address: "مشهد، بلوار وکیل‌آباد، پلاک ۹۹", province: "خراسان رضوی", city: "مشهد", items: [{ id: "sunshine-bouquet", name: "دسته‌گل آفتابگردان آفتاب", price: 490000, qty: 2 }, { id: "single-sunflower", name: "آفتابگردان تک‌شاخه ویژه", price: 190000, qty: 1 }], total: 1170000, status: "delivered", paymentMethod: "online", day: 9, hour: 16, deliveryDate: "جمعه", deliverySlot: "۱۴ تا ۱۸", cardMessage: "", addons: "[]" },
  { code: genCode(17), customerName: "لیلا اکبری", phone: "09113335577", address: "ری، خیابان فتح‌اللهی", province: "تهران", city: "تهران", items: [{ id: "purple-orchid", name: "ارکیده بنفش خاص", price: 1050000, qty: 1 }], total: 1050000, status: "delivered", paymentMethod: "online", day: 6, hour: 11, deliveryDate: "شنبه", deliverySlot: "۱۰ تا ۱۴", cardMessage: "", addons: "[]" },
  { code: genCode(18), customerName: "بهرام قاسمی", phone: "09125556688", address: "رشت، گلسار، بلوار نماز", province: "گیلان", city: "رشت", items: [{ id: "red-love-box", name: "باکس گل رز قرمز عاشقانه", price: 1250000, qty: 1 }], total: 1250000, status: "delivered", paymentMethod: "cod", day: 4, hour: 14, deliveryDate: "یکشنبه", deliverySlot: "۱۸ تا ۲۲", cardMessage: "", addons: "[]" },
  { code: genCode(19), customerName: "سارا محمدی", phone: "09123334455", address: "میدان ونک، خیابان ملاصدرا، پلاک ۴۵", province: "تهران", city: "تهران", items: [{ id: "spring-tulips", name: "دسته‌گل لاله بهاری", price: 650000, qty: 2 }], total: 1300000, status: "delivered", paymentMethod: "online", day: 3, hour: 9, deliveryDate: "دوشنبه", deliverySlot: "۱۰ تا ۱۴", cardMessage: "", addons: "[]" },
  { code: genCode(20), customerName: "مینا صادقی", phone: "09124446699", address: "سعادت‌آباد، بلوار ۲۴ متری", province: "تهران", city: "تهران", items: [{ id: "eternal-rose-box", name: "باکس رز ماندگار ابدی", price: 1890000, qty: 1 }], total: 1890000, status: "delivered", paymentMethod: "wallet", day: 2, hour: 15, deliveryDate: "سه‌شنبه", deliverySlot: "۱۴ تا ۱۸", cardMessage: "", addons: '[{"id":"bear","name":"خرس عروسکی","price":180000}]' },
  { code: genCode(21), customerName: "علی رضایی", phone: "09351112233", address: "کرج، گوهردشت، فاز ۴، بلوار ۱۵ متری", province: "البرز", city: "کرج", items: [{ id: "classic-red-roses", name: "دسته‌گل رز قرمز کلاسیک", price: 950000, qty: 1 }], total: 950000, status: "delivered", paymentMethod: "online", day: 1, hour: 12, deliveryDate: "امروز", deliverySlot: "۱۰ تا ۱۴", cardMessage: "", addons: "[]" },
  { code: genCode(22), customerName: "نگار موسوی", phone: "09198887766", address: "یوسف‌آباد، خیابان اسدآبادی", province: "تهران", city: "تهران", items: [{ id: "luxury-pink-box", name: "باکس گل صورتی لوکس", price: 2226000, qty: 1 }], total: 2226000, status: "confirmed", paymentMethod: "online", day: 0, hour: 8, deliveryDate: "فردا", deliverySlot: "۱۴ تا ۱۸", cardMessage: "برای همسر عزیزم", addons: "[]" },
  { code: genCode(23), customerName: "پریسا رحیمی", phone: "09106667788", address: "niavaran sq, tehran", province: "تهران", city: "تهران", items: [{ id: "peony-elegance", name: "دسته‌گل پیونی کاملاً شیک", price: 1450000, qty: 1 }], total: 1450000, status: "pending", paymentMethod: "online", day: 0, hour: 10, deliveryDate: "امروز", deliverySlot: "۱۸ تا ۲۲", cardMessage: "", addons: "[]" },
  { code: genCode(24), customerName: "فرهاد کاظمی", phone: "09121119988", address: "پونک، بلوار عدل", province: "تهران", city: "تهران", items: [{ id: "monstera-plant", name: "گیاه آپارتمانی مونسترا", price: 780000, qty: 2 }], total: 1560000, status: "preparing", paymentMethod: "online", day: 0, hour: 11, deliveryDate: "فردا", deliverySlot: "۱۰ تا ۱۴", cardMessage: "", addons: "[]" },
];

async function main() {
  console.log("Seeding products...");
  for (const p of products) {
    await db.product.upsert({ where: { slug: p.slug }, update: { ...p }, create: { ...p } });
  }

  console.log("Seeding profile, addresses, wallet...");
  await db.profile.deleteMany({});
  await db.profile.create({
    data: {
      name: "مریم احمدی", phone: MY_PHONE, email: "maryam.ahmadi@gmail.com",
      birthday: "1372/04/18", gender: "female", avatarHue: 0,
      walletBalance: 850000, points: 1250, memberSince: daysAgo(420),
    },
  });
  await db.address.deleteMany({});
  await db.address.createMany({
    data: [
      { title: "خانه", receiver: "مریم احمدی", phone: MY_PHONE, province: "تهران", city: "تهران", postal: "1998745631", line: "سعادت‌آباد، بلوار دریا، خیابان مطهری، پلاک ۱۲، واحد ۳", isDefault: true },
      { title: "محل کار", receiver: "مریم احمدی", phone: MY_PHONE, province: "تهران", city: "تهران", postal: "1516784321", line: "میدان آرژانتین، برج سینا، طبقه ۷، واحد ۷۰۴", isDefault: false },
      { title: "خانه مادربزرگ", receiver: "فاطمه احمدی", phone: "09121110022", province: "تهران", city: "تهران", postal: "1134567890", line: "خیابان انقلاب، کوچه بهار، پلاک ۵", isDefault: false },
    ],
  });
  await db.walletTx.deleteMany({});
  await db.walletTx.createMany({
    data: [
      { type: "charge", amount: 1000000, description: "شارژ کیف پول با درگاه بانکی", createdAt: daysAgo(30, 12) },
      { type: "spend", amount: 890000, description: "پرداخت سفارش GH-JLQZqE دسته‌گل رز صورتی", createdAt: daysAgo(28, 12) },
      { type: "gift", amount: 200000, description: "هدیه تولد از گلستان حافظ", createdAt: daysAgo(20, 9) },
      { type: "spend", amount: 2080000, description: "پرداخت سفارش باکس رز ماندگار", createdAt: daysAgo(8, 13) },
      { type: "charge", amount: 1500000, description: "شارژ کیف پول با درگاه بانکی", createdAt: daysAgo(7, 18) },
      { type: "refund", amount: 380000, description: "بازگشت وجه سفارش لغوشده آفتابگردان", createdAt: daysAgo(16, 11) },
      { type: "spend", amount: 380000, description: "پرداخت کیف پول - آفتابگردان", createdAt: daysAgo(17, 10) },
    ],
  });

  console.log("Seeding coupons, reviews, notifications, customers, settings, messages...");
  await db.coupon.deleteMany({});
  await db.coupon.createMany({
    data: [
      { code: "YAS15", title: "۱۵٪ تخفیف ویژه اعضای گلستان", type: "percent", value: 15, minOrder: 500000, maxUses: 200, used: 64, expiresAt: "", isActive: true, isUsedByUser: false },
      { code: "HAFEZ100", title: "۱۰۰ هزار تومان تخفیف اولین سفارش", type: "amount", value: 100000, minOrder: 700000, maxUses: 500, used: 213, expiresAt: "", isActive: true, isUsedByUser: false },
      { code: "NOROOZ40", title: "۴۰ هزار تومان هدیه نوروز", type: "amount", value: 40000, minOrder: 300000, maxUses: 300, used: 300, expiresAt: "", isActive: false, isUsedByUser: true },
      { code: "TULIP20", title: "۲۰٪ تخفیف گل‌های فصلی", type: "percent", value: 20, minOrder: 800000, maxUses: 150, used: 88, expiresAt: new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10), isActive: true, isUsedByUser: false },
    ],
  });

  await db.review.deleteMany({});
  await db.review.createMany({
    data: [
      { productId: "rose-dream-pink", productName: "دسته‌گل رز صورتی رویایی", productImage: "/images/roses-pink-2.jpg", author: "مریم احمدی", rating: 5, comment: "واقعاً مثل عکس بود! تازه و معطر، گیرنده هم خیلی خوشش آمد. بسته‌بندی عالی بود.", status: "approved", createdAt: daysAgo(27, 15) },
      { productId: "luxury-pink-box", productName: "باکس گل صورتی لوکس", productImage: "/images/flowerbox-1.jpg", author: "مریم احمدی", rating: 5, comment: "باکس فوق‌العاده شیک بود، مادرم عاشقش شد. ارسال هم سر وقت انجام شد.", status: "approved", createdAt: daysAgo(20, 18) },
      { productId: "single-sunflower", productName: "آفتابگردان تک‌شاخه ویژه", productImage: "/images/sunflower-2.jpg", author: "مریم احمدی", rating: 4, comment: "گل تازه بود ولی بسته‌بندی می‌توانست بهتر باشد.", status: "approved", createdAt: daysAgo(16, 20) },
      { productId: "eternal-rose-box", productName: "باکس رز ماندگار ابدی", productImage: "/images/flowerbox-2.jpg", author: "مریم احمدی", rating: 5, comment: "برای سالگردمان گرفتیم، کیفیت رزهای ماندگار واقعاً بالا بود.", status: "approved", createdAt: daysAgo(7, 16) },
      { productId: "white-orchid-pot", productName: "گلدان ارکیده سفید فالانوپسیس", productImage: "/images/orchid-1.jpg", author: "زهرا حسینی", rating: 5, comment: "ارکیده سالم و پر غنچه رسید. بسته‌بندی خیلی حرفه‌ای بود.", status: "approved", createdAt: daysAgo(12, 14) },
      { productId: "monstera-plant", productName: "گیاه آپارتمانی مونسترا", productImage: "/images/plant-1.jpg", author: "نازنین کریمی", rating: 4, comment: "گیاه خوب بود فقط یک برگش کمی آسیب دیده بود.", status: "approved", createdAt: daysAgo(21, 10) },
      { productId: "spring-tulips", productName: "دسته‌گل لاله بهاری", productImage: "/images/tulips-1.jpg", author: "سارا محمدی", rating: 5, comment: "لاله‌ها خیلی شاد و تازه بودند، قیمت هم منصفانه.", status: "approved", createdAt: daysAgo(3, 12) },
      { productId: "red-love-box", productName: "باکس گل رز قرمز عاشقانه", productImage: "/images/roses-red-1.jpg", author: "علی رضایی", rating: 5, comment: "همسرم ذوق کرد! رزها درشت و سرخ بودند.", status: "approved", createdAt: daysAgo(24, 21) },
      { productId: "peony-elegance", productName: "دسته‌گل پیونی کاملاً شیک", productImage: "/images/peony-1.jpg", author: "پریسا رحیمی", rating: 4, comment: "پیونی‌ها زیبا بودند ولی چند تا از غنچه‌ها باز نشد.", status: "pending", createdAt: daysAgo(1, 9) },
      { productId: "boho-dried-flowers", productName: "آرایش گل خشک بوهمی", productImage: "/images/dried-1.jpg", author: "مینا صادقی", rating: 3, comment: "انتظارم بیشتر بود، رنگ‌ها کم‌رنگ‌تر از عکس بود.", status: "pending", createdAt: daysAgo(2, 13) },
      { productId: "velvet-tulips", productName: "دسته‌گل لاله مخملی صورتی", productImage: "/images/tulips-2.jpg", author: "حسین موسوی", rating: 1, comment: "اسپم و تبلیغات بی‌ربط", status: "rejected", createdAt: daysAgo(10, 8) },
    ],
  });

  await db.notification.deleteMany({});
  await db.notification.createMany({
    data: [
      { title: "سفارش شما ارسال شد", body: "سفارش دسته‌گل لاله بهاری با کد رهگیری GH-JLQZ6M تحویل پیک شد و در راه است.", type: "order", isRead: false, createdAt: daysAgo(2, 14) },
      { title: "کیف پول شما شارژ شد", body: "مبلغ ۱٬۵۰۰٬۰۰۰ تومان با موفقیت به کیف پول شما اضافه شد.", type: "wallet", isRead: false, createdAt: daysAgo(7, 18) },
      { title: "کد تخفیف جدید برای شما", body: "به مناسبت عضویت طلایی شما، کد YAS15 با ۱۵٪ تخفیف فعال شد.", type: "promo", isRead: false, createdAt: daysAgo(9, 11) },
      { title: "امتیاز باشگاه مشتریان", body: "با خرید اخیر ۱۸۹ امتیاز کسب کردید. مجموع امتیاز شما: ۱٬۲۵۰", type: "loyalty", isRead: true, createdAt: daysAgo(12, 16) },
      { title: "مقاله جدید در مجله گل", body: "«۷ گل که در تابستان دوام بیشتری دارند» منتشر شد؛ بخوانید.", type: "blog", isRead: true, createdAt: daysAgo(15, 10) },
      { title: "سفارش شما تحویل شد", body: "سفارش باکس رز ماندگار ابدی با موفقیت تحویل گردید. نظرتان را با ما به اشتراک بگذارید.", type: "order", isRead: true, createdAt: daysAgo(8, 19) },
    ],
  });

  await db.customer.deleteMany({});
  await db.customer.createMany({
    data: [
      { name: "سارا محمدی", phone: "09123334455", email: "sara.m@gmail.com", city: "تهران", wallet: 0, points: 640, note: "مشتری وفادار - عاشق رز قرمز", createdAt: daysAgo(200) },
      { name: "علی رضایی", phone: "09351112233", email: "ali.rezaei@yahoo.com", city: "کرج", wallet: 150000, points: 480, note: "", createdAt: daysAgo(150) },
      { name: "نازنین کریمی", phone: "09127778899", email: "", city: "تهران", wallet: 0, points: 320, note: "", createdAt: daysAgo(120) },
      { name: "حسین موسوی", phone: "09194445566", email: "h.mousavi@gmail.com", city: "شیراز", wallet: 0, points: 590, note: "سفارش عمده برای شرکت", createdAt: daysAgo(90) },
      { name: "زهرا حسینی", phone: "09105556677", email: "", city: "اصفهان", wallet: 0, points: 260, note: "", createdAt: daysAgo(80) },
      { name: "امیر تهرانی", phone: "09128889900", email: "amir.t@outlook.com", city: "تهران", wallet: 420000, points: 710, note: "VIP", createdAt: daysAgo(60) },
      { name: "مینا صادقی", phone: "09124446699", email: "", city: "تهران", wallet: 0, points: 380, note: "", createdAt: daysAgo(45) },
      { name: "لیلا اکبری", phone: "09113335577", email: "", city: "تهران", wallet: 0, points: 210, note: "", createdAt: daysAgo(30) },
    ],
  });

  const settingsRow = await db.settings.findFirst();
  if (!settingsRow) {
    await db.settings.create({ data: {} });
  }

  await db.message.deleteMany({});
  await db.message.createMany({
    data: [
      { name: "رضا مقدم", phone: "09121234567", subject: "سفارش گل برای مراسم افتتاحیه", body: "سلام، برای افتتاحیه شعبه جدید حدود ۲۰ سبده گل نیاز داریم. لطفاً شرایط سفارش عمده را اعلام کنید.", isRead: false, createdAt: daysAgo(1, 9) },
      { name: "شیما پارسا", phone: "09331239876", subject: "ارسال به شهرستان", body: "سلام وقت بخیر، می‌خواستم بدونم آیا به بندرعباس هم ارسال دارید؟ چند روز طول می‌کشد؟", isRead: false, createdAt: daysAgo(2, 15) },
      { name: "محمد امینی", phone: "09191234561", subject: "تشکر از خدمات شما", body: "سلام، می‌خواستم تشکر کنم از بسته‌بندی فوق‌العاده و پیک محترم. واقعاً حرفه‌ای بودید.", isRead: true, createdAt: daysAgo(5, 11) },
      { name: "الهه نوری", phone: "09107894561", subject: "گزارش مشکل پرداخت", body: "سلام، هنگام پرداخت سفارش باکس گل خطای بانکی گرفتم. مبلغ از حسابم کم شده ولی سفارش ثبت نشده.", isRead: true, createdAt: daysAgo(8, 17) },
    ],
  });

  console.log("Seeding tickets...");
  await db.ticket.deleteMany({});
  await db.ticket.create({
    data: {
      code: "TK-8H2K4M", subject: "کد تخفیف سفارش قبلی من کار نکرد",
      category: "payment", priority: "high", status: "open",
      userName: "مریم احمدی", phone: MY_PHONE, createdAt: daysAgo(0, 8),
      updatedAt: daysAgo(0, 8),
      messages: {
        create: {
          sender: "user", senderName: "مریم احمدی",
          body: "سلام، امروز سفارش دسته‌گل آفتابگردان ثبت کردم و کد تخفیف SPRING1404 را وارد کردم اما تخفیف اعمال نشد. لطفاً بررسی کنید که آیا می‌توانم مابه‌التفاوت را در کیف پولم دریافت کنم؟",
          createdAt: daysAgo(0, 8),
        },
      },
    },
  });
  await db.ticket.create({
    data: {
      code: "TK-5P7Q9R", subject: "گل‌های سفارش پیونی کمی پژمرده رسیدند",
      category: "product", priority: "normal", status: "answered",
      userName: "مریم احمدی", phone: MY_PHONE, createdAt: daysAgo(3, 14),
      updatedAt: daysAgo(2, 10),
      messages: {
        create: {
          sender: "user", senderName: "مریم احمدی",
          body: "سلام و وقت بخیر. سفارش دسته‌گل پیونی (کد سفارش در تاریخ سه‌شنبه) دیروز به دستم رسید اما چند گل اول بسته کمی پژمرده به نظر می‌رسید. عکس هم ضمیمه کردم. ممنون می‌شم راهنمایی کنید.",
          createdAt: daysAgo(3, 14),
        },
      },
    },
  });
  await db.ticketMsg.createMany({
    data: [
      { ticketId: (await db.ticket.findUnique({ where: { code: "TK-5P7Q9R" } }))?.id ?? "", sender: "admin", senderName: "پشتیبانی گلستان حافظ", body: "سلام خانم احمدی، وقت شما هم بخیر 🌷 ضمن پوزش بابت این موضوع، پیگیری کردیم؛ بسته‌بندی پیونی‌ها برای روزهای گرم تغییر کرده است. برای جبران، یک کد تخفیف ۱۵٪ اختصاصی به اعلان‌های شما ارسال شد و دفعه بعد گل‌ها با بسته‌بندی یخی ارسال می‌شوند.", createdAt: daysAgo(2, 10) },
      { ticketId: (await db.ticket.findUnique({ where: { code: "TK-5P7Q9R" } }))?.id ?? "", sender: "user", senderName: "مریم احمدی", body: "ممنون از پاسخ سریع و محبتتون 🌸 لطفاً به تیم بسته‌بندی هم بگید. کد تخفیف رو پیدا کردم، دستتون درد نکنه.", createdAt: daysAgo(2, 12) },
    ],
  });
  await db.ticket.create({
    data: {
      code: "TK-2X4Y6Z", subject: "درخواست فاکتور رسمی برای سفارش ارکیده",
      category: "general", priority: "low", status: "closed",
      userName: "مریم احمدی", phone: MY_PHONE, createdAt: daysAgo(9, 11),
      updatedAt: daysAgo(8, 9),
      messages: {
        create: {
          sender: "user", senderName: "مریم احمدی",
          body: "سلام، برای سفارش ارکیده سفید که هفته پیش گرفتم، فاکتور رسمی نیاز دارم. لطفاً راهنمایی کنید.",
          createdAt: daysAgo(9, 11),
        },
      },
    },
  });
  await db.ticketMsg.create({
    data: {
      ticketId: (await db.ticket.findUnique({ where: { code: "TK-2X4Y6Z" } }))?.id ?? "",
      sender: "admin", senderName: "پشتیبانی گلستان حافظ",
      body: "سلام خانم احمدی، فاکتور رسمی به ایمیل شما ارسال شد. در صورت نیاز به اصلاح اطلاعات پاسخ همین تیکت را بدهید. با احترام 🌹",
      createdAt: daysAgo(8, 9),
    },
  });

  console.log("Seeding orders...");
  await db.order.deleteMany();
  const productMap = new Map(products.map((p) => [p.slug, p]));
  for (const o of seedOrders) {
    const items = o.items.map((it) => {
      const p = productMap.get(it.id);
      return { id: it.id, name: it.name, price: it.price, qty: it.qty, image: p?.image ?? "/images/roses-pink-1.jpg" };
    });
    await db.order.create({
      data: {
        code: o.code, customerName: o.customerName, phone: o.phone, address: o.address,
        province: o.province, city: o.city, deliveryDate: o.deliveryDate, deliverySlot: o.deliverySlot,
        cardMessage: o.cardMessage, addons: o.addons, paymentMethod: o.paymentMethod,
        shippingCost: o.total >= 1000000 ? 0 : 89000, note: null,
        items: JSON.stringify(items), total: o.total, status: o.status,
        createdAt: daysAgo(o.day, o.hour),
      },
    });
  }

  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
