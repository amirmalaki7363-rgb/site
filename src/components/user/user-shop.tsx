"use client";

import { useMemo, useState } from "react";
import {
  Heart, ShoppingCart, Trash2, MapPin, Plus, Pencil, Star, Wallet as WalletIcon,
  Copy, ArrowDownCircle, ArrowUpCircle, Gift, RefreshCcw, Ticket, BadgeCheck,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog, EmptyState, Field, SectionHeader } from "@/components/panel/shared";
import { usePanel } from "@/components/panel/panel-context";
import { useWishlist } from "@/lib/wishlist-store";
import { useCart } from "@/lib/cart-store";
import { useView } from "@/lib/panel-store";
import { panelMutate } from "@/lib/panel-api";
import type { Address } from "@/lib/types";
import { faPrice, faNumber, faDateTime, faDate } from "@/lib/format";

const inputCls =
  "w-full rounded-2xl border border-input bg-white px-3.5 py-2.5 text-sm text-charcoal placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-blush transition-shadow";

// ==================== Favorites ====================
export function FavoritesSection() {
  const { data, refresh, toast } = usePanel();
  const items = data.favorites;
  const addItem = useCart((s) => s.addItem);
  const openCart = useCart((s) => s.openCart);
  const { syncLocal } = useWishlist.getState();

  async function removeFav(productId: string) {
    const res = await panelMutate("favorite.remove", { data: { productId } });
    if (res.success) {
      toast("از علاقه‌مندی‌ها حذف شد.");
      await refresh();
      syncLocal?.(productId);
    }
  }

  return (
    <div>
      <SectionHeader
        title="علاقه‌مندی‌های من"
        desc="گل‌هایی که قلب شما را بردند؛ در حساب شما ذخیره شده‌اند و همه‌جا همراهتان هستند."
        action={
          items.length > 0 ? (
            <button
              onClick={() => {
                items.forEach((i) => addItem({ id: i.productId, name: i.name, price: i.price, image: i.image }));
                toast("همه علاقه‌مندی‌ها به سبد اضافه شد.");
                openCart();
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-sage-soft text-sage-dark px-4 py-2 text-xs font-bold hover:bg-sage/40 transition-colors"
            >
              <ShoppingCart className="size-3.5" /> افزودن همه به سبد
            </button>
          ) : undefined
        }
      />
      {items.length === 0 ? (
        <EmptyState
          icon={<Heart className="size-7" />}
          title="لیست علاقه‌مندی‌های شما خالی است"
          desc="روی قلب هر محصول در فروشگاه بزنید تا برای همیشه در حساب شما ذخیره شود."
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((it) => (
            <div key={it.id} className="group rounded-3xl bg-white border border-border overflow-hidden shadow-[0_2px_12px_rgba(44,44,44,0.04)]">
              <div className="relative aspect-square overflow-hidden">
                <img src={it.image} alt={it.name} className="size-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <button
                  onClick={() => removeFav(it.productId)}
                  className="absolute top-2 left-2 grid place-items-center size-8 rounded-full bg-white/90 text-blush-dark shadow hover:bg-blush-soft transition-colors"
                  aria-label={`حذف ${it.name} از علاقه‌مندی‌ها`}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <div className="p-3.5">
                <p className="text-sm font-bold text-charcoal line-clamp-1">{it.name}</p>
                <p className="text-sm font-extrabold text-gold-dark mt-1">{faPrice(it.price)}</p>
                <button
                  onClick={() => { addItem({ id: it.productId, name: it.name, price: it.price, image: it.image }); toast("به سبد خرید اضافه شد."); }}
                  className="mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-charcoal text-white py-2 text-xs font-bold hover:bg-charcoal/85 transition-colors"
                >
                  <ShoppingCart className="size-3.5" /> افزودن به سبد
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== Addresses ====================
const emptyAddr: Omit<Address, "id" | "createdAt"> = {
  title: "", receiver: "", phone: "", province: "تهران", city: "", postal: "", line: "", isDefault: false,
};

export function AddressesSection() {
  const { data, refresh, toast } = usePanel();
  const [form, setForm] = useState<(Omit<Address, "id" | "createdAt"> & { id?: string }) | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Address | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!form) return;
    if (!form.title.trim() || !form.receiver.trim() || !/^0\d{10}$/.test(form.phone.trim()) || !form.line.trim() || !form.city.trim()) {
      toast("لطفاً فیلدهای ضروری را درست کامل کنید (تلفن ۱۱ رقمی).", true);
      return;
    }
    setSaving(true);
    const res = await panelMutate(form.id ? "address.update" : "address.create", {
      id: form.id, data: { ...form },
    });
    setSaving(false);
    if (res.success) {
      toast(form.id ? "آدرس ویرایش شد." : "آدرس جدید اضافه شد.");
      setForm(null);
      await refresh();
    } else {
      toast(res.error ?? "خطا در ذخیره آدرس", true);
    }
  }

  return (
    <div>
      <SectionHeader
        title="آدرس‌های من"
        desc="برای ارسال سریع‌تر سفارش‌ها، آدرس‌های پرکاربردتان را ذخیره کنید."
        action={
          <button
            onClick={() => setForm({ ...emptyAddr })}
            className="inline-flex items-center gap-1.5 rounded-full bg-charcoal text-white px-4 py-2 text-xs font-bold hover:bg-charcoal/85 transition-colors"
          >
            <Plus className="size-3.5" /> آدرس جدید
          </button>
        }
      />
      <div className="grid sm:grid-cols-2 gap-4">
        {data.addresses.map((a) => (
          <div key={a.id} className={`rounded-3xl bg-white border p-5 ${a.isDefault ? "border-blush shadow-[0_4px_20px_rgba(232,180,184,0.25)]" : "border-border"}`}>
            <div className="flex items-center justify-between gap-2">
              <p className="font-bold text-charcoal flex items-center gap-2">
                <MapPin className="size-4 text-blush-dark" />
                {a.title}
                {a.isDefault && (
                  <span className="rounded-full bg-blush-soft text-blush-dark text-[10px] px-2 py-0.5 font-bold">پیش‌فرض</span>
                )}
              </p>
              <div className="flex gap-1">
                <button onClick={() => setForm({ ...a })} className="grid place-items-center size-8 rounded-full text-muted-foreground hover:bg-cream-dark transition-colors" aria-label={`ویرایش ${a.title}`}>
                  <Pencil className="size-3.5" />
                </button>
                <button onClick={() => setDeleteTarget(a)} className="grid place-items-center size-8 rounded-full text-muted-foreground hover:bg-[#fbe4e3] hover:text-[#c0392b] transition-colors" aria-label={`حذف ${a.title}`}>
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
            <div className="mt-3 space-y-1.5 text-sm text-charcoal/80">
              <p><span className="text-muted-foreground text-xs">گیرنده: </span>{a.receiver} — <span dir="ltr">{a.phone}</span></p>
              <p className="leading-6">{a.province}، {a.city}، {a.line}</p>
              {a.postal && <p className="text-xs text-muted-foreground">کد پستی: <span dir="ltr">{faNumber(Number(a.postal || 0))}</span></p>}
            </div>
            {!a.isDefault && (
              <button
                onClick={async () => {
                  const res = await panelMutate("address.setDefault", { id: a.id });
                  if (res.success) { toast("آدرس پیش‌فرض تغییر کرد."); await refresh(); }
                }}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-gold-dark hover:text-gold transition-colors"
              >
                <Star className="size-3.5" /> تنظیم به‌عنوان پیش‌فرض
              </button>
            )}
          </div>
        ))}
      </div>

      <Dialog open={!!form} onOpenChange={(v) => !v && setForm(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto rounded-3xl" aria-describedby="addr-form-desc">
          <DialogHeader>
            <DialogTitle className="text-right text-charcoal">{form?.id ? "ویرایش آدرس" : "افزودن آدرس جدید"}</DialogTitle>
            <DialogDescription id="addr-form-desc" className="text-right">
              اطلاعات دقیق‌تر = تحویل سریع‌تر و امن‌تر
            </DialogDescription>
          </DialogHeader>
          {form && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="عنوان آدرس" required>
                <input className={inputCls} value={form.title} placeholder="مثلاً خانه" onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </Field>
              <Field label="نام گیرنده" required>
                <input className={inputCls} value={form.receiver} onChange={(e) => setForm({ ...form, receiver: e.target.value })} />
              </Field>
              <Field label="شماره تماس" required>
                <input className={inputCls} dir="ltr" inputMode="numeric" value={form.phone} placeholder="09xxxxxxxxx" onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </Field>
              <Field label="استان">
                <input className={inputCls} value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} />
              </Field>
              <Field label="شهر" required>
                <input className={inputCls} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </Field>
              <Field label="کد پستی">
                <input className={inputCls} dir="ltr" inputMode="numeric" value={form.postal} onChange={(e) => setForm({ ...form, postal: e.target.value })} />
              </Field>
              <div className="col-span-2">
                <Field label="آدرس کامل" required>
                  <textarea className={`${inputCls} min-h-20 resize-none`} value={form.line} placeholder="خیابان، کوچه، پلاک، واحد..." onChange={(e) => setForm({ ...form, line: e.target.value })} />
                </Field>
              </div>
              <label className="col-span-2 flex items-center gap-2 text-sm text-charcoal cursor-pointer">
                <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} className="size-4 accent-[#e8b4b8]" />
                تنظیم به‌عنوان آدرس پیش‌فرض
              </label>
              <div className="col-span-2 flex gap-2 pt-1">
                <button onClick={save} disabled={saving} className="flex-1 rounded-full bg-charcoal text-white py-2.5 text-sm font-bold hover:bg-charcoal/85 transition-colors disabled:opacity-60">
                  {saving ? "در حال ذخیره..." : "ذخیره آدرس"}
                </button>
                <button onClick={() => setForm(null)} className="rounded-full bg-cream-dark text-charcoal px-5 py-2.5 text-sm font-bold hover:bg-border transition-colors">
                  انصراف
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="حذف آدرس"
        message={`آدرس «${deleteTarget?.title ?? ""}» حذف شود؟`}
        onConfirm={async () => {
          if (!deleteTarget) return;
          const res = await panelMutate("address.delete", { id: deleteTarget.id });
          if (res.success) { toast("آدرس حذف شد."); await refresh(); }
        }}
      />
    </div>
  );
}

// ==================== Wallet ====================
const CHARGE_AMOUNTS = [200000, 500000, 1000000, 2000000];

export function WalletSection() {
  const { data, refresh, toast } = usePanel();
  const openGateway = useView((s) => s.openGateway);
  const [amount, setAmount] = useState<number>(500000);
  const [custom, setCustom] = useState("");
  const [charging, setCharging] = useState(false);

  const totals = useMemo(() => {
    let charge = 0, spend = 0;
    for (const t of data.walletTx) {
      if (t.type === "charge" || t.type === "gift" || t.type === "refund") charge += t.amount;
      else spend += t.amount;
    }
    return { charge, spend };
  }, [data.walletTx]);

  async function charge() {
    const value = custom ? Number(custom.replace(/\D/g, "")) : amount;
    setCharging(true);
    try {
      // شارژ کیف پول از طریق درگاه پرداخت اینترنتی
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "wallet-charge", amount: value }),
      });
      const json = await res.json();
      if (json.success && json.authority) {
        if (json.redirectUrl) {
          // درگاه واقعی زرین‌پال
          window.location.href = json.redirectUrl;
          return;
        }
        openGateway(json.authority);
      } else {
        toast(json.error ?? "خطا در اتصال به درگاه پرداخت", true);
      }
    } catch {
      toast("خطای شبکه در اتصال به درگاه", true);
    } finally {
      setCharging(false);
    }
  }

  return (
    <div>
      <SectionHeader title="کیف پول" desc="شارژ کنید و در سفارش‌های بعدی بدون کارت بانکی پرداخت کنید." />
      <div className="grid lg:grid-cols-5 gap-5">
        {/* balance card */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-charcoal via-[#3d3630] to-charcoal text-white p-6">
            <div className="absolute -top-10 -left-10 size-36 rounded-full bg-gold/20 blur-2xl" aria-hidden />
            <div className="absolute -bottom-8 -right-8 size-28 rounded-full bg-blush/20 blur-2xl" aria-hidden />
            <p className="text-xs text-white/60 flex items-center gap-1.5">
              <WalletIcon className="size-3.5 text-gold" /> موجودی کیف پول
            </p>
            <p className="mt-3 text-3xl font-extrabold">{faPrice(data.profile.walletBalance)}</p>
            <div className="mt-5 flex items-center gap-4 text-xs text-white/70">
              <span className="inline-flex items-center gap-1"><ArrowDownCircle className="size-3.5 text-sage" /> شارژ: {faPrice(totals.charge)}</span>
              <span className="inline-flex items-center gap-1"><ArrowUpCircle className="size-3.5 text-blush" /> مصرف: {faPrice(totals.spend)}</span>
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-border p-5">
            <h3 className="font-bold text-charcoal text-sm mb-3">شارژ کیف پول</h3>
            <div className="grid grid-cols-2 gap-2">
              {CHARGE_AMOUNTS.map((a) => (
                <button
                  key={a}
                  onClick={() => { setAmount(a); setCustom(""); }}
                  className={`rounded-2xl py-2.5 text-sm font-bold border transition-colors ${
                    amount === a && !custom ? "bg-blush-soft border-blush text-blush-dark" : "bg-white border-border text-charcoal/70 hover:bg-cream"
                  }`}
                >
                  {faPrice(a)}
                </button>
              ))}
            </div>
            <input
              className={`${inputCls} mt-3`}
              dir="ltr"
              inputMode="numeric"
              placeholder="مبلغ دلخواه به تومان"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
            />
            <button
              onClick={charge}
              disabled={charging}
              className="mt-3 w-full rounded-full bg-gold text-white py-2.5 text-sm font-bold hover:bg-gold-dark transition-colors disabled:opacity-60"
            >
              {charging ? "در حال اتصال به درگاه..." : "پرداخت و شارژ از طریق درگاه"}
            </button>
            <p className="mt-2 text-[11px] text-muted-foreground text-center">پرداخت امن از طریق درگاه پرداخت اینترنتی</p>
          </div>
        </div>

        {/* transactions */}
        <div className="lg:col-span-3">
          <div className="rounded-3xl bg-white border border-border p-5">
            <h3 className="font-bold text-charcoal text-sm mb-4 flex items-center gap-2">
              <RefreshCcw className="size-4 text-blush-dark" /> گردش حساب
            </h3>
            <div className="space-y-2 max-h-[480px] overflow-y-auto pl-1">
              {data.walletTx.map((t) => {
                const positive = t.type === "charge" || t.type === "gift" || t.type === "refund";
                return (
                  <div key={t.id} className="flex items-center gap-3 rounded-2xl border border-border/70 p-3 hover:bg-cream/50 transition-colors">
                    <span className={`grid place-items-center size-10 rounded-2xl shrink-0 ${positive ? "bg-sage-soft text-sage-dark" : "bg-blush-soft text-blush-dark"}`}>
                      {t.type === "gift" ? <Gift className="size-4" /> : positive ? <ArrowDownCircle className="size-4" /> : <ArrowUpCircle className="size-4" />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-charcoal truncate">{t.description}</p>
                      <p className="text-[11px] text-muted-foreground">{faDateTime(t.createdAt)}</p>
                    </div>
                    <p className={`text-sm font-extrabold shrink-0 ${positive ? "text-sage-dark" : "text-blush-dark"}`} dir="ltr">
                      {positive ? "+" : "−"}{faPrice(t.amount)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== Coupons ====================
export function CouponsSection() {
  const { data, toast } = usePanel();
  const [code, setCode] = useState("");

  const available = data.coupons.filter(
    (c) => c.isActive && c.used < c.maxUses && (!c.expiresAt || new Date(c.expiresAt) > new Date())
  );
  const usedOrExpired = data.coupons.filter(
    (c) => !c.isActive || c.used >= c.maxUses || (c.expiresAt && new Date(c.expiresAt) <= new Date())
  );

  function copyCode(c: string) {
    navigator.clipboard?.writeText(c).catch(() => {});
    toast(`کد «${c}» کپی شد؛ در تسویه‌حساب وارد کنید.`);
  }

  const CouponCard = ({ c, dead }: { c: (typeof data.coupons)[number]; dead?: boolean }) => (
    <div className={`relative overflow-hidden rounded-3xl border p-5 ${dead ? "bg-cream/60 border-border opacity-70" : "bg-white border-gold/30 shadow-[0_4px_20px_rgba(212,165,116,0.15)]"}`}>
      <div className="absolute top-0 bottom-0 left-9 border-l-2 border-dashed border-border" aria-hidden />
      <div className="flex items-start gap-4">
        <div className={`shrink-0 text-center ${dead ? "" : "pl-6"}`}>
          <p className="text-2xl font-extrabold text-gold-dark" dir="ltr">
            {c.type === "percent" ? `${faNumber(c.value)}٪` : faPrice(c.value)}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{c.type === "percent" ? "تخفیف" : "هدیه"}</p>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-charcoal">{c.title}</p>
          <p className="text-xs text-muted-foreground mt-1">
            حداقل سفارش: {faPrice(c.minOrder)}
            {c.expiresAt && <> — انقضا: {faDate(c.expiresAt)}</>}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="rounded-xl bg-cream-dark px-3 py-1.5 text-xs font-extrabold text-charcoal border border-border tracking-widest" dir="ltr">{c.code}</span>
            {!dead && (
              <button onClick={() => copyCode(c.code)} className="inline-flex items-center gap-1 text-xs font-bold text-gold-dark hover:text-gold transition-colors">
                <Copy className="size-3.5" /> کپی
              </button>
            )}
            {dead && (
              <span className="text-xs font-bold text-muted-foreground">{c.used >= c.maxUses ? "تمام شده" : "نامعتبر"}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <SectionHeader title="کدهای تخفیف من" desc="کد دلخواه را کپی کنید و در مرحله پرداخت وارد کنید." />
      <div className="rounded-3xl bg-white border border-border p-4 mb-5 flex gap-2">
        <input className={inputCls} dir="ltr" placeholder="کد تخفیف دارید؟ اینجا وارد کنید" value={code} onChange={(e) => setCode(e.target.value)} />
        <button
          onClick={() => {
            const found = data.coupons.find((c) => c.code.toLowerCase() === code.trim().toLowerCase());
            if (found && found.isActive && found.used < found.maxUses) toast(`کد «${found.code}» معتبر است؛ ${found.title}`);
            else toast("این کد معتبر نیست یا ظرفیت آن تمام شده.", true);
          }}
          className="shrink-0 rounded-2xl bg-charcoal text-white px-5 text-sm font-bold hover:bg-charcoal/85 transition-colors"
        >
          بررسی کد
        </button>
      </div>
      {available.length === 0 && usedOrExpired.length === 0 ? (
        <EmptyState icon={<Ticket className="size-7" />} title="کد تخفیفی ندارید" desc="با عضویت در خبرنامه و ثبت سفارش‌های بعدی، کد تخفیف هدیه بگیرید." />
      ) : (
        <div className="space-y-6">
          {available.length > 0 && (
            <div className="grid md:grid-cols-2 gap-4">
              {available.map((c) => <CouponCard key={c.id} c={c} />)}
            </div>
          )}
          {usedOrExpired.length > 0 && (
            <>
              <h3 className="text-sm font-bold text-muted-foreground">استفاده‌شده / منقضی</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {usedOrExpired.map((c) => <CouponCard key={c.id} c={c} dead />)}
              </div>
            </>
          )}
        </div>
      )}
      <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground bg-sage-soft/50 rounded-2xl p-4">
        <BadgeCheck className="size-4 text-sage-dark shrink-0" />
        کدهای تخفیف هدیه عضویت طلایی هر ماه اول ماه فعال می‌شوند.
      </div>
    </div>
  );
}
