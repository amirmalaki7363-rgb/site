import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withRealRatings } from "@/lib/catalog";
import { getSessionUser } from "@/lib/auth";
import type { OrderItem, PanelData, PanelStats, OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

function emptyStats(products: { isActive: boolean; stock: number }[]): PanelStats {
  return {
    salesToday: 0, salesMonth: 0, ordersToday: 0, ordersMonth: 0,
    customersCount: 0, productsActive: products.filter((p) => p.isActive).length,
    avgOrderValue: 0, pendingOrders: 0, lowStockProducts: [],
    salesByDay: [], statusCounts: {}, topProducts: [], categoryStats: [],
  };
}

function parseOrders(rows: {
  id: string; code: string; userId: string; customerName: string; phone: string; address: string;
  city: string; province: string; postal: string; deliveryDate: string; deliverySlot: string;
  cardMessage: string; addons: string; couponCode: string; paymentMethod: string; shippingCost: number;
  discount: number; pointsEarned: number; note: string | null; items: string; total: number;
  status: string; paidAt: Date | null; paymentRef: string; createdAt: Date;
}[]) {
  return rows.map((o) => ({
    ...o,
    status: o.status as OrderStatus,
    addons: JSON.parse(o.addons || "[]"),
    items: JSON.parse(o.items || "[]"),
    paidAt: o.paidAt ? o.paidAt.toISOString() : null,
    createdAt: o.createdAt.toISOString(),
  }));
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "برای دسترسی به پنل باید وارد حساب شوید." },
        { status: 401 }
      );
    }
    if ("banned" in session) {
      return NextResponse.json(
        { success: false, error: "حساب شما مسدود شده است." },
        { status: 403 }
      );
    }
    const me = session.user;
    const isAdmin = me.role === "admin";

    const [
      meRow, addresses, walletTx, coupons, reviews, notifications,
      users, orderRows, products, settingsRows, messages, ticketRows, favorites,
    ] = await Promise.all([
      db.user.findUnique({ where: { id: me.id } }),
      db.address.findMany({
        where: isAdmin ? {} : { userId: me.id },
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      }),
      db.walletTx.findMany({
        where: isAdmin ? {} : { userId: me.id },
        orderBy: { createdAt: "desc" },
      }),
      db.coupon.findMany({
        where: isAdmin ? {} : { isActive: true },
        orderBy: { createdAt: "asc" },
      }),
      db.review.findMany({
        where: isAdmin ? {} : { userId: me.id },
        orderBy: { createdAt: "desc" },
      }),
      db.notification.findMany({
        where: isAdmin ? {} : { userId: me.id },
        orderBy: { createdAt: "desc" },
      }),
      isAdmin ? db.user.findMany({ orderBy: { createdAt: "desc" } }) : Promise.resolve([]),
      db.order.findMany({
        where: isAdmin ? {} : { userId: me.id },
        orderBy: { createdAt: "desc" },
      }),
      db.product.findMany({ orderBy: [{ isBestseller: "desc" }, { createdAt: "asc" }] }),
      db.settings.findFirst(),
      isAdmin ? db.message.findMany({ orderBy: { createdAt: "desc" } }) : Promise.resolve([]),
      db.ticket.findMany({
        where: isAdmin ? {} : { userId: me.id },
        orderBy: { updatedAt: "desc" },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      }),
      db.favorite.findMany({
        where: { userId: me.id },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const visibleOrders = isAdmin ? orderRows : orderRows.filter((o) => o.userId === me.id);
    const orders = parseOrders(visibleOrders);

    // ---------- admin stats ----------
    let stats: PanelStats = emptyStats(products);
    let customers: PanelData["customers"] = [];
    if (isAdmin) {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const valid = orders.filter((o) => o.status !== "cancelled");

      const salesToday = valid
        .filter((o) => new Date(o.createdAt) >= startOfDay)
        .reduce((s, o) => s + o.total, 0);
      const salesMonth = valid
        .filter((o) => new Date(o.createdAt) >= startOfMonth)
        .reduce((s, o) => s + o.total, 0);
      const ordersToday = orders.filter((o) => new Date(o.createdAt) >= startOfDay).length;
      const ordersMonth = orders.filter((o) => new Date(o.createdAt) >= startOfMonth).length;

      const statusCounts: Record<string, number> = {
        pending: 0, confirmed: 0, preparing: 0, shipped: 0, delivered: 0, cancelled: 0,
      };
      for (const o of orders) statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1;

      const salesByDay: { date: string; label: string; total: number; count: number }[] = [];
      for (let i = 13; i >= 0; i--) {
        const day = new Date(startOfDay);
        day.setDate(day.getDate() - i);
        const next = new Date(day);
        next.setDate(next.getDate() + 1);
        const dayOrders = valid.filter((o) => {
          const d = new Date(o.createdAt);
          return d >= day && d < next;
        });
        salesByDay.push({
          date: day.toISOString(),
          label: new Intl.DateTimeFormat("fa-IR", { month: "numeric", day: "numeric" }).format(day),
          total: dayOrders.reduce((s, o) => s + o.total, 0),
          count: dayOrders.length,
        });
      }

      const productAgg = new Map<string, { name: string; image: string; qty: number; revenue: number }>();
      for (const o of valid) {
        for (const it of o.items as OrderItem[]) {
          const prev = productAgg.get(it.id) ?? { name: it.name, image: it.image ?? "", qty: 0, revenue: 0 };
          prev.qty += it.qty;
          prev.revenue += it.qty * it.price;
          productAgg.set(it.id, prev);
        }
      }
      const topProducts = [...productAgg.entries()]
        .map(([id, v]) => ({ id, ...v }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5);

      const catMap = new Map<string, { count: number; value: number }>();
      for (const p of products) {
        const prev = catMap.get(p.category) ?? { count: 0, value: 0 };
        prev.count += 1;
        prev.value += p.price * p.stock;
        catMap.set(p.category, prev);
      }
      const categoryStats = [...catMap.entries()].map(([category, v]) => {
        const ps = products.filter((p) => p.category === category);
        const sold = ps.reduce((s, p) => {
          const t = productAgg.get(p.id);
          return s + (t?.qty ?? 0);
        }, 0);
        return {
          category, count: v.count, value: v.value,
          avg: Math.round(v.value / Math.max(v.count, 1)), sold,
        };
      });

      const avgOrderValue = valid.length
        ? Math.round(valid.reduce((s, o) => s + o.total, 0) / valid.length)
        : 0;

      stats = {
        salesToday, salesMonth, ordersToday, ordersMonth,
        customersCount: users.filter((u) => u.role === "user").length,
        productsActive: products.filter((p) => p.isActive).length,
        avgOrderValue,
        pendingOrders: statusCounts.pending ?? 0,
        lowStockProducts: products.filter((p) => p.stock < 6).slice(0, 6),
        salesByDay,
        statusCounts,
        topProducts,
        categoryStats,
      };

      customers = users
        .filter((u) => u.role !== "admin" || true) // show admins too, flagged by role
        .map((u) => {
          const co = orders.filter((o) => o.userId === u.id && o.status !== "cancelled");
          const last = co[0];
          return {
            id: u.id,
            name: u.name,
            phone: u.phone,
            email: u.email,
            city: u.city,
            wallet: u.walletBalance,
            points: u.points,
            note: u.note,
            role: u.role,
            isBanned: u.isBanned,
            createdAt: u.createdAt.toISOString(),
            orderCount: co.length,
            totalSpent: co.reduce((s, o) => s + o.total, 0),
            lastOrder: last ? last.createdAt : null,
          };
        });
    }

    const profile = meRow
      ? {
          id: meRow.id, name: meRow.name, phone: meRow.phone, email: meRow.email,
          birthday: meRow.birthday, gender: meRow.gender, avatarHue: meRow.avatarHue,
          walletBalance: meRow.walletBalance, points: meRow.points,
          emailOffers: meRow.emailOffers, smsOffers: meRow.smsOffers,
          memberSince: meRow.memberSince.toISOString(),
        }
      : {
          id: me.id, name: me.name, phone: me.phone, email: me.email,
          birthday: "", gender: "female", avatarHue: 0, walletBalance: 0, points: 0,
          emailOffers: true, smsOffers: true, memberSince: new Date().toISOString(),
        };

    const data: PanelData = {
      profile,
      addresses: addresses.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() })),
      walletTx: walletTx.map((t) => ({ ...t, createdAt: t.createdAt.toISOString() })),
      coupons: isAdmin
        ? coupons
        : coupons.map((c) => ({ ...c, used: 0, maxUses: 0 })), // usage counters are internal
      favorites: favorites.map((f) => ({
        id: f.id, productId: f.productId, name: f.name, price: f.price,
        image: f.image, createdAt: f.createdAt.toISOString(),
      })),
      reviews: reviews.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
      notifications: notifications.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() })),
      customers,
      orders,
      products: await withRealRatings(isAdmin ? products : products.filter((p) => p.isActive)),
      settings: (isAdmin
        ? settingsRows
        : settingsRows && { ...settingsRows, zarinpalMerchantId: "" }) ?? {
        id: "default", shopName: "گلستان حافظ", slogan: "گل، شعر و عشق در هر سفارش",
        phone: "09127385527", email: "hello@golestanhafez.ir",
        address: "تهران، خیابان ولیعصر، کوچه یاس، پلاک ۸", hours: "هر روز از ۹ صبح تا ۹ شب",
        instagram: "GolestaneHafez", telegram: "golestanhafez", whatsapp: "09127385527",
        shippingFee: 89000, freeShippingMin: 0,
        announcement: "تحویل در محل انتخابی شما", isOpen: true, autoAccept: true,
        paymentGateway: "sandbox", zarinpalMerchantId: "",
      },
      messages: isAdmin ? messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })) : [],
      tickets: ticketRows.map((t) => ({
        ...t,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
        messages: t.messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
      })),
      stats,
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("GET /api/panel/data error:", error);
    return NextResponse.json(
      { success: false, error: "خطا در دریافت داده‌های پنل" },
      { status: 500 }
    );
  }
}
