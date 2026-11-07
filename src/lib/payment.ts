import { randomInt } from "crypto";
import { db } from "@/lib/db";

// =====================================================================
// درگاه پرداخت اینترنتی گلستان حافظ
// دو حالت پشتیبانی می‌شود:
//  1) "sandbox"  → درگاه آزمایشی داخلی (صفحه درگاه داخل سایت) — پیش‌فرض
//  2) "zarinpal" → درگاه واقعی زرین‌پال؛ کافی است مدیر در پنل مدیریت →
//     تنظیمات، درگاه را «زرین‌پال» و مرچنت کد را وارد کند.
// =====================================================================

export type GatewayMode = "sandbox" | "zarinpal";

/**
 * The built-in sandbox gateway lets the *customer* confirm their own payment, so it must NEVER be
 * reachable in production (otherwise anyone can "pay" with no money). Enable explicitly for demos
 * with ALLOW_SANDBOX_GATEWAY=1.
 */
export function sandboxAllowed(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.ALLOW_SANDBOX_GATEWAY === "1";
}

const ZARINPAL_REQUEST_URL = "https://api.zarinpal.com/pg/v4/payment/request.json";
const ZARINPAL_VERIFY_URL = "https://api.zarinpal.com/pg/v4/payment/verify.json";
const ZARINPAL_STARTPAY_URL = "https://www.zarinpal.com/pg/StartPay/";
// برای تست یکپارچگی بدون مرچنت واقعی می‌توان ZARINPAL_SANDBOX=1 در .env گذاشت
const ZARINPAL_SANDBOX = process.env.ZARINPAL_SANDBOX === "1";

export async function getGatewayConfig(): Promise<{ mode: GatewayMode; merchantId: string }> {
  const settings = await db.settings.findFirst();
  const merchantId = (settings?.zarinpalMerchantId ?? "").trim();
  const mode: GatewayMode =
    settings?.paymentGateway === "zarinpal" && merchantId ? "zarinpal" : "sandbox";
  return { mode, merchantId };
}

// ---------- Zarinpal (real gateway) ----------

export async function zarinpalRequest(opts: {
  merchantId: string;
  amount: number; // toman
  description: string;
  callbackUrl: string;
  mobile?: string;
}): Promise<{ ok: boolean; authority?: string; redirectUrl?: string; error?: string }> {
  const base = ZARINPAL_SANDBOX
    ? "https://sandbox.zarinpal.com/pg/v4/payment/request.json"
    : ZARINPAL_REQUEST_URL;
  const startPay = ZARINPAL_SANDBOX
    ? "https://sandbox.zarinpal.com/pg/StartPay/"
    : ZARINPAL_STARTPAY_URL;
  try {
    const res = await fetch(base, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchant_id: opts.merchantId,
        amount: opts.amount * 10, // zarinpal v4 works in rials
        description: opts.description,
        callback_url: opts.callbackUrl,
        metadata: opts.mobile ? { mobile: opts.mobile } : undefined,
      }),
      signal: AbortSignal.timeout(12000),
    });
    const json = (await res.json()) as {
      data?: { authority?: string; code?: number };
      errors?: { code?: number; message?: string } | unknown[];
    };
    const authority = json?.data?.authority;
    if (json?.data?.code === 100 && authority) {
      return { ok: true, authority, redirectUrl: `${startPay}${authority}` };
    }
    const err = Array.isArray(json?.errors) ? "unknown" : (json?.errors as { message?: string })?.message;
    return { ok: false, error: err || `کد خطای زرین‌پال: ${json?.data?.code ?? "?"}` };
  } catch {
    return { ok: false, error: "اتصال به درگاه زرین‌پال برقرار نشد." };
  }
}

