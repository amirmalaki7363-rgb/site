import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, normalizePhone } from "@/lib/auth";
import { ADDON_OPTIONS } from "@/lib/shop-options";
import { createGatewayPayment, fulfillOrderPayment } from "@/lib/payment";
import { randomInt } from "crypto";
import { assertSameOrigin, clientIp, isRateLimited, siteOrigin, str, tooManyRequests } from "@/lib/security";

export const dynamic = "force-dynamic";

interface AddonBody {
  id: string;
  name: string;
  price: number;
}

interface OrderBody {
  receiverName: string;
  phone: string;
  address: string;
  city?: string;
  province?: string;
  postal?: string;
  deliveryDate?: string;
  deliverySlot?: string;
  cardMessage?: string;
  addons?: AddonBody[];
  note?: string;
  couponCode?: string;
  paymentMethod?: string; // online | wallet | cod
  items: { productId: string; qty: number }[];
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateTrackingCode(): string {
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return `GH-${suffix}`;
}

function faMoney(n: number): string {
  return new Intl.NumberFormat("fa-IR").format(n);
}

export async function POST(req: NextRequest) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;
  try {
    // ---------- session required ----------
    const session = await getSessionUser(req);
    if (!session || "banned" in session) {
      return NextResponse.json(
        { success: false, error: "برای ثبت سفارش ابتدا وارد حساب خود شوید یا ثبت‌نام کنید." },
        { status: 401 }
      );
    }
    const me = session.user;

    if (isRateLimited(`order:${me.id}`, 20, 10 * 60_000)) return tooManyRequests();

    const body = (await req.json().catch(() => ({}))) as OrderBody;
    const receiverName = str(body.receiverName, 80);
    const phone = normalizePhone(str(body.phone, 20));
    const address = str(body.address, 500);

    if (receiverName.length < 3) {
      return NextResponse.json(
        { success: false, error: "نام گیرنده را کامل وارد کنید." },
        { status: 400 }
      );
    }
    if (!/^0\d{10}$/.test(phone)) {
      return NextResponse.json(
        { success: false, error: "شماره تماس باید ۱۱ رقم و با صفر شروع شود." },
        { status: 400 }
      );
    }
    if (address.length < 10) {
      return NextResponse.json(
        { success: false, error: "آدرس تحویل را کامل وارد کنید." },
        { status: 400 }
      );
    }
    if (!Array.isArray(body?.items) || !body.items.length || body.items.length > 50) {
      return NextResponse.json(
        { success: false, error: "سبد خرید شما خالی است." },
        { status: 400 }
      );
    }

    // ---------- server-side price calculation (never trust the client) ----------
    // normalise cart lines: valid ids, finite integer qty, duplicates merged (a split cart must not bypass stock/limits)
    const merged = new Map<string, number>();
    for (const raw of body.items) {
      const pid = typeof raw?.productId === "string" ? raw.productId : "";
      const q = Number(raw?.qty);
      if (!pid || !Number.isFinite(q) || q < 1) {
        return NextResponse.json(
          { success: false, error: "اقلام سبد خرید نامعتبر است." },
          { status: 400 }
        );
      }
      merged.set(pid, Math.min(20, (merged.get(pid) ?? 0) + Math.min(20, Math.floor(q))));
    }
    const cartLines = [...merged.entries()].map(([productId, qty]) => ({ productId, qty }));
    const productIds = cartLines.map((i) => i.productId);
    const products = await db.product.findMany({ where: { id: { in: productIds } } });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const orderItems: { id: string; name: string; price: number; qty: number; image: string }[] = [];
    let subtotal = 0;
    for (const item of cartLines) {
      const p = productMap.get(item.productId);
      if (!p || !p.isActive) {
        return NextResponse.json(
          { success: false, error: "یکی از محصولات سبد دیگر موجود نیست. سبد را به‌روزرسانی کنید." },
          { status: 400 }
        );
      }
      const qty = item.qty;
      if (p.stock < qty) {
        return NextResponse.json(
          { success: false, error: `موجودی «${p.name}» کافی نیست (${faMoney(p.stock)} عدد باقی مانده).` },
          { status: 400 }
        );
      }
      subtotal += p.price * qty;
      orderItems.push({ id: p.id, name: p.name, price: p.price, qty, image: p.image });
    }

    // ---------- addons validated against server list ----------
    const addons: AddonBody[] = [];
    let addonsTotal = 0;
    for (const a of body.addons ?? []) {
      const known = ADDON_OPTIONS.find((x) => x.id === a.id);
      if (known) {
        addons.push({ id: known.id, name: known.name, price: known.price });
        addonsTotal += known.price;
      }
    }

    // ---------- shipping from real settings ----------
    // هزینه تحویل با اسنپ همیشه به عهده مشتری است (بدون سقف ارسال رایگان)
    const settings = await db.settings.findFirst();
    const shippingFee = settings?.shippingFee ?? 89000;
    const shipping = subtotal > 0 ? shippingFee : 0;

    // ---------- coupon validation ----------
    let discount = 0;
    let appliedCouponCode = "";
    const rawCoupon = str(body.couponCode, 40).toUpperCase();
    if (rawCoupon) {
      const coupon = await db.coupon.findUnique({ where: { code: rawCoupon } });
      const now = new Date();
      const notExpired =
        !coupon?.expiresAt || !coupon.expiresAt.trim() || new Date(coupon.expiresAt) > now;
      if (!coupon || !coupon.isActive || !notExpired) {
        return NextResponse.json(
          { success: false, error: "کد تخفیف معتبر نیست یا منقضی شده است." },
          { status: 400 }
        );
      }
      if (coupon.used >= coupon.maxUses) {
        return NextResponse.json(
          { success: false, error: "ظرفیت استفاده از این کد تخفیف تمام شده است." },
          { status: 400 }
        );
      }
      if (subtotal < coupon.minOrder) {
        return NextResponse.json(
          { success: false, error: `این کد برای سفارش‌های بالای ${faMoney(coupon.minOrder)} تومان است.` },
          { status: 400 }
        );
      }
      discount =
        coupon.type === "percent"
          ? Math.round((subtotal * coupon.value) / 100)
          : coupon.value;
      discount = Math.min(discount, subtotal + shipping);
      appliedCouponCode = coupon.code;
    }

    const total = Math.max(0, subtotal + shipping + addonsTotal - discount);

    // ---------- payment ----------
    const paymentMethod = ["online", "wallet", "cod"].includes(body.paymentMethod ?? "")
      ? (body.paymentMethod as string)
      : "online";

    if (paymentMethod === "wallet") {
      const meRow = await db.user.findUnique({ where: { id: me.id } });
      if (!meRow || meRow.walletBalance < total) {
        return NextResponse.json(
          { success: false, error: "موجودی کیف پول کافی نیست. ابتدا کیف پول را شارژ کنید یا روش پرداخت دیگری انتخاب کنید." },
          { status: 402 }
        );
      }
    }
    // ---------- tracking code ----------
    let code = generateTrackingCode();
    for (let i = 0; i < 5; i++) {
      const exists = await db.order.findUnique({ where: { code } });
      if (!exists) break;
      code = generateTrackingCode();
    }

    const pointsEarned = Math.floor(total / 100000) * 5;

    const order = await db.order.create({
      data: {
        code,
        userId: me.id,
        customerName: receiverName,
        phone,
        address,
        city: str(body.city, 60) || "تهران",
        province: str(body.province, 60) || "تهران",
        postal: str(body.postal, 20),
        deliveryDate: str(body.deliveryDate, 60),
        deliverySlot: str(body.deliverySlot, 60),
        cardMessage: str(body.cardMessage, 400),
        addons: JSON.stringify(addons),
        couponCode: appliedCouponCode,
        paymentMethod,
        shippingCost: shipping,
        discount,
        pointsEarned,
        note: str(body.note, 500) || null,
        items: JSON.stringify(orderItems),
        total,
        status: "pending",
      },
    });

    // ---------- online payment → redirect to the internet payment gateway ----------
    // سفارش با paidAt=null و بدون تسویه (انبار/کوپن/امتیاز) ساخته می‌شود؛
    // تسویه فقط بعد از تأیید تراکنش در fulfillOrderPayment انجام می‌شود.
    if (paymentMethod === "online") {
      const origin = siteOrigin(req);
      const gw = await createGatewayPayment({
        userId: me.id,
        amount: total,
        kind: "order",
        orderId: order.id,
        description: `پرداخت سفارش ${order.code} — گلستان حافظ`,
        origin,
        mobile: phone,
      });
      if (!gw.ok) {
        return NextResponse.json(
          { success: false, error: "اتصال به درگاه پرداخت برقرار نشد. لطفاً دوباره تلاش کنید." },
          { status: 502 }
        );
      }
      return NextResponse.json({
        success: true,
        needPayment: true,
        orderId: order.id,
        code: order.code,
        total,
        authority: gw.authority,
        gateway: gw.gateway,
        redirectUrl: gw.redirectUrl,
        message: "سفارش شما ثبت شد؛ در حال انتقال به درگاه پرداخت...",
      });
    }

    // ---------- wallet / cod: تسویه فوری ----------
    if (paymentMethod === "wallet") {
      // atomic debit: succeeds only if the balance still covers the total (no double-spend under concurrency)
      const debit = await db.user.updateMany({
        where: { id: me.id, walletBalance: { gte: total } },
        data: { walletBalance: { decrement: total } },
      });
      if (debit.count !== 1) {
        await db.order.delete({ where: { id: order.id } }).catch(() => undefined);
        return NextResponse.json(
          { success: false, error: "موجودی کیف پول کافی نیست. ابتدا کیف پول را شارژ کنید یا روش پرداخت دیگری انتخاب کنید." },
          { status: 402 }
        );
      }
    }
    const settled = await fulfillOrderPayment(order.id, paymentMethod === "wallet" ? "WALLET" : "");
    if (!settled.ok) {
      if (paymentMethod === "wallet") {
        await db.user.update({ where: { id: me.id }, data: { walletBalance: { increment: total } } });
      }
      await db.order.delete({ where: { id: order.id } }).catch(() => undefined);
      return NextResponse.json({ success: false, error: settled.error ?? "ثبت سفارش انجام نشد." }, { status: 409 });
    }
    if (paymentMethod === "wallet") {
      await db.walletTx.create({
        data: {
          userId: me.id, type: "payment", amount: total,
          description: `پرداخت سفارش ${order.code}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      code: order.code,
      total,
      pointsEarned,
      message: "سفارش شما با موفقیت ثبت شد!",
    });
  } catch (error) {
    console.error("POST /api/orders error:", error);
    return NextResponse.json(
      { success: false, error: "خطا در ثبت سفارش. لطفاً دوباره تلاش کنید." },
      { status: 500 }
    );
  }
}

/** keep first name only / mask the street part of the address for anonymous lookups */
function maskName(n: string): string {
  const first = n.trim().split(/\s+/)[0] ?? "";
  return first ? `${first} ★` : "—";
}
function maskAddress(a: string): string {
  const t = a.trim();
  return t.length <= 12 ? "••••" : `${t.slice(0, 8)}…`;
}

export async function GET(req: NextRequest) {
  try {
    // public lookup: throttle to make code enumeration impractical
    if (isRateLimited(`track:${clientIp(req)}`, 20, 10 * 60_000)) return tooManyRequests();

    const code = req.nextUrl.searchParams.get("code")?.trim().toUpperCase().slice(0, 20);
    if (!code || !/^[A-Z0-9-]{4,20}$/.test(code)) {
      return NextResponse.json(
        { success: false, error: "کد رهگیری را وارد کنید." },
        { status: 400 }
      );
    }
    const order = await db.order.findUnique({ where: { code } });
    if (!order) {
      return NextResponse.json(
        { success: false, error: "سفارشی با این کد رهگیری پیدا نشد." },
        { status: 404 }
      );
    }
    // the owner (or an admin) sees full details; everybody else gets a privacy-safe view
    const session = await getSessionUser(req);
    const viewer = session && "user" in session ? session.user : null;
    const full = !!viewer && (viewer.id === order.userId || viewer.role === "admin");
    return NextResponse.json({
      success: true,
      order: {
        code: order.code,
        customerName: full ? order.customerName : maskName(order.customerName),
        address: full ? order.address : maskAddress(order.address),
        deliveryDate: order.deliveryDate,
        deliverySlot: order.deliverySlot,
        cardMessage: full ? order.cardMessage : "",
        addons: JSON.parse(order.addons || "[]"),
        items: JSON.parse(order.items || "[]"),
        total: order.total,
        status: order.status,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json(
      { success: false, error: "خطا در جستجوی سفارش." },
      { status: 500 }
    );
  }
}
