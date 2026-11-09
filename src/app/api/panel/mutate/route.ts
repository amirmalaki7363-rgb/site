import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  hashPassword, requireAdmin, requireUser, verifyPassword, normalizePhone,
  passwordPolicyError, setSessionCookie,
} from "@/lib/auth";
import { assertSameOrigin, isRateLimited, pick, str, tooManyRequests } from "@/lib/security";
import { randomBytes, randomInt } from "crypto";

export const dynamic = "force-dynamic";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function genCode(): string {
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return `GH-${suffix}`;
}

const ADMIN_ACTIONS = new Set([
  "product.create", "product.update", "product.delete", "product.setStock",
  "order.setStatus", "order.delete", "order.create",
  "customer.create", "customer.update", "customer.delete",
  "coupon.create", "coupon.update", "coupon.delete",
  "settings.update",
  "message.read", "message.readAll", "message.delete",
  "review.setStatus",
  "notification.create",
  "ticket.setStatus", "ticket.delete",
]);

// explicit allow-lists: never pass client objects straight into Prisma (mass assignment)
const ADDRESS_FIELDS = ["title", "receiver", "phone", "province", "city", "postal", "line", "isDefault"] as const;
const PRODUCT_FIELDS = ["name", "description", "category", "price", "oldPrice", "image", "stock", "isBestseller", "isNew", "isActive"] as const;
const COUPON_FIELDS = ["title", "type", "value", "minOrder", "maxUses", "expiresAt", "isActive"] as const;
const SETTINGS_FIELDS = [
  "shopName", "slogan", "phone", "email", "address", "hours", "instagram", "telegram", "whatsapp",
  "shippingFee", "freeShippingMin", "announcement", "isOpen", "autoAccept", "paymentGateway", "zarinpalMerchantId",
] as const;

function validType(v: unknown, t: "string" | "number" | "boolean"): boolean {
  return typeof v === t && (t !== "number" || Number.isFinite(v as number));
}
/** keep only fields whose runtime type matches the Prisma column type */
function typed(src: Record<string, unknown>, types: Record<string, "string" | "number" | "boolean" | "nullable-number">) {
  const out: Record<string, unknown> = {};
  for (const [k, t] of Object.entries(types)) {
    if (!(k in src)) continue;
    const v = src[k];
    if (t === "nullable-number") { if (v === null || validType(v, "number")) out[k] = v; }
    else if (validType(v, t)) out[k] = typeof v === "string" ? v.slice(0, 2000) : v;
  }
  return out;
}

