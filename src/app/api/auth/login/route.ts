import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  dummyVerify, normalizePhone, setSessionCookie, toSafeUser, verifyPassword,
} from "@/lib/auth";
import { assertSameOrigin, clientIp, isRateLimited, tooManyRequests } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;
  try {
    const ip = clientIp(req);
    if (isRateLimited(`login:ip:${ip}`, 30, 10 * 60_000)) return tooManyRequests();

    const body = (await req.json().catch(() => ({}))) as { phone?: unknown; password?: unknown };
    const phone = normalizePhone(typeof body.phone === "string" ? body.phone : "");
    const password = typeof body.password === "string" ? body.password : "";

    if (!phone || !password || password.length > 128 || phone.length > 20) {
      return NextResponse.json(
        { success: false, error: "شماره موبایل و رمز عبور الزامی است." },
        { status: 400 }
      );
    }
    // per-account throttle (slows password guessing even from many IPs)
    if (isRateLimited(`login:phone:${phone}`, 8, 10 * 60_000)) return tooManyRequests();

    const user = await db.user.findUnique({ where: { phone } });
    if (!user) {
      dummyVerify(password);
      return NextResponse.json(
        { success: false, error: "شماره موبایل یا رمز عبور اشتباه است." },
        { status: 401 }
      );
    }
    if (!verifyPassword(password, user.password)) {
      return NextResponse.json(
        { success: false, error: "شماره موبایل یا رمز عبور اشتباه است." },
        { status: 401 }
      );
    }
    if (user.isBanned) {
      return NextResponse.json(
        { success: false, error: "حساب شما توسط پشتیبانی مسدود شده است. تماس بگیرید." },
        { status: 403 }
      );
    }

    const res = NextResponse.json({ success: true, user: toSafeUser(user) });
    setSessionCookie(res, user.id, user.role, user.password, req);
    return res;
  } catch (error) {
    console.error("POST /api/auth/login error:", error);
    return NextResponse.json(
      { success: false, error: "خطا در ورود. لطفاً دوباره تلاش کنید." },
      { status: 500 }
    );
  }
}
