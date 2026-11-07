import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  fulfillOrderPayment,
  fulfillWalletCharge,
  getGatewayConfig,
  zarinpalVerify,
} from "@/lib/payment";
import { siteOrigin } from "@/lib/security";

export const dynamic = "force-dynamic";

// =====================================================================
// GET /api/payment/callback?Authority=...&Status=OK|NOK
// بازگشت کاربر از درگاه واقعی زرین‌پال — تأیید سمت سرور و ریدایرکت به
// صفحه رسید درون سایت (#pay/<authority>)
// =====================================================================
export async function GET(req: NextRequest) {
  try {
    const authority = (
      req.nextUrl.searchParams.get("Authority") ??
      req.nextUrl.searchParams.get("authority") ??
      ""
    ).trim();
    const status = (
      req.nextUrl.searchParams.get("Status") ??
      req.nextUrl.searchParams.get("status") ??
      ""
    ).trim();

    if (!authority) {
      return NextResponse.redirect(new URL("/#shop", siteOrigin(req)));
    }

    const payment = await db.payment.findUnique({
      where: { authority },
      include: { order: true },
    });
    if (!payment) {
      return NextResponse.redirect(new URL("/#shop", siteOrigin(req)));
    }

    if (payment.gateway !== "zarinpal") {
      return NextResponse.redirect(new URL(`/#pay/${authority}`, siteOrigin(req)));
    }

    // تراکنش قبلاً نهایی شده — فقط به صفحه رسید می‌رویم
    if (payment.status !== "pending") {
      return NextResponse.redirect(new URL(`/#pay/${authority}`, siteOrigin(req)));
    }

    if (status.toUpperCase() !== "OK") {
      await db.payment.update({ where: { id: payment.id }, data: { status: "failed" } });
      return NextResponse.redirect(new URL(`/#pay/${authority}`, siteOrigin(req)));
    }

    // تأیید تراکنش نزد زرین‌پال (never trust the gateway redirect alone)
    const { merchantId } = await getGatewayConfig();
    if (payment.kind === "wallet_charge") {
      const v = await zarinpalVerify({ merchantId, amount: payment.amount, authority });
      if (v.ok && v.refId) {
        await fulfillWalletCharge({ id: payment.id, userId: payment.userId, amount: payment.amount, refId: v.refId });
      } else {
        await db.payment.update({ where: { id: payment.id }, data: { status: "failed" } });
      }
      return NextResponse.redirect(new URL(`/#pay/${authority}`, siteOrigin(req)));
    }

    if (!payment.order) {
      return NextResponse.redirect(new URL(`/#pay/${authority}`, siteOrigin(req)));
    }
    const v = await zarinpalVerify({ merchantId, amount: payment.amount, authority });
    if (v.ok && v.refId) {
      await db.payment.update({
        where: { id: payment.id },
        data: { status: "success", refId: v.refId },
      });
      await fulfillOrderPayment(payment.order.id, v.refId);
    } else {
      await db.payment.update({ where: { id: payment.id }, data: { status: "failed" } });
    }
    return NextResponse.redirect(new URL(`/#pay/${authority}`, siteOrigin(req)));
  } catch (error) {
    console.error("GET /api/payment/callback error:", error);
    return NextResponse.redirect(new URL("/#shop", siteOrigin(req)));
  }
}
