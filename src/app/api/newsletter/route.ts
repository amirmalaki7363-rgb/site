import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { assertSameOrigin, clientIp, isRateLimited, str, tooManyRequests } from "@/lib/security";

export const dynamic = "force-dynamic";
const SUBJECT = "عضویت در خبرنامه";

export async function POST(req: NextRequest) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;
  if (isRateLimited(`newsletter:${clientIp(req)}`, 5, 60 * 60_000)) return tooManyRequests();
  try {
    const body = (await req.json().catch(() => ({}))) as { email?: unknown };
    const email = str(body.email, 120).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return NextResponse.json({ success: false, error: "ایمیل معتبر نیست." }, { status: 400 });
    }
    const exists = await db.message.findFirst({ where: { subject: SUBJECT, body: email } });
    if (!exists) {
      // shows up in the admin panel inbox (پیام‌ها) — no extra table/migration needed
      await db.message.create({ data: { name: "خبرنامه", phone: "-", subject: SUBJECT, body: email } });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("POST /api/newsletter error:", e);
    return NextResponse.json({ success: false, error: "ثبت عضویت انجام نشد. دوباره تلاش کنید." }, { status: 500 });
  }
}