export async function zarinpalVerify(opts: {
  merchantId: string;
  amount: number; // toman
  authority: string;
}): Promise<{ ok: boolean; refId?: string; alreadyVerified?: boolean; error?: string }> {
  const base = ZARINPAL_SANDBOX
    ? "https://sandbox.zarinpal.com/pg/v4/payment/verify.json"
    : ZARINPAL_VERIFY_URL;
  try {
    const res = await fetch(base, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchant_id: opts.merchantId,
        amount: opts.amount * 10, // rials
        authority: opts.authority,
      }),
      signal: AbortSignal.timeout(12000),
    });
    const json = (await res.json()) as {
      data?: { code?: number; ref_id?: number | string };
      errors?: { code?: number; message?: string } | unknown[];
    };
    const code = json?.data?.code;
    if (code === 100 || code === 101) {
      return {
        ok: true,
        refId: String(json?.data?.ref_id ?? ""),
        alreadyVerified: code === 101,
      };
    }
    const err = Array.isArray(json?.errors) ? "unknown" : (json?.errors as { message?: string })?.message;
    return { ok: false, error: err || `تأیید تراکنش ناموفق (کد ${code ?? "?"})` };
  } catch {
    return { ok: false, error: "اتصال به زرین‌پال برای تأیید تراکنش برقرار نشد." };
  }
}

// ---------- payment record creation ----------

export async function createGatewayPayment(opts: {
  userId: string;
  amount: number;
  kind: "order" | "wallet_charge";
  orderId?: string | null;
  description: string;
  origin: string; // e.g. https://preview-xxx.space-z.ai
  mobile?: string;
}): Promise<
  | { ok: true; gateway: GatewayMode; authority: string; redirectUrl: string | null }
  | { ok: false; error: string }
> {
  const { mode, merchantId } = await getGatewayConfig();

  if (mode === "zarinpal") {
    const callbackUrl = `${opts.origin}/api/payment/callback`;
    const zreq = await zarinpalRequest({
      merchantId,
      amount: opts.amount,
      description: opts.description,
      callbackUrl,
      mobile: opts.mobile,
    });
    if (zreq.ok && zreq.authority && zreq.redirectUrl) {
      const payment = await db.payment.create({
        data: {
          userId: opts.userId,
          orderId: opts.orderId ?? null,
          kind: opts.kind,
          authority: zreq.authority,
          amount: opts.amount,
          gateway: "zarinpal",
          description: opts.description,
        },
      });
      return { ok: true, gateway: "zarinpal", authority: payment.authority, redirectUrl: zreq.redirectUrl };
    }
    console.error("[payment] zarinpal request failed:", zreq.error);
    if (!sandboxAllowed()) {
      return { ok: false, error: "اتصال به درگاه پرداخت برقرار نشد. لطفاً دوباره تلاش کنید." };
    }
    // only in dev/demo: fall back to the sandbox gateway
  }

  if (!sandboxAllowed()) {
    return { ok: false, error: "درگاه پرداخت آنلاین هنوز فعال نشده است. از روش پرداخت دیگری استفاده کنید." };
  }

  const payment = await db.payment.create({
    data: {
      userId: opts.userId,
      orderId: opts.orderId ?? null,
      kind: opts.kind,
      amount: opts.amount,
      gateway: "sandbox",
      description: opts.description,
    },
  });
  return { ok: true, gateway: "sandbox", authority: payment.authority, redirectUrl: null };
}

export function sandboxRefId(): string {
  return String(randomInt(10000000, 99999999));
}

