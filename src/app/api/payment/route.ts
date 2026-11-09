import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import {
  createGatewayPayment,
  fulfillOrderPayment,
  fulfillWalletCharge,
  getGatewayConfig,
  maskPan,
  sandboxAllowed,
  sandboxRefId,
} from "@/lib/payment";
import { assertSameOrigin, isRateLimited, siteOrigin, tooManyRequests } from "@/lib/security";

export const dynamic = "force-dynamic";

// =====================================================================
// GET /api/payment?authority=... — اطلاعات تراکنش برای صفحه درگاه
// =====================================================================
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || "banned" in session) {
      return NextResponse.json(
        { success: false, error: "برای مشاهده درگاه پرداخت باید وارد حساب خود شوید." },
        { status: 401 }
      );
    }
    const me = session.user;

    const authority = req.nextUrl.searchParams.get("authority")?.trim();
    if (!authority) {
      return NextResponse.json({ success: false, error: "شناسه تراکنش نامعتبر است." }, { status: 400 });
    }

    const payment = await db.payment.findUnique({
      where: { authority },
      include: { order: true },
    });
    if (!payment) {
      return NextResponse.json({ success: false, error: "تراکنش یافت نشد." }, { status: 404 });
    }
    if (payment.userId !== me.id && me.role !== "admin") {
      return NextResponse.json({ success: false, error: "این تراکنش متعلق به شما نیست." }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      payment: {
        authority: payment.authority,
        amount: payment.amount,
        kind: payment.kind,
        gateway: payment.gateway,
        status: payment.status,
        description: payment.description,
        refId: payment.refId,
        cardPan: payment.cardPan,
        createdAt: payment.createdAt.toISOString(),
        order: payment.order
          ? {
              id: payment.order.id,
              code: payment.order.code,
              status: payment.order.status,
              paidAt: payment.order.paidAt?.toISOString() ?? null,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("GET /api/payment error:", error);
    return NextResponse.json({ success: false, error: "خطا در دریافت اطلاعات پرداخت." }, { status: 500 });
  }
}

// =====================================================================
// POST /api/payment — اکشن‌های درگاه
// =====================================================================
export async function POST(req: NextRequest) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;
  try {
    const session = await getSessionUser(req);
    if (!session || "banned" in session) {
      return NextResponse.json(
        { success: false, error: "برای پرداخت باید وارد حساب خود شوید." },
        { status: 401 }
      );
    }
    const me = session.user;
    if (isRateLimited(`pay:${me.id}`, 30, 10 * 60_000)) return tooManyRequests();

    const body = (await req.json().catch(() => ({}))) as {
      action?: string;
      authority?: string;
      outcome?: string;
      cardPan?: string;
      orderId?: string;
      amount?: number;
    };

    // ---------- تأیید پرداخت (فقط درگاه آزمایشی داخلی) ----------
    if (body.action === "verify") {
      const payment = body.authority
        ? await db.payment.findUnique({ where: { authority: body.authority }, include: { order: true } })
        : null;
      if (!payment || (payment.userId !== me.id && me.role !== "admin")) {
        return NextResponse.json({ success: false, error: "تراکنش یافت نشد." }, { status: 404 });
      }
      // در پرداخت‌های زرین‌پال، تأیید فقط از سمت بانک (callback) معتبر است.
      // درگاه آزمایشی هم در production کاملاً غیرفعال است (وگرنه هر کاربر پرداخت خودش را «تأیید» می‌کرد).
      if (payment.gateway !== "sandbox" || !sandboxAllowed()) {
        return NextResponse.json(
          { success: false, error: "تأیید این تراکنش فقط از طریق بانک انجام می‌شود." },
          { status: 403 }
        );
      }
      if (payment.status === "success") {
        // idempotent — پرداخت قبلاً تأیید شده
        return NextResponse.json({
          success: true,
          alreadyPaid: true,
          refId: payment.refId,
          cardPan: payment.cardPan,
          orderCode: payment.order?.code ?? null,
          kind: payment.kind,
        });
      }
      if (payment.status !== "pending") {
        return NextResponse.json(
          { success: false, error: "این تراکنش منقضی شده است. لطفاً پرداخت را از ابتدا انجام دهید." },
          { status: 409 }
        );
      }

      if (body.outcome !== "success") {
        await db.payment.update({
          where: { id: payment.id },
          data: { status: "failed", refId: "", cardPan: maskPan(body.cardPan ?? "") },
        });
        return NextResponse.json({
          success: false,
          failed: true,
          error: "تراکنش توسط بانک تأیید نشد. مبلغی از حساب شما کسر نشده است.",
        });
      }

      const refId = sandboxRefId();
      const cardPan = maskPan(body.cardPan ?? "");

      if (payment.kind === "wallet_charge") {
        const r = await fulfillWalletCharge({ id: payment.id, userId: payment.userId, amount: payment.amount, refId });
        if (!r.ok) {
          return NextResponse.json({ success: false, error: "خطا در شارژ کیف پول." }, { status: 500 });
        }
        await db.payment.update({ where: { id: payment.id }, data: { cardPan } });
        return NextResponse.json({ success: true, refId, cardPan, orderCode: null, kind: "wallet_charge" });
      }

      // kind === "order"
      if (!payment.order) {
        return NextResponse.json({ success: false, error: "سفارش این تراکنش یافت نشد." }, { status: 404 });
      }
      await db.payment.update({
        where: { id: payment.id },
        data: { status: "success", refId, cardPan },
      });
      const r = await fulfillOrderPayment(payment.order.id, refId);
      if (!r.ok) {
        // پرداخت موفق ولی تسویه ممکن نشد (مثلاً اتمام موجودی) — تراکنش ناموفق ثبت می‌شود
        await db.payment.update({
          where: { id: payment.id },
          data: { status: "failed", refId: "" },
        });
        return NextResponse.json({ success: false, error: r.error ?? "تسویه سفارش انجام نشد." }, { status: 409 });
      }
      return NextResponse.json({
        success: true,
        refId,
        cardPan,
        orderCode: r.orderCode ?? payment.order.code,
        kind: "order",
      });
    }

    // ---------- انصراف از پرداخت ----------
    if (body.action === "cancel") {
      const payment = body.authority
        ? await db.payment.findUnique({ where: { authority: body.authority } })
        : null;
      if (!payment || (payment.userId !== me.id && me.role !== "admin")) {
        return NextResponse.json({ success: false, error: "تراکنش یافت نشد." }, { status: 404 });
      }
      if (payment.status === "pending") {
        await db.payment.update({ where: { id: payment.id }, data: { status: "canceled" } });
      }
      return NextResponse.json({ success: true });
    }

    // ---------- ادامه پرداخت سفارش پرداخت‌نشده ----------
    if (body.action === "retry") {
      if (!body.orderId) {
        return NextResponse.json({ success: false, error: "شناسه سفارش نامعتبر است." }, { status: 400 });
      }
      const order = await db.order.findUnique({ where: { id: body.orderId } });
      if (!order || (order.userId !== me.id && me.role !== "admin")) {
        return NextResponse.json({ success: false, error: "سفارش یافت نشد." }, { status: 404 });
      }
      if (order.paidAt || order.status === "cancelled") {
        return NextResponse.json(
          { success: false, error: "این سفارش قابل پرداخت مجدد نیست." },
          { status: 409 }
        );
      }
      if (order.paymentMethod !== "online") {
        return NextResponse.json(
          { success: false, error: "این سفارش پرداخت آنلاین ندارد." },
          { status: 400 }
        );
      }
      // اگر تراکنش در انتظاری دارد همان را ادامه می‌دهیم، وگرنه تراکنش جدید می‌سازیم
      const pending = await db.payment.findFirst({
        where: { orderId: order.id, status: "pending" },
        orderBy: { createdAt: "desc" },
      });
      if (pending && pending.gateway === "sandbox") {
        return NextResponse.json({ success: true, authority: pending.authority, gateway: "sandbox", redirectUrl: null });
      }
      const gw = await createGatewayPayment({
        userId: me.id,
        amount: order.total,
        kind: "order",
        orderId: order.id,
        description: `پرداخت سفارش ${order.code} — گلستان حافظ`,
        origin: siteOrigin(req),
        mobile: order.phone,
      });
      if (!gw.ok) {
        return NextResponse.json({ success: false, error: gw.error }, { status: 502 });
      }
      return NextResponse.json({
        success: true,
        authority: gw.authority,
        gateway: gw.gateway,
        redirectUrl: gw.redirectUrl,
      });
    }

    // ---------- شارژ کیف پول از طریق درگاه ----------
    if (body.action === "wallet-charge") {
      const amount = Math.round(Number(body.amount ?? 0));
      if (!amount || amount < 10000) {
        return NextResponse.json({ success: false, error: "حداقل مبلغ شارژ ۱۰٬۰۰۰ تومان است." }, { status: 400 });
      }
      if (amount > 100_000_000) {
        return NextResponse.json({ success: false, error: "حداکثر شارژ در هر تراکنش ۱۰۰ میلیون تومان است." }, { status: 400 });
      }
      const gw = await createGatewayPayment({
        userId: me.id,
        amount,
        kind: "wallet_charge",
        description: `شارژ کیف پول — ${me.name}`,
        origin: siteOrigin(req),
        mobile: me.phone,
      });
      if (!gw.ok) {
        return NextResponse.json({ success: false, error: gw.error }, { status: 502 });
      }
      return NextResponse.json({
        success: true,
        authority: gw.authority,
        gateway: gw.gateway,
        redirectUrl: gw.redirectUrl,
      });
    }

    // ---------- وضعیت درگاه (برای نمایش در پنل ادمین) ----------
    if (body.action === "gateway-info") {
      const cfg = await getGatewayConfig();
      return NextResponse.json({ success: true, ...cfg });
    }

    return NextResponse.json({ success: false, error: "اکشن نامعتبر است." }, { status: 400 });
  } catch (error) {
    console.error("POST /api/payment error:", error);
    return NextResponse.json({ success: false, error: "خطا در پردازش پرداخت." }, { status: 500 });
  }
}
