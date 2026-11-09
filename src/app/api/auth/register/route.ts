import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  hashPassword, isValidPhone, normalizePhone, passwordPolicyError, setSessionCookie, toSafeUser,
} from "@/lib/auth";
import { assertSameOrigin, clientIp, isRateLimited, tooManyRequests, str } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;
  try {
    // limits mass account creation (each new account gets a wallet gift)
    if (isRateLimited(`register:ip:${clientIp(req)}`, 5, 60 * 60_000)) return tooManyRequests();

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const name = str(body.name, 80);
    const phone = normalizePhone(str(body.phone, 20));
    const email = str(body.email, 120);
    const password = typeof body.password === "string" ? body.password : "";

    if (name.length < 3) {
      return NextResponse.json(
        { success: false, error: "نام و نام خانوادگی باید حداقل ۳ حرف باشد." },
        { status: 400 }
      );
    }
    if (!isValidPhone(phone)) {
      return NextResponse.json(
        { success: false, error: "شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود." },
        { status: 400 }
      );
    }
    const pwErr = passwordPolicyError(password);
    if (pwErr) {
      return NextResponse.json({ success: false, error: pwErr }, { status: 400 });
    }
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: "ایمیل وارد شده معتبر نیست." },
        { status: 400 }
      );
    }

    const exists = await db.user.findUnique({ where: { phone } });
    if (exists) {
      return NextResponse.json(
        { success: false, error: "این شماره موبایل قبلاً ثبت‌نام کرده است. وارد شوید." },
        { status: 409 }
      );
    }

    const count = await db.user.count();
    const user = await db.user.create({
      data: {
        name,
        phone,
        email,
        password: hashPassword(password),
        role: "user", // role is never taken from the request body
        avatarHue: count % 5,
      },
    });

    // welcome notification (real row for the new real account)
    await db.notification.create({
      data: {
        userId: user.id,
        title: "به خانواده گلستان حافظ خوش آمدید 🌸",
        body: "حساب شما با موفقیت ساخته شد. اولین سفارش خود را با کد تخفیف WELCOME با ۲۰٪ تخفیف ثبت کنید.",
        type: "system",
      },
    });
    // Optional welcome credit. OFF by default: without phone verification it can be farmed with fake
    // accounts. Enable with SIGNUP_GIFT_AMOUNT=50000 once registration requires SMS verification.
    const gift = Math.max(0, Math.min(500_000, Math.round(Number(process.env.SIGNUP_GIFT_AMOUNT ?? 0)) || 0));
    let updatedUser = user;
    if (gift > 0) {
      await db.walletTx.create({
        data: {
          userId: user.id,
          type: "gift",
          amount: gift,
          description: `هدیه خوش‌آمدگویی — ${new Intl.NumberFormat("fa-IR").format(gift)} تومان اعتبار خرید`,
        },
      });
      updatedUser = await db.user.update({ where: { id: user.id }, data: { walletBalance: { increment: gift } } });
    }

    const res = NextResponse.json({ success: true, user: toSafeUser(updatedUser) });
    setSessionCookie(res, user.id, user.role, user.password, req);
    return res;
  } catch (error) {
    console.error("POST /api/auth/register error:", error);
    return NextResponse.json(
      { success: false, error: "خطا در ثبت‌نام. لطفاً دوباره تلاش کنید." },
      { status: 500 }
    );
  }
}
