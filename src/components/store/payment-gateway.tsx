"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ShieldCheck, Lock, Loader2, CheckCircle2, XCircle, ArrowRight,
  CreditCard, Wallet, ReceiptText, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useView } from "@/lib/panel-store";
import { useCart } from "@/lib/cart-store";
import { faNumber, faPrice, faDateTime } from "@/lib/format";

// =====================================================================
// درگاه پرداخت اینترنتی (شبیه‌ساز کامل درگاه بانکی)
// در حالت واقعی «زرین‌پال»، کاربر به سایت بانک منتقل می‌شود و با
// #pay/<authority> به همین صفحه برای دیدن رسید برمی‌گردد.
// =====================================================================

interface GatewayPayment {
  authority: string;
  amount: number;
  kind: "order" | "wallet_charge";
  gateway: string;
  status: "pending" | "success" | "failed" | "canceled";
  description: string;
  refId: string;
  cardPan: string;
  createdAt: string;
  order: { id: string; code: string; status: string; paidAt: string | null } | null;
}

type Phase = "loading" | "form" | "processing" | "receipt" | "error" | "gone";

const TEST_CARD = "6037997512345678";

function formatCardNumber(v: string): string {
  const digits = v.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1-");
}

export default function PaymentGateway() {
  const authority = useView((s) => s.gatewayAuthority);
  const setView = useView((s) => s.setView);

  const [phase, setPhase] = useState<Phase>("loading");
  const [payment, setPayment] = useState<GatewayPayment | null>(null);
  const [loadError, setLoadError] = useState("");

  // card form
  const [pan, setPan] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [cvv, setCvv] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [payError, setPayError] = useState("");
  const [paying, setPaying] = useState(false);
  const [receipt, setReceipt] = useState<{ refId: string; cardPan: string; orderCode: string | null; kind: string } | null>(null);
  const otpTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!authority) {
        setPhase("gone");
        return;
      }
      setPhase("loading");
      try {
        const res = await fetch(`/api/payment?authority=${encodeURIComponent(authority)}`, { cache: "no-store" });
        const json = await res.json();
        if (cancelled) return;
        if (json.success) {
          const p = json.payment as GatewayPayment;
          setPayment(p);
          if (p.status === "success") {
            setReceipt({ refId: p.refId, cardPan: p.cardPan, orderCode: p.order?.code ?? null, kind: p.kind });
            setPhase("receipt");
          } else if (p.status === "pending") {
            setPhase("form");
          } else {
            setPhase("error");
            setPayError(
              p.status === "canceled"
                ? "این پرداخت لغو شده است."
                : "این تراکنش ناموفق بود. مبلغی از حساب شما کسر نشده است."
            );
          }
        } else {
          setLoadError(json.error ?? "تراکنش یافت نشد.");
          setPhase("gone");
        }
      } catch {
        if (!cancelled) {
          setLoadError("خطا در اتصال به درگاه. لطفاً اتصال اینترنت را بررسی کنید.");
          setPhase("gone");
        }
      }
    }
    load();
    return () => {
      cancelled = true;
      if (otpTimer.current) clearTimeout(otpTimer.current);
    };
  }, [authority]);

  const cardValid = useMemo(
    () => pan.replace(/\D/g, "").length === 16 && /^\d{2}$/.test(month) && +month >= 1 && +month <= 12
      && /^\d{2}$/.test(year) && /^\d{3,4}$/.test(cvv) && otp.replace(/\D/g, "").length >= 4,
    [pan, month, year, cvv, otp]
  );

  function sendOtp() {
    setOtpSent(true);
    setOtp("");
    // شبیه‌سازی پیامک رمز پویا
    otpTimer.current = setTimeout(() => setOtp("482913"), 900);
  }

  async function pay() {
    if (!payment || paying) return;
    setPaying(true);
    setPayError("");
    setPhase("processing");
    // تأخیر کوتاه تا حس واقعی درگاه بانکی منتقل شود
    await new Promise((r) => setTimeout(r, 1400));
    try {
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", authority: payment.authority, outcome: "success", cardPan: pan }),
      });
      const json = await res.json();
      if (json.success) {
        setReceipt({ refId: json.refId ?? "", cardPan: json.cardPan ?? "", orderCode: json.orderCode ?? null, kind: json.kind ?? payment.kind });
        if ((json.kind ?? payment.kind) === "order") useCart.getState().clear();
        setPhase("receipt");
      } else {
        setPayError(json.error ?? "تراکنش ناموفق بود.");
        setPhase("error");
      }
    } catch {
      setPayError("خطای شبکه در ارتباط با بانک. لطفاً دوباره تلاش کنید.");
      setPhase("error");
    } finally {
      setPaying(false);
    }
  }

  async function cancelPay() {
    if (!payment) return;
    try {
      await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", authority: payment.authority }),
      });
    } catch {
      /* ignore */
    }
    setView("shop");
  }

  async function retryPayment() {
    // تراکنش جدید برای همان سفارش می‌سازیم و به فرم برمی‌گردیم
    if (!payment?.order) { setView("shop"); return; }
    try {
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "retry", orderId: payment.order.id }),
      });
      const json = await res.json();
      if (json.success && json.authority) {
        useView.getState().openGateway(json.authority);
        return;
      }
      setPayError(json.error ?? "امکان پرداخت مجدد نیست.");
    } catch {
      setPayError("خطای شبکه. لطفاً دوباره تلاش کنید.");
    }
    setPhase("form");
  }

  // ============================ renders ============================

  if (phase === "loading") {
    return (
      <div className="min-h-screen grid place-items-center bg-[#eef1f6]">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="size-8 animate-spin" />
          <p className="text-sm font-bold">در حال اتصال به درگاه پرداخت...</p>
        </div>
      </div>
    );
  }

  if (phase === "gone") {
    return (
      <div className="min-h-screen grid place-items-center bg-[#eef1f6] p-4">
        <div className="w-full max-w-md rounded-3xl bg-white shadow-xl p-8 text-center space-y-4">
          <span className="grid place-items-center size-16 rounded-full bg-red-50 mx-auto">
            <XCircle className="size-8 text-red-500" />
          </span>
          <h2 className="font-extrabold text-slate-800">درگاه در دسترس نیست</h2>
          <p className="text-sm text-slate-500 leading-6">{loadError}</p>
          <Button onClick={() => setView("shop")} className="rounded-full bg-slate-800 text-white hover:bg-slate-700 w-full">
            <ArrowRight className="size-4 rotate-180" /> بازگشت به فروشگاه
          </Button>
        </div>
      </div>
    );
  }

  if (phase === "receipt" && receipt) {
    const isWallet = receipt.kind === "wallet_charge";
    return (
      <div className="min-h-screen grid place-items-center bg-[#eef1f6] p-4" dir="rtl">
        <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-xl">
          <div className="h-1.5 bg-emerald-500" />
          <div className="p-8 text-center space-y-4">
            <span className="grid place-items-center size-18 rounded-full bg-emerald-50 mx-auto">
              <CheckCircle2 className="size-10 text-emerald-500" />
            </span>
            <h2 className="font-extrabold text-xl text-slate-800">
              {isWallet ? "کیف پول شما شارژ شد!" : "پرداخت با موفقیت انجام شد!"}
            </h2>
            <p className="text-xs text-slate-500 leading-6">
              {isWallet
                ? "مبلغ شارژ به کیف پول حساب شما اضافه شد و در سفارش‌های بعدی قابل استفاده است."
                : "تراکنش شما تأیید شد. سفارش شما ثبت و در حال آماده‌سازی است."}
            </p>
            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-xs space-y-2.5 text-right">
              <div className="flex justify-between">
                <span className="text-slate-500">مبلغ:</span>
                <span className="font-extrabold text-slate-800">{faPrice(payment?.amount ?? 0)} تومان</span>
              </div>
              {receipt.cardPan && (
                <div className="flex justify-between">
                  <span className="text-slate-500">کارت:</span>
                  <span className="font-bold text-slate-700" dir="ltr">{receipt.cardPan}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">شماره پیگیری:</span>
                <span className="font-extrabold text-emerald-600" dir="ltr">{receipt.refId || "—"}</span>
              </div>
              {receipt.orderCode && (
                <div className="flex justify-between">
                  <span className="text-slate-500">کد رهگیری سفارش:</span>
                  <span className="font-extrabold text-slate-800" dir="ltr">{receipt.orderCode}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">پذیرنده:</span>
                <span className="font-bold text-slate-700">گلستان حافظ 🌸</span>
              </div>
            </div>
            <div className="flex gap-2">
              {isWallet ? (
                <Button
                  onClick={() => setView("user")}
                  className="flex-1 rounded-full bg-slate-800 text-white hover:bg-slate-700"
                >
                  <Wallet className="size-4" /> پنل کاربری
                </Button>
              ) : (
                <Button
                  onClick={() => setView("user")}
                  className="flex-1 rounded-full bg-slate-800 text-white hover:bg-slate-700"
                >
                  <ReceiptText className="size-4" /> سفارش‌های من
                </Button>
              )}
              <Button
                onClick={() => setView("shop")}
                variant="outline"
                className="flex-1 rounded-full border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                بازگشت به فروشگاه
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="min-h-screen grid place-items-center bg-[#eef1f6] p-4" dir="rtl">
        <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-xl">
          <div className="h-1.5 bg-red-500" />
          <div className="p-8 text-center space-y-4">
            <span className="grid place-items-center size-18 rounded-full bg-red-50 mx-auto">
              <XCircle className="size-10 text-red-500" />
            </span>
            <h2 className="font-extrabold text-xl text-slate-800">پرداخت انجام نشد</h2>
            <p className="text-sm text-slate-500 leading-6">{payError}</p>
            {payment?.order && payment.order.status !== "cancelled" && (
              <p className="text-[11px] text-slate-400 leading-5">
                سفارش شما با کد <span dir="ltr" className="font-bold">{payment.order.code}</span> ثبت شده و تا زمان پرداخت در «سفارش‌های من» منتظر می‌ماند.
              </p>
            )}
            <div className="flex gap-2">
              {payment?.order && (
                <Button onClick={retryPayment} className="flex-1 rounded-full bg-emerald-600 text-white hover:bg-emerald-500">
                  تلاش مجدد
                </Button>
              )}
              <Button
                onClick={() => setView("shop")}
                variant="outline"
                className="flex-1 rounded-full border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                بازگشت به فروشگاه
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------- form / processing ----------
  const isOrder = payment?.kind === "order";
  return (
    <div className="min-h-screen bg-[#eef1f6] py-6 px-4 flex flex-col items-center justify-center" dir="rtl">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-xl">
        {/* bank-style header */}
        <div className="bg-slate-800 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid place-items-center size-9 rounded-xl bg-slate-700">
              <ShieldCheck className="size-5 text-emerald-400" />
            </span>
            <div>
              <p className="text-xs font-extrabold">درگاه پرداخت اینترنتی</p>
              <p className="text-[10px] text-white/60 flex items-center gap-1">
                <Lock className="size-2.5" /> اتصال شما امن است — SSL
              </p>
            </div>
          </div>
          <span className="text-[10px] bg-slate-700 rounded-full px-2.5 py-1 text-white/80" dir="ltr">
            Golestane-Hafez IPG
          </span>
        </div>

        {payment && (
          <div className="px-5 py-4">
            {/* merchant / amount */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">پذیرنده:</span>
                <span className="font-extrabold text-slate-800">گل فروشی گلستان حافظ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isOrder ? "شرح تراکنش:" : "نوع تراکنش:"}</span>
                <span className="font-bold text-slate-700 truncate max-w-[220px]">
                  {isOrder ? payment.description : "شارژ کیف پول کاربری"}
                </span>
              </div>
              {isOrder && payment.order && (
                <div className="flex justify-between">
                  <span className="text-slate-500">کد سفارش:</span>
                  <span className="font-bold text-slate-700" dir="ltr">{payment.order.code}</span>
                </div>
              )}
              <div className="border-t border-dashed border-slate-200 pt-2.5 flex justify-between items-center">
                <span className="text-slate-500">مبلغ قابل پرداخت:</span>
                <span className="text-base font-extrabold text-slate-900">
                  {faPrice(payment.amount)} <span className="text-[10px] font-bold text-slate-500">تومان</span>
                </span>
              </div>
            </div>

            {/* test-mode hint */}
            <div className="mt-3 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3.5 py-2.5">
              <Sparkles className="size-3.5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] font-bold leading-5 text-amber-800">
                درگاه آزمایشی: هر شماره کارت ۱۶ رقمی و هر رمزی پذیرفته می‌شود.
                <button
                  type="button"
                  onClick={() => { setPan(formatCardNumber(TEST_CARD)); setMonth("08"); setYear("04"); setCvv("123"); setOtpSent(false); }}
                  className="mr-1 underline underline-offset-2 text-amber-900 hover:text-amber-950"
                >
                  پرکردن خودکار کارت تست
                </button>
              </p>
            </div>

            {/* card form */}
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5" htmlFor="gw-pan">شماره کارت</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-300" />
                  <Input
                    id="gw-pan"
                    value={pan}
                    onChange={(e) => setPan(formatCardNumber(e.target.value))}
                    inputMode="numeric"
                    dir="ltr"
                    placeholder="0000-0000-0000-0000"
                    className="h-11 rounded-xl border-slate-200 bg-slate-50 text-center tracking-widest font-bold text-slate-800 text-sm"
                    autoComplete="off"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5" htmlFor="gw-month">ماه</label>
                  <Input
                    id="gw-month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value.replace(/\D/g, "").slice(0, 2))}
                    inputMode="numeric"
                    dir="ltr"
                    placeholder="02"
                    className="h-11 rounded-xl border-slate-200 bg-slate-50 text-center font-bold"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5" htmlFor="gw-year">سال</label>
                  <Input
                    id="gw-year"
                    value={year}
                    onChange={(e) => setYear(e.target.value.replace(/\D/g, "").slice(0, 2))}
                    inputMode="numeric"
                    dir="ltr"
                    placeholder="04"
                    className="h-11 rounded-xl border-slate-200 bg-slate-50 text-center font-bold"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5" htmlFor="gw-cvv">CVV2</label>
                  <Input
                    id="gw-cvv"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    inputMode="numeric"
                    dir="ltr"
                    placeholder="123"
                    type="password"
                    className="h-11 rounded-xl border-slate-200 bg-slate-50 text-center font-bold"
                    autoComplete="off"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5" htmlFor="gw-otp">رمز دوم (پویا)</label>
                <div className="flex gap-2">
                  <Input
                    id="gw-otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 8))}
                    inputMode="numeric"
                    dir="ltr"
                    placeholder="------"
                    className="h-11 flex-1 rounded-xl border-slate-200 bg-slate-50 text-center font-bold tracking-widest"
                    autoComplete="off"
                  />
                  <Button
                    type="button"
                    onClick={sendOtp}
                    variant="outline"
                    className="h-11 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs px-3 shrink-0"
                  >
                    {otpSent ? "ارسال مجدد رمز" : "دریافت رمز پویا"}
                  </Button>
                </div>
                {otpSent && otp && (
                  <p className="mt-1.5 text-[10px] text-emerald-600 font-bold">
                    رمز پویا برای تست: {otp} — به‌صورت خودکار پر شد (شبیه‌سازی پیامک بانک)
                  </p>
                )}
              </div>
            </div>

            <Button
              onClick={pay}
              disabled={!cardValid || paying}
              className="mt-5 w-full h-12 rounded-full bg-emerald-600 text-white font-extrabold hover:bg-emerald-500 disabled:opacity-50"
            >
              <Lock className="size-4" />
              پرداخت {faPrice(payment.amount)} تومان
            </Button>
            <button
              type="button"
              onClick={cancelPay}
              className="mt-2.5 w-full text-center text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors py-2"
            >
              انصراف از پرداخت و بازگشت
            </button>
            <p className="mt-2 text-center text-[10px] text-slate-400 leading-5">
              این صفحه شبیه‌ساز درگاه بانکی است؛ هیچ پول واقعی جابه‌جا نمی‌شود.
              <br />
              برای فعال‌سازی درگاه واقعی زرین‌پال، از پنل مدیریت → تنظیمات، مرچنت کد را وارد کنید.
            </p>
          </div>
        )}
      </div>

      {/* processing overlay */}
      {phase === "processing" && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 backdrop-blur-sm" dir="rtl">
          <div className="rounded-3xl bg-white px-10 py-8 text-center space-y-3 shadow-2xl">
            <Loader2 className="size-9 animate-spin text-emerald-600 mx-auto" />
            <p className="text-sm font-extrabold text-slate-800">در حال اتصال به سامانه پرداخت بانکی...</p>
            <p className="text-[11px] text-slate-500">لطفاً صفحه را نبندید</p>
          </div>
        </div>
      )}

      {/* created-at footer */}
      {payment && phase === "form" && (
        <p className="mt-4 text-[10px] text-slate-400">
          شناسه تراکنش: <span dir="ltr">{payment.authority.slice(0, 12)}…</span> — {faDateTime(payment.createdAt)}
        </p>
      )}
    </div>
  );
}