export async function POST(req: NextRequest) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;
  try {
    const body = (await req.json()) as {
      action: string;
      id?: string;
      status?: string;
      amount?: number;
      data?: Record<string, unknown>;
    };
    const { action, id, data } = body;
    if (!action) {
      return NextResponse.json({ success: false, error: "اکشن نامعتبر" }, { status: 400 });
    }
    // ---------- auth ----------
    const admin = ADMIN_ACTIONS.has(action) ? await requireAdmin(req) : null;
    if (ADMIN_ACTIONS.has(action) && !admin) {
      return NextResponse.json(
        { success: false, error: "شما دسترسی مدیریتی برای این عملیات را ندارید." },
        { status: 403 }
      );
    }
    const user = await requireUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "برای انجام این عملیات باید وارد حساب شوید." },
        { status: 401 }
      );
    }

    if (isRateLimited(`mutate:${user.id}`, 240, 60_000)) return tooManyRequests();
    if (typeof action !== "string" || (id !== undefined && typeof id !== "string")) {
      return NextResponse.json({ success: false, error: "درخواست نامعتبر" }, { status: 400 });
    }

    switch (action) {
      // ================= profile (self) =================
      case "profile.update": {
        const d = data as Record<string, string | number | boolean>;
        const update: Record<string, unknown> = {};
        if (typeof d.name === "string" && d.name.trim().length >= 3) update.name = d.name.trim().slice(0, 80);
        if (typeof d.email === "string") {
          if (d.email && !/^\S+@\S+\.\S+$/.test(d.email)) {
            return NextResponse.json({ success: false, error: "ایمیل معتبر نیست." }, { status: 400 });
          }
          update.email = d.email.slice(0, 120);
        }
        if (typeof d.phone === "string") {
          const phone = normalizePhone(d.phone);
          if (!/^0\d{10}$/.test(phone)) {
            return NextResponse.json({ success: false, error: "شماره موبایل معتبر نیست." }, { status: 400 });
          }
          if (phone !== user.phone) {
            const taken = await db.user.findUnique({ where: { phone } });
            if (taken) {
              return NextResponse.json({ success: false, error: "این شماره به حساب دیگری تعلق دارد." }, { status: 409 });
            }
            update.phone = phone;
          }
        }
        for (const k of ["birthday", "gender", "city"] as const) {
          if (typeof d[k] === "string") update[k] = (d[k] as string).slice(0, 60);
        }
        if (typeof d.avatarHue === "number" && Number.isInteger(d.avatarHue) && d.avatarHue >= 0 && d.avatarHue < 10) update.avatarHue = d.avatarHue;
        if (typeof d.emailOffers === "boolean") update.emailOffers = d.emailOffers;
        if (typeof d.smsOffers === "boolean") update.smsOffers = d.smsOffers;
        await db.user.update({ where: { id: user.id }, data: update });
        return NextResponse.json({ success: true });
      }

      // ================= addresses (own) =================
      case "address.create": {
        const a = data as { title: string; receiver: string; phone: string; province: string; city: string; postal?: string; line: string; isDefault?: boolean };
        if (!a.title?.trim() || !a.receiver?.trim() || !a.phone?.trim() || !a.line?.trim()) {
          return NextResponse.json({ success: false, error: "لطفاً فیلدهای ضروری را کامل کنید." }, { status: 400 });
        }
        if (a.isDefault) {
          await db.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
        }
        const count = await db.address.count({ where: { userId: user.id } });
        const address = await db.address.create({
          data: {
            userId: user.id,
            title: a.title.trim(), receiver: a.receiver.trim(), phone: a.phone.trim(),
            province: a.province || "تهران", city: a.city.trim(), postal: a.postal ?? "",
            line: a.line.trim(), isDefault: a.isDefault || count === 0,
          },
        });
        return NextResponse.json({ success: true, data: address });
      }
      case "address.update": {
        const existing = await db.address.findUnique({ where: { id } });
        if (!existing || existing.userId !== user.id) {
          return NextResponse.json({ success: false, error: "آدرس یافت نشد." }, { status: 404 });
        }
        const a = typed(pick(data, ADDRESS_FIELDS), {
          title: "string", receiver: "string", phone: "string", province: "string",
          city: "string", postal: "string", line: "string", isDefault: "boolean",
        });
        if (a.isDefault) {
          await db.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
        }
        await db.address.update({ where: { id }, data: a });
        return NextResponse.json({ success: true });
      }
      case "address.delete": {
        const existing = await db.address.findUnique({ where: { id } });
        if (!existing || existing.userId !== user.id) {
          return NextResponse.json({ success: false, error: "آدرس یافت نشد." }, { status: 404 });
        }
        await db.address.delete({ where: { id } });
        return NextResponse.json({ success: true });
      }
      case "address.setDefault": {
        const existing = await db.address.findUnique({ where: { id } });
        if (!existing || existing.userId !== user.id) {
          return NextResponse.json({ success: false, error: "آدرس یافت نشد." }, { status: 404 });
        }
        await db.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
        await db.address.update({ where: { id }, data: { isDefault: true } });
        return NextResponse.json({ success: true });
      }

      // ================= wallet (own) =================
      // NOTE: "wallet.charge" used to credit the wallet WITHOUT any payment. Wallet top-ups are only
      // possible through the payment gateway (/api/payment action "wallet-charge").
      case "wallet.charge": {
        return NextResponse.json(
          { success: false, error: "شارژ کیف پول فقط از طریق درگاه پرداخت ممکن است." },
          { status: 403 }
        );
      }

      // ================= favorites (own) =================
      case "favorite.add": {
        const f = data as { productId: string; name?: string; price?: number; image?: string };
        if (!f.productId) {
          return NextResponse.json({ success: false, error: "محصول نامعتبر است." }, { status: 400 });
        }
        const product = await db.product.findUnique({ where: { id: f.productId } });
        if (!product) {
          return NextResponse.json({ success: false, error: "محصول یافت نشد." }, { status: 404 });
        }
        await db.favorite.upsert({
          where: { userId_productId: { userId: user.id, productId: product.id } },
          create: { userId: user.id, productId: product.id, name: product.name, price: product.price, image: product.image },
          update: {},
        });
        return NextResponse.json({ success: true });
      }
      case "favorite.remove": {
        const f = data as { productId?: string };
        if (f.productId) {
          await db.favorite.deleteMany({
            where: { userId: user.id, productId: f.productId },
          });
        } else if (id) {
          await db.favorite.deleteMany({ where: { userId: user.id, id } });
        }
        return NextResponse.json({ success: true });
      }

      // ================= reviews =================
      case "review.create": {
        const r = (data ?? {}) as { productId?: unknown; rating?: unknown; comment?: unknown };
        const comment = typeof r.comment === "string" ? r.comment.trim() : "";
        if (typeof r.productId !== "string" || !comment) {
          return NextResponse.json({ success: false, error: "محصول و متن نظر الزامی است." }, { status: 400 });
        }
        // name/image come from OUR database, never from the client
        const product = await db.product.findUnique({ where: { id: r.productId } });
        if (!product) {
          return NextResponse.json({ success: false, error: "محصول یافت نشد." }, { status: 404 });
        }
        const already = await db.review.findFirst({ where: { userId: user.id, productId: product.id } });
        if (already) {
          return NextResponse.json({ success: false, error: "قبلاً برای این محصول نظر ثبت کرده‌اید." }, { status: 409 });
        }
        const rating = Number(r.rating);
        const review = await db.review.create({
          data: {
            userId: user.id,
            productId: product.id, productName: product.name, productImage: product.image,
            author: user.name, rating: Number.isFinite(rating) ? Math.min(5, Math.max(1, Math.round(rating))) : 5,
            comment: comment.slice(0, 2000), status: "pending",
          },
        });
        return NextResponse.json({ success: true, data: review });
      }

      case "review.update": {
        const owned = await db.review.findUnique({ where: { id } });
        if (!owned || owned.userId !== user.id) {
          return NextResponse.json({ success: false, error: "نظر یافت نشد." }, { status: 404 });
        }
        const r = (data ?? {}) as { rating?: unknown; comment?: unknown };
        const upd: { rating?: number; comment?: string } = {};
        if (typeof r.rating === "number" && Number.isFinite(r.rating)) upd.rating = Math.min(5, Math.max(1, Math.round(r.rating)));
        if (typeof r.comment === "string" && r.comment.trim()) upd.comment = r.comment.trim().slice(0, 2000);
        await db.review.update({ where: { id }, data: { ...upd, status: "pending" } });
        return NextResponse.json({ success: true });
      }
      case "review.delete": {
        const owned = await db.review.findUnique({ where: { id } });
        if (!owned || (owned.userId !== user.id && user.role !== "admin")) {
          return NextResponse.json({ success: false, error: "نظر یافت نشد." }, { status: 404 });
        }
        await db.review.delete({ where: { id } });
        return NextResponse.json({ success: true });
      }
      case "review.setStatus": {
        await db.review.update({ where: { id }, data: { status: body.status ?? "approved" } });
        return NextResponse.json({ success: true });
      }

      // ================= notifications (own) =================
      case "notification.read": {
        const n = await db.notification.findUnique({ where: { id } });
        if (!n || n.userId !== user.id) {
          return NextResponse.json({ success: false, error: "اعلان یافت نشد." }, { status: 404 });
        }
        await db.notification.update({ where: { id }, data: { isRead: true } });
        return NextResponse.json({ success: true });
      }
      case "notification.readAll": {
        await db.notification.updateMany({ where: { userId: user.id }, data: { isRead: true } });
        return NextResponse.json({ success: true });
      }
      case "notification.delete": {
        const n = await db.notification.findUnique({ where: { id } });
        if (!n || n.userId !== user.id) {
          return NextResponse.json({ success: false, error: "اعلان یافت نشد." }, { status: 404 });
        }
        await db.notification.delete({ where: { id } });
        return NextResponse.json({ success: true });
      }
      case "notification.create": {
        // admin broadcast (or targeted)
        const n = data as { title: string; body: string; type?: string; userId?: string };
        if (!n.title?.trim() || !n.body?.trim()) {
          return NextResponse.json({ success: false, error: "عنوان و متن اعلان الزامی است." }, { status: 400 });
        }
        if (n.userId) {
          await db.notification.create({
            data: { userId: n.userId, title: n.title.trim(), body: n.body.trim(), type: n.type ?? "system" },
          });
        } else {
          const users = await db.user.findMany({ where: { isBanned: false }, select: { id: true } });
          await db.notification.createMany({
            data: users.map((u) => ({
              userId: u.id, title: n.title.trim(), body: n.body.trim(), type: n.type ?? "system",
            })),
          });
        }
        return NextResponse.json({ success: true });
      }

      // ================= orders =================
      case "order.setStatus": {
        const order = await db.order.findUnique({ where: { id } });
        if (!order) return NextResponse.json({ success: false, error: "سفارش یافت نشد." }, { status: 404 });
        const status = body.status ?? "pending";
        await db.order.update({ where: { id }, data: { status } });
        const labels: Record<string, string> = {
          pending: "در انتظار تأیید", confirmed: "تأیید شده", preparing: "در حال آماده‌سازی",
          shipped: "ارسال شده", delivered: "تحویل داده شد", cancelled: "لغو شد",
        };
        await db.notification.create({
          data: {
            userId: order.userId, type: "order",
            title: `سفارش ${order.code} ${labels[status] ?? "به‌روزرسانی شد"}`,
            body: `وضعیت سفارش شما به «${labels[status] ?? status}» تغییر کرد.`,
          },
        });
        return NextResponse.json({ success: true });
      }
      case "order.cancel": {
        // user cancelling own order (only before preparation) — admin can cancel any
        const order = await db.order.findUnique({ where: { id } });
        if (!order) return NextResponse.json({ success: false, error: "سفارش یافت نشد." }, { status: 404 });
        if (order.userId !== user.id && user.role !== "admin") {
          return NextResponse.json({ success: false, error: "این سفارش متعلق به شما نیست." }, { status: 403 });
        }
        if (!["pending", "confirmed"].includes(order.status)) {
          return NextResponse.json(
            { success: false, error: "سفارش‌های در حال آماده‌سازی قابل لغو نیستند؛ با پشتیبانی تماس بگیرید." },
            { status: 400 }
          );
        }
        // atomic state change: a double-click / parallel request cannot refund twice
        const flip = await db.order.updateMany({
          where: { id, status: { in: ["pending", "confirmed"] } },
          data: { status: "cancelled" },
        });
        if (flip.count !== 1) {
          return NextResponse.json({ success: false, error: "این سفارش قبلاً تغییر کرده است." }, { status: 409 });
        }
        // Stock / coupon / points are only touched at settlement (paidAt). Reverting them for an
        // UNPAID order would inflate stock and push points negative.
        if (order.paidAt) {
          let items: { id: string; qty: number }[] = [];
          try { items = JSON.parse(order.items || "[]"); } catch { items = []; }
          for (const it of items) {
            await db.product.updateMany({ where: { id: it.id }, data: { stock: { increment: it.qty } } });
          }
          if (order.paymentMethod === "wallet") {
            await db.user.update({ where: { id: order.userId }, data: { walletBalance: { increment: order.total } } });
            await db.walletTx.create({
              data: {
                userId: order.userId, type: "refund", amount: order.total,
                description: `بازگشت وجه سفارش لغوشده ${order.code}`,
              },
            });
          }
          if (order.pointsEarned > 0) {
            const u = await db.user.findUnique({ where: { id: order.userId } });
            const dec = Math.min(order.pointsEarned, u?.points ?? 0);
            if (dec > 0) await db.user.update({ where: { id: order.userId }, data: { points: { decrement: dec } } });
          }
          if (order.couponCode) {
            await db.coupon.updateMany({ where: { code: order.couponCode, used: { gt: 0 } }, data: { used: { decrement: 1 } } });
          }
        }
        await db.notification.create({
          data: {
            userId: order.userId, type: "order",
            title: `سفارش ${order.code} لغو شد`,
            body: order.paymentMethod === "wallet" && order.paidAt
              ? "مبلغ سفارش به‌صورت کامل به کیف پول شما بازگشت داده شد."
              : "در صورت پرداخت آنلاین، وجه تا ۷۲ ساعت آینده به حساب شما بازمی‌گردد.",
          },
        });
        return NextResponse.json({ success: true });
      }
      case "order.delete": {
        await db.order.delete({ where: { id } });
        return NextResponse.json({ success: true });
      }
      case "order.create": {
        // admin manually creating an order for a customer
        const o = data as {
          customerName: string; phone: string; address: string; items: { id: string; name: string; price: number; qty: number }[];
          total: number; status?: string; deliveryDate?: string; deliverySlot?: string;
        };
        if (!o.customerName?.trim() || !o.phone?.trim() || !o.items?.length) {
          return NextResponse.json({ success: false, error: "نام، تلفن و اقلام سفارش الزامی است." }, { status: 400 });
        }
        if (!Number.isFinite(o.total) || o.total < 0 || o.total > 1_000_000_000 || o.items.length > 100) {
          return NextResponse.json({ success: false, error: "مبلغ یا اقلام سفارش نامعتبر است." }, { status: 400 });
        }
        const customer = await db.user.findUnique({ where: { phone: normalizePhone(o.phone.trim()) } });
        const order = await db.order.create({
          data: {
            code: genCode(),
            userId: customer?.id ?? admin!.id,
            customerName: o.customerName.trim(),
            phone: o.phone.trim(),
            address: o.address?.trim() ?? "",
            items: JSON.stringify(o.items),
            total: o.total,
            status: o.status ?? "pending",
            deliveryDate: o.deliveryDate ?? "",
            deliverySlot: o.deliverySlot ?? "",
          },
        });
        if (customer) {
          await db.notification.create({
            data: {
              userId: customer.id, type: "order",
              title: `سفارش ${order.code} برای شما ثبت شد`,
              body: "کارشناسان ما سفارش شما را ثبت کردند. برای اطلاعات بیشتر با پشتیبانی تماس بگیرید.",
            },
          });
        }
        return NextResponse.json({ success: true, data: order });
      }

      // ================= products (admin) =================
      case "product.create": {
        const p = data as {
          name: string; description: string; category: string; price: number;
          oldPrice?: number | null; image: string; stock: number;
          isBestseller?: boolean; isNew?: boolean; isActive?: boolean;
        };
        if (!p.name?.trim() || !Number.isFinite(p.price) || p.price <= 0 || !p.image) {
          return NextResponse.json({ success: false, error: "نام، قیمت و تصویر محصول الزامی است." }, { status: 400 });
        }
        const base = p.name.trim().replace(/\s+/g, "-").slice(0, 30);
        const slug = `${base}-${Math.random().toString(36).slice(2, 7)}`;
        const product = await db.product.create({
          data: {
            slug, name: p.name.trim(), description: p.description ?? "", category: p.category,
            price: p.price, oldPrice: p.oldPrice ?? null, image: p.image,
            stock: p.stock ?? 10, isBestseller: p.isBestseller ?? false,
            isNew: p.isNew ?? true, isActive: p.isActive ?? true,
          },
        });
        return NextResponse.json({ success: true, data: product });
      }
      case "product.update": {
        const rest = typed(pick(data, PRODUCT_FIELDS), {
          name: "string", description: "string", category: "string", price: "number", oldPrice: "nullable-number",
          image: "string", stock: "number", isBestseller: "boolean", isNew: "boolean", isActive: "boolean",
        });
        if (typeof rest.price === "number" && rest.price <= 0) delete rest.price;
        if (typeof rest.stock === "number") rest.stock = Math.max(0, Math.round(rest.stock));
        await db.product.update({ where: { id }, data: rest });
        return NextResponse.json({ success: true });
      }
      case "product.delete": {
        await db.product.delete({ where: { id } });
        return NextResponse.json({ success: true });
      }
      case "product.setStock": {
        const stock = Math.max(0, Math.round(Number(body.amount ?? 0)));
        await db.product.update({ where: { id }, data: { stock } });
        return NextResponse.json({ success: true });
      }

      // ================= customers (admin manages real users) =================
      case "customer.create": {
        const c = data as { name: string; phone: string; email?: string; city?: string; note?: string; password?: string };
        if (!c.name?.trim() || !c.phone?.trim()) {
          return NextResponse.json({ success: false, error: "نام و شماره تماس الزامی است." }, { status: 400 });
        }
        const phone = normalizePhone(c.phone.trim());
        if (!/^0\d{10}$/.test(phone)) {
          return NextResponse.json({ success: false, error: "شماره موبایل معتبر نیست." }, { status: 400 });
        }
        const exists = await db.user.findUnique({ where: { phone } });
        if (exists) {
          return NextResponse.json({ success: false, error: "کاربری با این شماره از قبل ثبت شده است." }, { status: 400 });
        }
        // never fall back to a well-known default password; generate a strong one and hand it to the admin
        let password = typeof c.password === "string" ? c.password : "";
        if (passwordPolicyError(password)) password = randomBytes(9).toString("base64url");
        const initialPassword = password;
        const count = await db.user.count();
        const customer = await db.user.create({
          data: {
            name: c.name.trim(), phone, email: c.email ?? "", city: c.city ?? "تهران",
            note: c.note ?? "", password: hashPassword(password), role: "user", avatarHue: count % 5,
          },
        });
        const { password: _pw, ...safeCustomer } = customer;
        return NextResponse.json({ success: true, data: { ...safeCustomer, initialPassword } });
      }
      case "customer.update": {
        const c = data as Record<string, string | number | boolean>;
        const target = await db.user.findUnique({ where: { id } });
        if (!target) return NextResponse.json({ success: false, error: "مشتری یافت نشد." }, { status: 404 });
        if (target.role === "admin" && (c.isBanned === true)) {
          return NextResponse.json({ success: false, error: "امکان مسدودسازی مدیر وجود ندارد." }, { status: 400 });
        }
        const update: Record<string, unknown> = {};
        for (const k of ["name", "email", "city", "note"] as const) {
          if (typeof c[k] === "string") update[k] = c[k];
        }
        if (typeof c.phone === "string") {
          const phone = normalizePhone(c.phone);
          if (!/^0\d{10}$/.test(phone)) {
            return NextResponse.json({ success: false, error: "شماره موبایل معتبر نیست." }, { status: 400 });
          }
          if (phone !== target.phone) {
            const taken = await db.user.findUnique({ where: { phone } });
            if (taken) return NextResponse.json({ success: false, error: "این شماره قبلاً ثبت شده است." }, { status: 400 });
            update.phone = phone;
          }
        }
        if (typeof c.password === "string" && c.password) {
          // password reset on behalf of a customer (there is no SMS/email reset flow yet)
          const pwErr = passwordPolicyError(c.password);
          if (pwErr) return NextResponse.json({ success: false, error: pwErr }, { status: 400 });
          update.password = hashPassword(c.password);
        }
        if (typeof c.wallet === "number") update.walletBalance = Math.max(0, Math.round(c.wallet));
        if (typeof c.points === "number") update.points = Math.max(0, Math.round(c.points));
        if (typeof c.isBanned === "boolean") update.isBanned = c.isBanned;
        await db.user.update({ where: { id }, data: update });
        return NextResponse.json({ success: true });
      }
      case "customer.delete": {
        const target = await db.user.findUnique({ where: { id } });
        if (!target) return NextResponse.json({ success: false, error: "مشتری یافت نشد." }, { status: 404 });
        if (target.role === "admin" || target.id === user.id) {
          return NextResponse.json({ success: false, error: "حساب‌های مدیریتی قابل حذف نیستند." }, { status: 400 });
        }
        await db.user.delete({ where: { id } });
        return NextResponse.json({ success: true });
      }

      // ================= coupons (admin) =================
      case "coupon.create": {
        const c = data as { code: string; title: string; type: string; value: number; minOrder?: number; maxUses?: number; expiresAt?: string };
        if (!["percent", "amount"].includes(c.type) || !Number.isFinite(c.value) || c.value <= 0 || (c.type === "percent" && c.value > 100)) {
          return NextResponse.json({ success: false, error: "نوع یا مقدار تخفیف نامعتبر است." }, { status: 400 });
        }
        if (!c.code?.trim() || !c.title?.trim() || !c.value) {
          return NextResponse.json({ success: false, error: "کد، عنوان و مقدار تخفیف الزامی است." }, { status: 400 });
        }
        const code = c.code.trim().toUpperCase();
        const exists = await db.coupon.findUnique({ where: { code } });
        if (exists) {
          return NextResponse.json({ success: false, error: "این کد تخفیف از قبل وجود دارد." }, { status: 400 });
        }
        const coupon = await db.coupon.create({
          data: {
            code, title: c.title.trim(), type: c.type, value: c.value,
            minOrder: c.minOrder ?? 0, maxUses: c.maxUses ?? 100,
            expiresAt: c.expiresAt ?? "",
          },
        });
        return NextResponse.json({ success: true, data: coupon });
      }
      case "coupon.update": {
        const c = typed(pick(data, COUPON_FIELDS), {
          title: "string", type: "string", value: "number", minOrder: "number", maxUses: "number",
          expiresAt: "string", isActive: "boolean",
        });
        if (c.type !== undefined && !["percent", "amount"].includes(c.type as string)) delete c.type;
        if (typeof c.value === "number" && (c.value <= 0 || c.value > 100_000_000)) delete c.value;
        await db.coupon.update({ where: { id }, data: c });
        return NextResponse.json({ success: true });
      }
      case "coupon.delete": {
        await db.coupon.delete({ where: { id } });
        return NextResponse.json({ success: true });
      }

      // ================= settings (admin) =================
      case "settings.update": {
        const s = typed(pick(data, SETTINGS_FIELDS), {
          shopName: "string", slogan: "string", phone: "string", email: "string", address: "string",
          hours: "string", instagram: "string", telegram: "string", whatsapp: "string",
          shippingFee: "number", freeShippingMin: "number", announcement: "string", isOpen: "boolean",
          autoAccept: "boolean", paymentGateway: "string", zarinpalMerchantId: "string",
        });
        if (s.paymentGateway !== undefined && !["sandbox", "zarinpal"].includes(s.paymentGateway as string)) delete s.paymentGateway;
        const row = await db.settings.findFirst();
        if (!row) {
          await db.settings.create({ data: s });
        } else {
          await db.settings.update({ where: { id: row.id }, data: s });
        }
        return NextResponse.json({ success: true });
      }

      // ================= messages (admin) =================
      case "message.read": {
        await db.message.update({ where: { id }, data: { isRead: true } });
        return NextResponse.json({ success: true });
      }
      case "message.readAll": {
        await db.message.updateMany({ data: { isRead: true } });
        return NextResponse.json({ success: true });
      }
      case "message.delete": {
        await db.message.delete({ where: { id } });
        return NextResponse.json({ success: true });
      }

      // ================= tickets =================
      case "ticket.create": {
        const t = data as { subject: string; category?: string; priority?: string; body: string };
        if (!t.subject?.trim() || !t.body?.trim()) {
          return NextResponse.json({ success: false, error: "موضوع و متن پیام الزامی است." }, { status: 400 });
        }
        const code = `TK-${Date.now().toString(36).toUpperCase().slice(-6)}`;
        const ticket = await db.ticket.create({
          data: {
            code,
            userId: user.id,
            subject: t.subject.trim().slice(0, 150),
            category: ["general", "order", "payment", "technical"].includes(t.category ?? "") ? (t.category as string) : "general",
            priority: ["low", "normal", "high"].includes(t.priority ?? "") ? (t.priority as string) : "normal",
            status: "open",
            userName: user.name,
            phone: user.phone,
            messages: {
              create: { sender: "user", senderName: user.name, body: t.body.trim().slice(0, 4000) },
            },
          },
          include: { messages: true },
        });
        return NextResponse.json({ success: true, data: ticket });
      }
      case "ticket.reply": {
        const r = data as { body: string };
        if (!r.body?.trim()) {
          return NextResponse.json({ success: false, error: "متن پاسخ الزامی است." }, { status: 400 });
        }
        const ticket = await db.ticket.findUnique({ where: { id } });
        if (!ticket) return NextResponse.json({ success: false, error: "تیکت یافت نشد" }, { status: 404 });
        if (ticket.userId !== user.id && user.role !== "admin") {
          return NextResponse.json({ success: false, error: "این تیکت متعلق به شما نیست." }, { status: 403 });
        }
        const isAdminReply = user.role === "admin";
        const msg = await db.ticketMsg.create({
          data: {
            ticketId: ticket.id,
            sender: isAdminReply ? "admin" : "user",
            senderName: isAdminReply ? "پشتیبانی گلستان حافظ" : user.name,
            body: r.body.trim().slice(0, 4000),
          },
        });
        const nextStatus = isAdminReply ? "answered" : "open";
        await db.ticket.update({ where: { id }, data: { status: nextStatus } });
        if (isAdminReply) {
          await db.notification.create({
            data: {
              userId: ticket.userId, type: "ticket",
              title: `پاسخ تیکت ${ticket.code}`,
              body: "پشتیبانی به تیکت شما پاسخ داد. برای مشاهده وارد پنل شوید.",
            },
          });
        }
        return NextResponse.json({ success: true, data: msg });
      }
      case "ticket.setStatus": {
        await db.ticket.update({ where: { id }, data: { status: body.status ?? "open" } });
        return NextResponse.json({ success: true });
      }
      case "ticket.delete": {
        await db.ticket.delete({ where: { id } });
        return NextResponse.json({ success: true });
      }

      // ================= security (self) =================
      case "auth.changePassword": {
        if (isRateLimited(`chpw:${user.id}`, 6, 15 * 60_000)) return tooManyRequests();
        const p = (data ?? {}) as { current?: unknown; next?: unknown };
        const current = typeof p.current === "string" ? p.current : "";
        const next = typeof p.next === "string" ? p.next : "";
        const meRow = await db.user.findUnique({ where: { id: user.id } });
        if (!meRow || !verifyPassword(current, meRow.password)) {
          return NextResponse.json({ success: false, error: "رمز عبور فعلی صحیح نیست." }, { status: 400 });
        }
        const pwErr = passwordPolicyError(next);
        if (pwErr) {
          return NextResponse.json({ success: false, error: pwErr }, { status: 400 });
        }
        const newHash = hashPassword(next);
        await db.user.update({ where: { id: user.id }, data: { password: newHash } });
        await db.notification.create({
          data: {
            userId: user.id, type: "system",
            title: "رمز عبور تغییر کرد",
            body: "رمز عبور حساب شما با موفقیت تغییر کرد. اگر این کار توسط شما نبوده، با پشتیبانی تماس بگیرید.",
          },
        });
        // all other sessions (old password fingerprint) are now invalid; keep this device logged in
        const res = NextResponse.json({ success: true });
        setSessionCookie(res, user.id, user.role, newHash, req);
        return res;
      }

      default:
        return NextResponse.json({ success: false, error: `اکشن ناشناخته: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error("POST /api/panel/mutate error:", error);
    return NextResponse.json(
      { success: false, error: "خطا در انجام عملیات" },
      { status: 500 }
    );
  }
}
