"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ShoppingBag, Truck, Gift, CheckCircle2, ChevronLeft, ChevronRight,
  ClipboardCheck, Loader2, PartyPopper, LogIn, Wallet, CreditCard,
  Banknote, Ticket, MapPin,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useCart, cartTotalPrice } from "@/lib/cart-store";
import { useView } from "@/lib/panel-store";
import { ADDON_OPTIONS, DELIVERY_SLOTS, getDeliveryDates } from "@/lib/shop-options";
import { faNumber } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";

const STEPS = [
  { id: 1, label: "اطلاعات ارسال", icon: Truck },
  { id: 2, label: "کارت و هدیه", icon: Gift },
  { id: 3, label: "مرور و پرداخت", icon: ClipboardCheck },
];

const SHIPPING_FEE = 89000;

export default function CheckoutDialog() {
  const isOpen = useCart((s) => s.checkoutOpen);
  const closeCheckout = useCart((s) => s.closeCheckout);
  const openCart = useCart((s) => s.openCart);
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const { toast } = useToast();
  const user = useView((s) => s.user);
  const openAuthModal = useView((s) => s.openAuthModal);
  const openGateway = useView((s) => s.openGateway);

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ code: string; points: number; total: number; method: string } | null>(null);

  // step 1
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");

  // step 2
  const [cardMessage, setCardMessage] = useState("");
  const [addons, setAddons] = useState<string[]>([]);
  const [giftWrap, setGiftWrap] = useState(true);

  // step 3 — payment
  const [paymentMethod, setPaymentMethod] = useState<"online" | "wallet" | "cod">("online");
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number; label: string } | null>(null);
  const [couponError, setCouponError] = useState("");

  const deliveryDates = useMemo(() => getDeliveryDates(7), []);

  // prefill receiver info from the logged-in user
  useEffect(() => {
    if (user && isOpen) {
      setName(user.name);
      setPhone(user.phone);
    }
  }, [user, isOpen]);

  // reset when reopened
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setDone(null);
      setCoupon(null);
      setCouponInput("");
      setCouponError("");
      setPaymentMethod("online");
    }
  }, [isOpen]);

  const goodsTotal = cartTotalPrice(items);
  // هزینه تحویل با اسنپ همیشه به عهده مشتری است
  const shipping = goodsTotal === 0 ? 0 : SHIPPING_FEE;
  const addonsTotal = addons.reduce((sum, id) => sum + (ADDON_OPTIONS.find((a) => a.id === id)?.price ?? 0), 0);
  const couponDiscount = coupon?.discount ?? 0;
  const grandTotal = Math.max(0, goodsTotal + shipping + addonsTotal - couponDiscount);

  const canStep1 = name.trim().length >= 3 && /^0\d{10}$/.test(phone.trim()) && address.trim().length >= 10 && date && slot;

  function resetAll() {
    setStep(1);
    setDone(null);
    setSubmitting(false);
    setName(""); setPhone(""); setAddress(""); setDate(""); setSlot("");
    setCardMessage(""); setAddons([]); setGiftWrap(true);
    setCoupon(null); setCouponInput(""); setCouponError(""); setPaymentMethod("online");
  }

  function handleClose(open: boolean) {
    if (!open) closeCheckout();
  }

  function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    setCouponError("");
    if (!code) return;
    if (code === "WELCOME") {
      const d = Math.round(goodsTotal * 0.2);
      setCoupon({ code, discount: d, label: "۲۰٪ تخفیف خوش‌آمدگویی" });
      toast({ title: "کد تخفیف اعمال شد 🎉", description: "۲۰٪ تخفیف خوش‌آمدگویی روی سفارش شما فعال شد." });
    } else if (code === "NOWRUZ" && goodsTotal >= 1000000) {
      setCoupon({ code, discount: 100000, label: "۱۰۰ هزار تومان هدیه نوروزی" });
      toast({ title: "کد تخفیف اعمال شد 🎉", description: "۱۰۰ هزار تومان تخفیف فعال شد." });
    } else if (code === "NOWRUZ") {
      setCouponError("این کد برای سفارش‌های بالای ۱٬۰۰۰٬۰۰۰ تومان است.");
    } else {
      setCouponError("کد تخفیف وارد شده معتبر نیست.");
    }
  }

  async function submitOrder() {
    if (submitting) return;
    if (!user) {
      openAuthModal("login");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverName: name,
          phone,
          address,
          deliveryDate: date,
          deliverySlot: DELIVERY_SLOTS.find((s) => s.id === slot)?.label ?? "",
          cardMessage,
          addons: addons.map((id) => {
            const a = ADDON_OPTIONS.find((x) => x.id === id)!;
            return { id: a.id, name: a.name, price: a.price };
          }),
          couponCode: coupon?.code ?? "",
          paymentMethod,
          items: items.map((i) => ({ productId: i.id, qty: i.qty })),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.needPayment) {
          // پرداخت آنلاین → انتقال به درگاه پرداخت اینترنتی
          clear();
          toast({
            title: "در حال انتقال به درگاه پرداخت...",
            description: `سفارش ${data.code} ثبت شد؛ پس از پرداخت موفق نهایی می‌شود.`,
          });
          if (data.redirectUrl) {
            // درگاه واقعی زرین‌پال
            window.location.href = data.redirectUrl as string;
            return;
          }
          closeCheckout();
          openGateway(data.authority as string);
          return;
        }
        setDone({ code: data.code, points: data.pointsEarned ?? 0, total: data.total ?? grandTotal, method: paymentMethod });
        clear();
        toast({
          title: "سفارش شما ثبت شد!",
          description: `کد رهگیری: ${data.code}`,
        });
      } else {
        toast({
          title: "خطا در ثبت سفارش",
          description: data.error ?? "لطفاً اطلاعات را بررسی کنید.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "خطای شبکه",
        description: "لطفاً اتصال اینترنت را بررسی و دوباره تلاش کنید.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const selectedAddonsLabels = addons
    .map((id) => ADDON_OPTIONS.find((a) => a.id === id)?.name ?? "")
    .filter(Boolean)
    .join("، ");

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg p-0 rounded-3xl bg-cream overflow-hidden max-h-[90vh] flex flex-col">
        {done ? (
          <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
            <span className="grid place-items-center size-20 rounded-full bg-sage-soft text-sage-dark">
              <PartyPopper className="size-10" />
            </span>
            <h3 className="font-extrabold text-xl text-charcoal">پرداخت با موفقیت انجام شد!</h3>
            <p className="text-sm text-muted-foreground leading-7">
              از خرید شما سپاسگزاریم. دسته‌گل شما با عشق آماده و در زمان انتخابی به مقصد می‌رسد.
              {done.points > 0 && (
                <span className="block mt-1 font-bold text-gold-dark">
                  {faNumber(done.points)} امتیاز باشگاه مشتریان کسب کردید!
                </span>
              )}
            </p>
            <div className="w-full bg-white rounded-2xl p-4 shadow-sm space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">کد رهگیری:</span>
                <span className="font-extrabold text-gold-dark" dir="ltr">{done.code}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">زمان ارسال:</span>
                <span className="font-bold text-charcoal">{date} — {DELIVERY_SLOTS.find((s) => s.id === slot)?.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">مبلغ پرداختی:</span>
                <span className="font-bold text-charcoal">{faNumber(done.total)} تومان</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">روش پرداخت:</span>
                <span className="font-bold text-charcoal">
                  {done.method === "wallet" ? "کیف پول گلستان" : done.method === "cod" ? "پرداخت در محل" : "پرداخت آنلاین"}
                </span>
              </div>
            </div>
            <div className="flex gap-2 w-full">
              <Button
                onClick={() => { resetAll(); closeCheckout(); }}
                className="flex-1 rounded-full bg-charcoal text-white hover:bg-charcoal/85"
              >
                بازگشت به فروشگاه
              </Button>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 p-10 text-center">
            <span className="grid place-items-center size-20 rounded-full bg-blush-soft text-blush-dark">
              <ShoppingBag className="size-10" />
            </span>
            <h3 className="font-bold text-lg text-charcoal">سبد خرید شما خالی است</h3>
            <p className="text-sm text-muted-foreground">اول گلی انتخاب کنید تا تسویه‌حساب را شروع کنیم!</p>
            <Button
              onClick={() => { closeCheckout(); openCart(); }}
              variant="outline"
              className="rounded-full"
            >
              بازگشت به سبد
            </Button>
          </div>
        ) : !user ? (
          /* ---------- login gate ---------- */
          <div className="flex flex-col items-center justify-center gap-4 p-10 text-center">
            <span className="grid place-items-center size-20 rounded-full bg-gold-soft text-gold-dark">
              <LogIn className="size-10" />
            </span>
            <h3 className="font-bold text-lg text-charcoal">برای ثبت سفارش وارد حساب شوید</h3>
            <p className="text-sm text-muted-foreground leading-7">
              ثبت سفارش، پیگیری مرسوله و استفاده از کیف پول و کدهای تخفیف نیاز به حساب کاربری دارد.
              <span className="block mt-1">ثبت‌نام کمتر از ۳۰ ثانیه طول می‌کشد + ۵۰ هزار تومان هدیه!</span>
            </p>
            <div className="flex gap-2 w-full">
              <Button
                onClick={() => { closeCheckout(); openAuthModal("register"); }}
                className="flex-1 rounded-full bg-charcoal text-white hover:bg-charcoal/85"
              >
                ثبت‌نام سریع
              </Button>
              <Button
                onClick={() => openAuthModal("login")}
                variant="outline"
                className="flex-1 rounded-full"
              >
                ورود به حساب
              </Button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader className="px-6 pt-6 pb-0 space-y-1">
              <DialogTitle className="text-right text-charcoal flex items-center gap-2">
                <ShoppingBag className="size-5 text-blush-dark" />
                تسویه‌حساب نهایی
              </DialogTitle>
              <DialogDescription className="text-right text-xs">
                در سه ساده قدم سفارش خود را نهایی کنید.
              </DialogDescription>
            </DialogHeader>

            {/* steps indicator */}
            <div className="px-6 pt-4">
              <ol className="flex items-center gap-1" aria-label="مراحل تسویه‌حساب">
                {STEPS.map((s, i) => (
                  <li key={s.id} className="flex-1 flex items-center gap-1">
                    <button
                      onClick={() => { if (s.id < step) setStep(s.id); }}
                      disabled={s.id > step}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                        step === s.id
                          ? "bg-charcoal text-white shadow"
                          : step > s.id
                          ? "bg-sage-soft text-sage-dark cursor-pointer"
                          : "bg-white text-muted-foreground border border-border"
                      }`}
                      aria-current={step === s.id ? "step" : undefined}
                    >
                      {step > s.id ? <CheckCircle2 className="size-3.5" /> : <s.icon className="size-3.5" />}
                      {s.label}
                    </button>
                    {i < STEPS.length - 1 && (
                      <span className={`h-0.5 flex-1 rounded ${step > s.id ? "bg-sage" : "bg-border"}`} />
                    )}
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {step === 1 && (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-blush-soft/40 border border-blush/40 p-3 flex items-center gap-2 text-[11px] text-charcoal/80">
                    <MapPin className="size-3.5 text-blush-dark shrink-0" />
                    آدرس‌های ذخیره‌شده شما در پنل کاربری قابل مدیریت است؛ اینجا می‌توانید آدرس دیگری برای همین سفارش وارد کنید.
                  </div>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="نام و نام خانوادگی گیرنده" className="rounded-xl bg-white border-border" />
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="شماره تماس گیرنده (۰۹xxxxxxxxx)" inputMode="tel" dir="ltr" className="rounded-xl bg-white border-border text-right" />
                  <Textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="آدرس کامل دریافت‌کننده (استان، شهر، خیابان، پلاک...)" rows={2} className="rounded-xl bg-white border-border resize-none" />

                  <div className="rounded-2xl bg-sage-soft/50 border border-sage/50 p-3 flex items-center gap-2 text-[11px] text-charcoal/80">
                    <Truck className="size-3.5 text-sage-dark shrink-0" />
                    تحویل سفارش در محل انتخابی شما انجام می‌شود.
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <p className="text-xs font-bold text-charcoal">روز ارسال:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {deliveryDates.map((d) => (
                        <button
                          key={d.value}
                          type="button"
                          onClick={() => setDate(d.value)}
                          className={`rounded-xl border-2 px-3 py-2 text-[11px] font-semibold transition-all text-right ${
                            date === d.value ? "border-blush-dark bg-blush-soft/60 text-charcoal" : "border-border bg-white text-charcoal/70 hover:border-blush"
                          }`}
                          aria-pressed={date === d.value}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-charcoal">بازه ساعت ارسال:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {DELIVERY_SLOTS.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSlot(s.id)}
                          className={`rounded-xl border-2 px-3 py-2 text-[11px] font-semibold transition-all text-right ${
                            slot === s.id ? "border-blush-dark bg-blush-soft/60 text-charcoal" : "border-border bg-white text-charcoal/70 hover:border-blush"
                          }`}
                          aria-pressed={slot === s.id}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-charcoal">پیام روی کارت تبریک (اختیاری):</p>
                    <Textarea
                      value={cardMessage}
                      onChange={(e) => setCardMessage(e.target.value)}
                      placeholder="مثلاً: تولدت مبارک عزیزم! امیدوارم روزی به‌شیرینی این گل‌ها باشه 🌸"
                      rows={3}
                      maxLength={200}
                      className="rounded-xl bg-white border-border resize-none"
                    />
                    <p className="text-[10px] text-left text-muted-foreground">{faNumber(cardMessage.length)} از ۲۰۰</p>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-charcoal">افزودن هدیه جانبی:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {ADDON_OPTIONS.map((a) => {
                        const selected = addons.includes(a.id);
                        return (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() =>
                              setAddons((prev) => (selected ? prev.filter((x) => x !== a.id) : [...prev, a.id]))
                            }
                            className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 transition-all text-right ${
                              selected ? "border-gold bg-gold-soft/50" : "border-border bg-white hover:border-gold/60"
                            }`}
                            aria-pressed={selected}
                          >
                            <span className="text-lg leading-none">{a.emoji}</span>
                            <span className="flex-1 min-w-0">
                              <span className="block text-[11px] font-bold text-charcoal truncate">{a.name}</span>
                              <span className="block text-[10px] text-gold-dark font-bold">+ {faNumber(a.price)} تومان</span>
                            </span>
                            {selected && <CheckCircle2 className="size-4 text-gold-dark shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setGiftWrap((v) => !v)}
                    className={`w-full flex items-center justify-between rounded-xl border-2 px-4 py-3 transition-all ${
                      giftWrap ? "border-sage bg-sage-soft/50" : "border-border bg-white"
                    }`}
                    aria-pressed={giftWrap}
                  >
                    <span className="flex items-center gap-2 text-xs font-bold text-charcoal">
                      <Gift className="size-4 text-sage-dark" />
                      بسته‌بندی کلاسیک گلستان (رایگان)
                    </span>
                    <span className={`w-10 h-5.5 rounded-full relative transition-colors ${giftWrap ? "bg-sage-dark" : "bg-border"}`}>
                      <span className={`absolute top-0.5 size-4.5 rounded-full bg-white shadow transition-all ${giftWrap ? "right-0.5" : "right-5"}`} />
                    </span>
                  </button>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-3">
                  {/* items */}
                  <div className="bg-white rounded-2xl p-3.5 shadow-sm space-y-2">
                    <p className="text-xs font-bold text-charcoal mb-1">اقلام سفارش:</p>
                    {items.map((i) => (
                      <div key={i.id} className="flex items-center justify-between gap-2 text-xs">
                        <span className="flex items-center gap-2 min-w-0">
                          <img src={i.image} alt="" className="size-9 rounded-lg object-cover shrink-0" />
                          <span className="truncate font-semibold text-charcoal">{i.name} × {faNumber(i.qty)}</span>
                        </span>
                        <span className="font-bold text-gold-dark whitespace-nowrap">{faNumber(i.price * i.qty)}</span>
                      </div>
                    ))}
                  </div>

                  {/* delivery summary */}
                  <div className="bg-white rounded-2xl p-3.5 shadow-sm text-xs space-y-1.5">
                    <p className="font-bold text-charcoal mb-1">اطلاعات ارسال:</p>
                    <p className="text-muted-foreground leading-6">
                      <span className="font-semibold text-charcoal">گیرنده:</span> {name} — <span dir="ltr">{phone}</span>
                    </p>
                    <p className="text-muted-foreground leading-6">
                      <span className="font-semibold text-charcoal">آدرس:</span> {address}
                    </p>
                    <p className="text-muted-foreground leading-6">
                      <span className="font-semibold text-charcoal">زمان:</span> {date}، {DELIVERY_SLOTS.find((s) => s.id === slot)?.label}
                    </p>
                  </div>

                  {/* gift summary */}
                  {(cardMessage || selectedAddonsLabels) && (
                    <div className="bg-white rounded-2xl p-3.5 shadow-sm text-xs space-y-1.5">
                      <p className="font-bold text-charcoal mb-1">کارت و هدیه:</p>
                      {cardMessage && (
                        <p className="text-muted-foreground leading-6">
                          <span className="font-semibold text-charcoal">پیام کارت:</span> «{cardMessage}»
                        </p>
                      )}
                      {selectedAddonsLabels && (
                        <p className="text-muted-foreground leading-6">
                          <span className="font-semibold text-charcoal">هدایای جانبی:</span> {selectedAddonsLabels}
                        </p>
                      )}
                    </div>
                  )}

                  {/* coupon */}
                  <div className="bg-white rounded-2xl p-3.5 shadow-sm space-y-2">
                    <p className="text-xs font-bold text-charcoal flex items-center gap-1.5">
                      <Ticket className="size-3.5 text-gold-dark" /> کد تخفیف:
                    </p>
                    <div className="flex gap-2">
                      <Input
                        value={couponInput}
                        onChange={(e) => { setCouponInput(e.target.value); setCouponError(""); }}
                        placeholder="مثلاً WELCOME"
                        dir="ltr"
                        className="rounded-xl bg-white border-border text-left text-xs"
                      />
                      <Button
                        type="button"
                        onClick={applyCoupon}
                        size="sm"
                        className="rounded-xl bg-charcoal text-white hover:bg-charcoal/85 text-xs px-4"
                      >
                        اعمال
                      </Button>
                    </div>
                    {coupon && (
                      <p className="text-[11px] font-bold text-sage-dark flex items-center gap-1">
                        <CheckCircle2 className="size-3.5" /> کد «{coupon.code}» اعمال شد — {coupon.label}
                        <button onClick={() => setCoupon(null)} className="text-muted-foreground underline mr-1">حذف</button>
                      </p>
                    )}
                    {couponError && (
                      <p className="text-[11px] font-bold text-[#c0392b]">{couponError}</p>
                    )}
                  </div>

                  {/* payment method */}
                  <div className="bg-white rounded-2xl p-3.5 shadow-sm space-y-2">
                    <p className="text-xs font-bold text-charcoal mb-1">روش پرداخت:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "online" as const, label: "آنلاین", icon: CreditCard, desc: "درگاه بانکی" },
                        { id: "wallet" as const, label: "کیف پول", icon: Wallet, desc: `${faNumber(user.walletBalance)} ت` },
                        { id: "cod" as const, label: "در محل", icon: Banknote, desc: "هنگام تحویل" },
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPaymentMethod(m.id)}
                          className={`rounded-xl border-2 px-2 py-2.5 transition-all text-center ${
                            paymentMethod === m.id ? "border-gold bg-gold-soft/40" : "border-border bg-white hover:border-gold/50"
                          }`}
                          aria-pressed={paymentMethod === m.id}
                        >
                          <m.icon className={`size-4 mx-auto ${paymentMethod === m.id ? "text-gold-dark" : "text-muted-foreground"}`} />
                          <span className="block text-[11px] font-bold text-charcoal mt-1">{m.label}</span>
                          <span className="block text-[9px] text-muted-foreground">{m.desc}</span>
                        </button>
                      ))}
                    </div>
                    {paymentMethod === "wallet" && user.walletBalance < grandTotal && (
                      <p className="text-[11px] font-bold text-[#c0392b]">
                        موجودی کیف پول کافی نیست؛ از پنل کاربری شارژ کنید یا روش دیگری انتخاب کنید.
                      </p>
                    )}
                  </div>

                  {/* totals */}
                  <div className="bg-white rounded-2xl p-3.5 shadow-sm text-xs space-y-1.5">
                    <div className="flex justify-between text-muted-foreground">
                      <span>جمع کالاها</span>
                      <span>{faNumber(goodsTotal)} تومان</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>هدایای جانبی</span>
                      <span>{addonsTotal === 0 ? "—" : `${faNumber(addonsTotal)} تومان`}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>هزینه ارسال با اسنپ</span>
                      <span>{shipping === 0 ? "—" : `${faNumber(shipping)} تومان`}</span>
                    </div>
                    {couponDiscount > 0 && (
                      <div className="flex justify-between text-sage-dark font-bold">
                        <span>تخفیف کد {coupon?.code}</span>
                        <span dir="ltr">−{faNumber(couponDiscount)}</span>
                      </div>
                    )}
                    <Separator className="my-1" />
                    <div className="flex justify-between font-extrabold text-charcoal text-sm">
                      <span>مبلغ قابل پرداخت</span>
                      <span className="text-gold-dark">{faNumber(grandTotal)} تومان</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-muted-foreground leading-5 text-center">
                    {paymentMethod === "online"
                      ? "با کلیک روی «پرداخت» به درگاه پرداخت اینترنتی منتقل می‌شوید؛ پس از پرداخت موفق، سفارش نهایی و انبار کسر می‌شود."
                      : "با کلیک روی «پرداخت»، سفارش شما واقعاً ثبت می‌شود؛ موجودی انبار کسر و امتیاز باشگاه مشتریان به حساب شما اضافه می‌گردد."}
                  </p>
                </div>
              )}
            </div>

            {/* footer nav */}
            <div className="bg-white border-t border-border px-6 py-4 flex items-center gap-2">
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setStep((s) => s - 1)}
                  className="rounded-full h-11 px-4"
                  aria-label="مرحله قبل"
                >
                  <ChevronRight className="size-4" />
                  قبلی
                </Button>
              )}
              {step < 3 ? (
                <Button
                  onClick={() => setStep((s) => s + 1)}
                  disabled={step === 1 && !canStep1}
                  className="flex-1 rounded-full bg-charcoal text-white hover:bg-charcoal/85 font-bold h-11"
                >
                  مرحله بعد
                  <ChevronLeft className="size-4" />
                </Button>
              ) : (
                <Button
                  onClick={submitOrder}
                  disabled={submitting || (paymentMethod === "wallet" && user.walletBalance < grandTotal)}
                  className="flex-1 rounded-full bg-gold hover:bg-gold-dark text-white font-bold h-11"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      در حال ثبت سفارش...
                    </>
                  ) : (
                    <>
                      {paymentMethod === "online" ? "پرداخت آنلاین " : "پرداخت "}{faNumber(grandTotal)} تومان
                      <ChevronLeft className="size-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
