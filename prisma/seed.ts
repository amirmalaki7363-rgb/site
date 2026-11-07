import { PrismaClient } from "@prisma/client";
import { randomBytes, randomInt, scryptSync } from "crypto";

const db = new PrismaClient();

// SAFETY: this script WIPES users/orders/etc. Never run it against a live database by accident.
if (process.env.NODE_ENV === "production" && process.env.ALLOW_SEED !== "1") {
  console.error("Refusing to seed in production (set ALLOW_SEED=1 if you really mean it).");
  process.exit(1);
}
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || randomBytes(12).toString("base64url");
const DEMO_PASSWORD = () => randomBytes(9).toString("base64url");

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function genCode(): string {
  let s = "";
  for (let i = 0; i < 6; i++) s += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return `GH-${s}`;
}

function daysAgo(n: number, hour = 10): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, Math.floor(Math.random() * 59), 0, 0);
  return d;
}

async function main() {
  console.log("🌱 Seeding real data...");

  // wipe in dependency order
  await db.ticketMsg.deleteMany();
  await db.ticket.deleteMany();
  await db.favorite.deleteMany();
  await db.notification.deleteMany();
  await db.walletTx.deleteMany();
  await db.address.deleteMany();
  await db.review.deleteMany();
  await db.order.deleteMany();
  await db.coupon.deleteMany();
  await db.product.deleteMany();
  await db.settings.deleteMany();
  await db.message.deleteMany();
  await db.user.deleteMany();

  // ---------- users ----------
  const admin = await db.user.create({
    data: {
      name: "مدیر گلستان",
      phone: "09121111111",
      email: "admin@golestanhafez.ir",
      password: hashPassword(ADMIN_PASSWORD),
      role: "admin",
      avatarHue: 2,
    },
  });

  const sara = await db.user.create({
    data: {
      name: "سارا محمدی",
      phone: "09122222222",
      email: "sara@example.com",
      password: hashPassword(DEMO_PASSWORD()),
      role: "user",
      avatarHue: 0,
      walletBalance: 850000,
      points: 750,
      birthday: "۱۳۷۲/۰۴/۱۸",
      gender: "female",
      city: "تهران",
      createdAt: daysAgo(60),
      memberSince: daysAgo(60),
    },
  });

  const reza = await db.user.create({
    data: {
      name: "رضا کریمی",
      phone: "09123333333",
      email: "reza@example.com",
      password: hashPassword(DEMO_PASSWORD()),
      role: "user",
      avatarHue: 1,
      walletBalance: 150000,
      points: 220,
      gender: "male",
      city: "کرج",
      createdAt: daysAgo(35),
      memberSince: daysAgo(35),
    },
  });

  console.log("✓ users");

  // ---------- products ----------
  const productsData = [
    { slug: "bouquet-pink-roses", name: "دسته‌گل رز صورتی رویایی", category: "bouquet", price: 1250000, oldPrice: 1490000, image: "/products/roses-pink.jpg", stock: 14, rating: 4.9, isBestseller: true, description: "دسته‌گل لطیف از رزهای صورتی هلندی با بسته‌بندی کرِم و روبان ساتن؛ انتخابی همیشه‌به‌یادماندنی برای بیان عشق." },
    { slug: "bouquet-tulips", name: "دسته‌گل لاله رنگارنگ", category: "bouquet", price: 890000, oldPrice: null, image: "/products/tulips-bouquet.jpg", stock: 20, rating: 4.7, isBestseller: true, description: "لاله‌های تازه و رنگارنگ بهاره با کاغذ کرافت طبیعی؛ سرزندگی و رنگ را هدیه دهید." },
    { slug: "bouquet-lilies", name: "دسته‌گل لیلیوم سفید", category: "bouquet", price: 1580000, oldPrice: 1750000, image: "/products/lilies-white.jpg", stock: 8, rating: 4.8, isBestseller: false, description: "لیلیوم‌های سفید درجه‌یک با برگ‌های اکالیپتوس؛ ظرافتی برای لحظه‌های خاص." },
    { slug: "bouquet-spring-mix", name: "دسته‌گل گل‌های فصل", category: "seasonal", price: 980000, oldPrice: null, image: "/products/mixed-spring.jpg", stock: 16, rating: 4.6, isBestseller: false, isNew: true, description: "ترکیبی شاد از ژربرا، میخک و نفس بچه با رنگ‌های صورتی، بنفش و سفید." },
    { slug: "bouquet-sunflower", name: "دسته‌گل آفتابگردان", category: "seasonal", price: 760000, oldPrice: 890000, image: "/products/sunflower-bouquet.jpg", stock: 12, rating: 4.8, isBestseller: true, description: "آفتابگردان‌های شاد و پرانرژی با بسته‌بندی گونی و کرافت؛ لبخند را هدیه دهید." },
    { slug: "box-love-round", name: "باکس گل عشق (گرد)", category: "box", price: 1890000, oldPrice: null, image: "/products/box-love.jpg", stock: 7, rating: 4.9, isBestseller: true, isNew: true, description: "باکس گرد صورتی پر از رزهای قرمز و صورتی تازه؛ لوکس‌ترین راه گفتن دوستت دارم." },
    { slug: "box-luxury-black", name: "باکس لوکس مشکی و طلایی", category: "box", price: 2450000, oldPrice: 2790000, image: "/products/box-luxury.jpg", stock: 5, rating: 5.0, isBestseller: false, isNew: true, description: "باکس مشکی مات با رزهای قرمز و جزئیات طلایی؛ جواهری از گل برای مناسبت‌های طلایی." },
    { slug: "orchid-white", name: "گلدان ارکیده سفید", category: "plant", price: 1950000, oldPrice: null, image: "/products/orchid-vase.jpg", stock: 6, rating: 4.7, isBestseller: false, description: "ارکیده فالانوپسیس سفید در گلدان سرامیگ شیک؛ زیبایی ماندگار برای خانه و محل کار." },
    { slug: "succulent-box", name: "باغ کوچک ساکولنت", category: "plant", price: 690000, oldPrice: 790000, image: "/products/succulent-garden.jpg", stock: 18, rating: 4.5, isBestseller: false, description: "ترکیبی از ساکولنت‌های دوست‌داشتنی در جعبه چوبی؛ هدیه‌ای که با می‌ماند." },
    { slug: "wreath-white", name: "تاج گل سفید ترحیم", category: "wreath", price: 2100000, oldPrice: null, image: "/products/wreath-condolence.jpg", stock: 9, rating: 4.9, isBestseller: false, description: "تاج‌گل محترمانه از لیلیوم و رز سفید با برگ‌های سبز؛ همدردی را با وقار بیان کنید." },
    { slug: "wreath-welcome", name: "تاج گل خوش‌آمدگویی", category: "wreath", price: 1150000, oldPrice: null, image: "/products/wreath-welcome.jpg", stock: 11, rating: 4.6, isBestseller: false, isNew: true, description: "تاج‌گل تزئینی از گل‌های خشک و پامپاس با حلقه چوبی؛ زیبایی طبیعی برای در ورودی." },
    { slug: "dried-boho", name: "دسته‌گل خشک بوگو", category: "dried", price: 850000, oldPrice: 950000, image: "/products/dried-bouquet.jpg", stock: 15, rating: 4.4, isBestseller: false, description: "دسته‌گل خشک از پامپاس، دم‌خرگوشی و رز خشک با ماندگاری بالا؛ سبک بوگ و دلنشین." },
  ];

  const products: Record<string, { id: string; name: string; price: number; image: string; stock: number }> = {};
  for (const p of productsData) {
    const row = await db.product.create({
      data: { ...p, reviews: Math.floor(Math.random() * 40) + 8 },
    });
    products[p.slug] = row;
  }
  console.log("✓ products:", Object.keys(products).length);

  // ---------- coupons ----------
  await db.coupon.createMany({
    data: [
      { code: "WELCOME", title: "۲۰٪ تخفیف خوش‌آمدگویی", type: "percent", value: 20, minOrder: 500000, maxUses: 500, used: 38 },
      { code: "NOWRUZ", title: "۱۰۰ هزار تومان هدیه نوروز", type: "amount", value: 100000, minOrder: 1000000, maxUses: 200, used: 57 },
      { code: "GOLD10", title: "۱۰٪ تخفیف اعضای طلایی", type: "percent", value: 10, minOrder: 0, maxUses: 100, used: 12 },
      { code: "SPRING1404", title: "کمپین بهاری (منقضی)", type: "percent", value: 15, minOrder: 800000, maxUses: 150, used: 150, isActive: false },
    ],
  });
  console.log("✓ coupons");

  // ---------- settings ----------
  await db.settings.create({
    data: {
      shopName: "گلستان حافظ",
      slogan: "گل، شعر و عشق در هر سفارش",
      phone: "۰۲۱-۸۸۷۷۶۶۵۵",
      email: "hello@golestanhafez.ir",
      address: "تهران، خیابان ولیعصر، کوچه یاس، پلاک ۸",
      hours: "هر روز از ۹ صبح تا ۹ شب",
      instagram: "golestan.hafez",
      telegram: "golestanhafez",
      whatsapp: "09121234567",
      shippingFee: 89000,
      freeShippingMin: 1000000,
      announcement: "ارسال رایگان سفارش‌های بالای ۱ میلیون تومان",
      isOpen: true,
      autoAccept: true,
    },
  });
  console.log("✓ settings");

  // ---------- addresses ----------
  await db.address.createMany({
    data: [
      { userId: sara.id, title: "خانه", receiver: "سارا محمدی", phone: "09122222222", province: "تهران", city: "تهران", postal: "1968743561", line: "سعادت‌آباد، بلوار دریا، خیابان گلستان، پلاک ۱۲، واحد ۳", isDefault: true, createdAt: daysAgo(58) },
      { userId: sara.id, title: "محل کار", receiver: "سارا محمدی", phone: "09122222222", province: "تهران", city: "تهران", postal: "1581996743", line: "خیابان ولیعصر، بالاتر از پارک‌وی، برج نگین، طبقه ۷", isDefault: false, createdAt: daysAgo(40) },
      { userId: reza.id, title: "خانه", receiver: "رضا کریمی", phone: "09123333333", province: "البرز", city: "کرج", postal: "3199744512", line: "گوهردشت، فاز ۳، بلوار پیروزی، کوچه ۱۴، پلاک ۸", isDefault: true, createdAt: daysAgo(34) },
    ],
  });
  console.log("✓ addresses");

  // ---------- wallet transactions ----------
  await db.walletTx.createMany({
    data: [
      { userId: sara.id, type: "gift", amount: 50000, description: "هدیه خوش‌آمدگویی — ۵۰ هزار تومان اعتبار خرید", createdAt: daysAgo(60) },
      { userId: sara.id, type: "charge", amount: 1000000, description: "شارژ کیف پول با درگاه بانکی", createdAt: daysAgo(30) },
      { userId: sara.id, type: "payment", amount: 1139000, description: "پرداخت سفارش GH-4KD9XP", createdAt: daysAgo(22) },
      { userId: sara.id, type: "charge", amount: 500000, description: "شارژ کیف پول با درگاه بانکی", createdAt: daysAgo(9) },
      { userId: reza.id, type: "gift", amount: 50000, description: "هدیه خوش‌آمدگویی — ۵۰ هزار تومان اعتبار خرید", createdAt: daysAgo(35) },
      { userId: reza.id, type: "charge", amount: 300000, description: "شارژ کیف پول با درگاه بانکی", createdAt: daysAgo(20) },
      { userId: reza.id, type: "payment", amount: 189000, description: "پرداخت سفارش GH-7MPT2R", createdAt: daysAgo(15) },
    ],
  });
  console.log("✓ wallet transactions");

  // ---------- orders (for realistic stats) ----------
  const orderPlans: {
    user: typeof sara; slug: string; qty: number; days: number; hour?: number;
    status: string; payment: string; receiver?: string; address?: string;
  }[] = [
    { user: sara, slug: "bouquet-pink-roses", qty: 1, days: 13, status: "delivered", payment: "online" },
    { user: sara, slug: "bouquet-tulips", qty: 2, days: 12, status: "delivered", payment: "wallet" },
    { user: reza, slug: "succulent-box", qty: 1, days: 11, status: "delivered", payment: "online" },
    { user: sara, slug: "bouquet-sunflower", qty: 1, days: 10, status: "delivered", payment: "online" },
    { user: reza, slug: "bouquet-spring-mix", qty: 1, days: 9, status: "cancelled", payment: "online" },
    { user: sara, slug: "box-love-round", qty: 1, days: 8, status: "delivered", payment: "wallet" },
    { user: reza, slug: "dried-boho", qty: 2, days: 7, status: "delivered", payment: "cod" },
    { user: sara, slug: "bouquet-lilies", qty: 1, days: 6, status: "delivered", payment: "online" },
    { user: reza, slug: "orchid-white", qty: 1, days: 5, status: "delivered", payment: "online" },
    { user: sara, slug: "wreath-welcome", qty: 1, days: 4, status: "delivered", payment: "online" },
    { user: reza, slug: "bouquet-pink-roses", qty: 1, days: 3, status: "shipped", payment: "wallet" },
    { user: sara, slug: "box-luxury-black", qty: 1, days: 2, status: "preparing", payment: "online" },
    { user: reza, slug: "bouquet-tulips", qty: 3, days: 1, status: "confirmed", payment: "online" },
    { user: sara, slug: "bouquet-spring-mix", qty: 1, days: 0, hour: 9, status: "pending", payment: "online" },
    { user: reza, slug: "sunflower-bouquet", qty: 1, days: 0, hour: 11, status: "pending", payment: "wallet" },
    { user: sara, slug: "orchid-white", qty: 1, days: 15, status: "delivered", payment: "online" },
    { user: reza, slug: "wreath-white", qty: 1, days: 17, status: "delivered", payment: "online" },
    { user: sara, slug: "dried-boho", qty: 1, days: 19, status: "delivered", payment: "wallet" },
  ];

  const slots = ["صبح (۹ تا ۱۲)", "ظهر (۱۲ تا ۱۵)", "عصر (۱۵ تا ۱۸)", "شب (۱۸ تا ۲۱)"];
  const addressOf = (u: typeof sara) =>
    u.id === sara.id
      ? "سعادت‌آباد، بلوار دریا، خیابان گلستان، پلاک ۱۲، واحد ۳"
      : "گوهردشت، فاز ۳، بلوار پیروزی، کوچه ۱۴، پلاک ۸";

  let orderCount = 0;
  for (const plan of orderPlans) {
    const p = products[plan.slug];
    if (!p) continue;
    const items = [{ id: p.id, name: p.name, price: p.price, qty: plan.qty, image: p.image }];
    const goodsTotal = p.price * plan.qty;
    const shipping = goodsTotal >= 1000000 ? 0 : 89000;
    const total = goodsTotal + shipping;
    const pointsEarned = Math.floor(total / 100000) * 5;
    await db.order.create({
      data: {
        code: genCode(),
        userId: plan.user.id,
        customerName: plan.user.name,
        phone: plan.user.phone,
        address: addressOf(plan.user),
        city: plan.user.city,
        province: plan.user.city === "کرج" ? "البرز" : "تهران",
        postal: plan.user.id === sara.id ? "1968743561" : "3199744512",
        deliveryDate: "—",
        deliverySlot: slots[Math.floor(Math.random() * slots.length)],
        cardMessage: Math.random() > 0.5 ? "با آرزوی لحظه‌های شیرین 🌸" : "",
        addons: JSON.stringify(Math.random() > 0.7 ? [{ id: "bear", name: "خرس عروسکی", price: 250000 }] : []),
        couponCode: Math.random() > 0.8 ? "WELCOME" : "",
        paymentMethod: plan.payment,
        shippingCost: shipping,
        discount: 0,
        pointsEarned,
        items: JSON.stringify(items),
        total,
        status: plan.status,
        createdAt: daysAgo(plan.days, plan.hour ?? 10),
        updatedAt: daysAgo(plan.days, (plan.hour ?? 10) + 2),
      },
    });
    orderCount++;
  }
  console.log("✓ orders:", orderCount);

  // ---------- favorites ----------
  await db.favorite.createMany({
    data: [
      { userId: sara.id, productId: products["box-luxury-black"].id, name: products["box-luxury-black"].name, price: products["box-luxury-black"].price, image: products["box-luxury-black"].image },
      { userId: sara.id, productId: products["orchid-white"].id, name: products["orchid-white"].name, price: products["orchid-white"].price, image: products["orchid-white"].image },
      { userId: reza.id, productId: products["bouquet-sunflower"].id, name: products["bouquet-sunflower"].name, price: products["bouquet-sunflower"].price, image: products["bouquet-sunflower"].image },
    ],
  });
  console.log("✓ favorites");

  // ---------- reviews ----------
  await db.review.createMany({
    data: [
      { userId: sara.id, productId: products["bouquet-pink-roses"].id, productName: products["bouquet-pink-roses"].name, productImage: products["bouquet-pink-roses"].image, author: "سارا محمدی", rating: 5, comment: "رزها فوق‌العاده تازه و بسته‌بندی خیلی شیک بود. گیرنده ذوق‌زده شد!", status: "approved", createdAt: daysAgo(12) },
      { userId: sara.id, productId: products["box-love-round"].id, productName: products["box-love-round"].name, productImage: products["box-love-round"].image, author: "سارا محمدی", rating: 5, comment: "باکس عشق دقیقاً مثل عکس بود. ارسال هم سر وقت انجام شد.", status: "approved", createdAt: daysAgo(7) },
      { userId: reza.id, productId: products["succulent-box"].id, productName: products["succulent-box"].name, productImage: products["succulent-box"].image, author: "رضا کریمی", rating: 4, comment: "ساکولنت‌ها سالم بودند ولی جعبه کمی کوچک‌تر از تصویر بود.", status: "pending", createdAt: daysAgo(10) },
      { userId: reza.id, productId: products["bouquet-tulips"].id, productName: products["bouquet-tulips"].name, productImage: products["bouquet-tulips"].image, author: "رضا کریمی", rating: 5, comment: "لاله‌ها خیلی تازه بودند، ممنون از تیم گلستان حافظ.", status: "approved", createdAt: daysAgo(5) },
    ],
  });
  console.log("✓ reviews");

  // ---------- tickets ----------
  const t1 = await db.ticket.create({
    data: {
      code: "TK-A1B2C3",
      userId: sara.id,
      subject: "امکان ارسال در تاریخ مشخص؟",
      category: "order",
      priority: "normal",
      status: "answered",
      userName: sara.name,
      phone: sara.phone,
      createdAt: daysAgo(6),
      updatedAt: daysAgo(5),
    },
  });
  await db.ticketMsg.createMany({
    data: [
      { ticketId: t1.id, sender: "user", senderName: sara.name, body: "سلام، می‌خواستم بدونم آیا امکان داره سفارشم دقیقاً روز تولد همسرم تحویل داده بشه؟", createdAt: daysAgo(6) },
      { ticketId: t1.id, sender: "admin", senderName: "پشتیبانی گلستان حافظ", body: "سلام و وقت بخیر 🌸 بله حتماً؛ هنگام ثبت سفارش می‌توانید تاریخ و بازه ساعتی دلخواه را انتخاب کنید. ما دقیقاً در زمان انتخابی شما ارسال را انجام می‌دهیم.", createdAt: daysAgo(5) },
    ],
  });
  const t2 = await db.ticket.create({
    data: {
      code: "TK-D4E5F6",
      userId: reza.id,
      subject: "بازگشت وجه سفارش لغوشده",
      category: "refund",
      priority: "high",
      status: "open",
      userName: reza.name,
      phone: reza.phone,
      createdAt: daysAgo(2),
      updatedAt: daysAgo(2),
    },
  });
  await db.ticketMsg.createMany({
    data: [
      { ticketId: t2.id, sender: "user", senderName: reza.name, body: "سفارشم لغو شد ولی وجه هنوز به حسابم برنگشته. لطفاً بررسی کنید.", createdAt: daysAgo(2) },
    ],
  });
  console.log("✓ tickets");

  // ---------- notifications ----------
  await db.notification.createMany({
    data: [
      { userId: sara.id, title: "به خانواده گلستان حافظ خوش آمدید 🌸", body: "حساب شما با موفقیت ساخته شد. اولین سفارش خود را با کد تخفیف WELCOME با ۲۰٪ تخفیف ثبت کنید.", type: "system", isRead: true, createdAt: daysAgo(60) },
      { userId: sara.id, title: "سفارش شما تحویل داده شد", body: "سفارش شما با موفقیت به دست گیرنده رسید. از انتخاب گلستان حافظ سپاسگزاریم.", type: "order", isRead: true, createdAt: daysAgo(8) },
      { userId: sara.id, title: "کیف پول شارژ شد", body: "مبلغ ۵۰۰٬۰۰۰ تومان با موفقیت به کیف پول شما اضافه شد.", type: "wallet", isRead: false, createdAt: daysAgo(9) },
      { userId: sara.id, title: "کد تخفیف ویژه اعضای طلایی 🌟", body: "با کد GOLD10 از ۱۰٪ تخفیف ویژه روی همه سفارش‌ها استفاده کنید.", type: "promo", isRead: false, createdAt: daysAgo(3) },
      { userId: reza.id, title: "به خانواده گلستان حافظ خوش آمدید 🌸", body: "حساب شما با موفقیت ساخته شد. اولین سفارش خود را با کد تخفیف WELCOME با ۲۰٪ تخفیف ثبت کنید.", type: "system", isRead: true, createdAt: daysAgo(35) },
      { userId: reza.id, title: "پاسخ تیکت TK-A1B2C3", body: "پشتیبانی به تیکت شما پاسخ داد. برای مشاهده وارد پنل شوید.", type: "ticket", isRead: false, createdAt: daysAgo(5) },
    ],
  });
  console.log("✓ notifications");

  // ---------- contact messages ----------
  await db.message.createMany({
    data: [
      { name: "مریم احمدی", phone: "09124444444", subject: "همکاری سازمانی", body: "سلام، برای تزئین گل ماهانه دفتر شرکت به مشاوره و تعرفه نیاز داریم.", isRead: false, createdAt: daysAgo(3) },
      { name: "علی رضایی", phone: "09125555555", subject: "سوال درباره ارسال شهرستان", body: "آیا به اصفهان هم ارسال دارید؟ چند روز طول می‌کشد؟", isRead: false, createdAt: daysAgo(1) },
    ],
  });
  console.log("✓ messages");

  console.log("\n🎉 Seed complete!");
  console.log("─────────────────────────────────────");
  console.log("👑 مدیر: 09121111111 — رمز:", process.env.ADMIN_PASSWORD ? "(از ADMIN_PASSWORD)" : ADMIN_PASSWORD);
  console.log("👤 مشتریان نمونه با رمز تصادفی ساخته شدند (برای ورود از «فراموشی/تعیین رمز» توسط مدیر استفاده کنید).");
  console.log("🎟 کدها:   WELCOME (۲۰٪) | NOWRUZ (۱۰۰هزار) | GOLD10 (۱۰٪)");
  console.log("─────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