export function maskPan(pan: string): string {
  const digits = pan.replace(/\D/g, "");
  if (digits.length !== 16) return "";
  return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-****-****`;
}

// =====================================================================
// تسویه سفارش بعد از پرداخت موفق (idempotent — فقط یک‌بار اجرا می‌شود)
// شامل: کسر انبار، ثبت استفاده کوپن، امتیاز، paidAt و اعلان
// =====================================================================

export async function fulfillOrderPayment(
  orderId: string,
  refId: string
): Promise<{ ok: boolean; already?: boolean; error?: string; orderCode?: string }> {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return { ok: false, error: "سفارش یافت نشد." };
  if (order.paidAt) return { ok: true, already: true, orderCode: order.code };

  let items: { id: string; name: string; qty: number }[] = [];
  try { items = JSON.parse(order.items || "[]"); } catch { items = []; }

  try {
    // One atomic transaction: claim the order (paidAt IS NULL -> now) so concurrent callbacks/verifies
    // cannot settle twice, then decrement stock with a guard so stock can never go negative.
    await db.$transaction(async (tx) => {
      const claim = await tx.order.updateMany({
        where: { id: order.id, paidAt: null },
        data: { paidAt: new Date(), paymentRef: refId },
      });
      if (claim.count !== 1) throw new Error("ALREADY");

      for (const it of items) {
        const dec = await tx.product.updateMany({
          where: { id: it.id, isActive: true, stock: { gte: it.qty } },
          data: { stock: { decrement: it.qty } },
        });
        if (dec.count !== 1) throw new Error(`STOCK:${it.name}`);
      }
      if (order.couponCode) {
        await tx.coupon.updateMany({ where: { code: order.couponCode }, data: { used: { increment: 1 } } });
      }
      await tx.user.update({
        where: { id: order.userId },
        data: { points: { increment: order.pointsEarned } },
      });
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "ALREADY") return { ok: true, already: true, orderCode: order.code };
    if (msg.startsWith("STOCK:")) {
      return {
        ok: false,
        error: `موجودی «${msg.slice(6) || "یکی از اقلام سفارش"}» کافی نیست؛ لطفاً با پشتیبانی تماس بگیرید.`,
        orderCode: order.code,
      };
    }
    console.error("[payment] fulfillOrderPayment failed:", e);
    return { ok: false, error: "تسویه سفارش انجام نشد.", orderCode: order.code };
  }

  const pointsEarned = order.pointsEarned;
  const faMoney = (n: number) => new Intl.NumberFormat("fa-IR").format(n);
  const refLine = /^\d+$/.test(refId) ? ` (شماره پیگیری: ${refId})` : "";
  await db.notification.create({
    data: {
      userId: order.userId,
      type: "order",
      title: `سفارش ${order.code} ثبت و پرداخت شد 🌸`,
      body: `سفارش شما به مبلغ ${faMoney(order.total)} تومان با موفقیت پرداخت شد${refLine} و در حال آماده‌سازی است.${pointsEarned ? ` ${faMoney(pointsEarned)} امتیاز باشگاه مشتریان کسب کردید.` : ""}`,
    },
  });

  return { ok: true, orderCode: order.code };
}

// =====================================================================
// شارژ کیف پول بعد از پرداخت موفق درگاه (idempotent)
// =====================================================================

export async function fulfillWalletCharge(payment: {
  id: string;
  userId: string;
  amount: number;
  refId: string;
}): Promise<{ ok: boolean; already?: boolean }> {
  try {
    await db.$transaction(async (tx) => {
      // atomic claim: only the first caller flips pending -> success and credits the wallet
      const claim = await tx.payment.updateMany({
        where: { id: payment.id, status: { not: "success" }, kind: "wallet_charge" },
        data: { status: "success", refId: payment.refId },
      });
      if (claim.count !== 1) throw new Error("ALREADY");
      await tx.user.update({
        where: { id: payment.userId },
        data: { walletBalance: { increment: payment.amount } },
      });
      await tx.walletTx.create({
        data: {
          userId: payment.userId,
          type: "charge",
          amount: payment.amount,
          description: `شارژ کیف پول با درگاه پرداخت اینترنتی (پیگیری: ${payment.refId})`,
        },
      });
    });
  } catch (e) {
    if (e instanceof Error && e.message === "ALREADY") return { ok: true, already: true };
    console.error("[payment] fulfillWalletCharge failed:", e);
    return { ok: false };
  }
  const faMoney = (n: number) => new Intl.NumberFormat("fa-IR").format(n);
  await db.notification.create({
    data: {
      userId: payment.userId,
      type: "wallet",
      title: "کیف پول شارژ شد",
      body: `مبلغ ${faMoney(payment.amount)} تومان با پرداخت اینترنتی به کیف پول شما اضافه شد (شماره پیگیری: ${payment.refId}).`,
    },
  });
  return { ok: true };
}
