"use client";

import { useMemo, useState } from "react";
import {
  Star, Trash2, Pencil, BellRing, CheckCheck, Trash, User as UserIcon, Shield,
  KeyRound, Smartphone, LogOut, MonitorSmartphone, Lock, Heart, Tag, Megaphone, Newspaper,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog, EmptyState, Field, SectionHeader, Stars } from "@/components/panel/shared";
import { usePanel } from "@/components/panel/panel-context";
import { panelMutate } from "@/lib/panel-api";
import { faRelative, faDateTime, faNumber, toEnDigits } from "@/lib/format";
import type { Review } from "@/lib/types";

const inputCls =
  "w-full rounded-2xl border border-input bg-white px-3.5 py-2.5 text-sm text-charcoal placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-blush transition-shadow";

// ==================== My Reviews ====================
export function MyReviewsSection() {
  const { data, refresh, toast } = usePanel();
  const myReviews = useMemo(
    () => data.reviews.filter((r) => r.author === data.profile.name),
    [data.reviews, data.profile.name]
  );
  const [form, setForm] = useState<{ productId: string; rating: number; comment: string } | null>(null);
  const [editTarget, setEditTarget] = useState<Review | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Review | null>(null);
  const [saving, setSaving] = useState(false);

  const statusLabel: Record<string, string> = {
    approved: "منتشر شده",
    pending: "در انتظار تأیید",
    rejected: "رد شده",
  };
  const statusCls: Record<string, string> = {
    approved: "bg-sage-soft text-sage-dark",
    pending: "bg-gold-soft text-gold-dark",
    rejected: "bg-[#fbe4e3] text-[#c0392b]",
  };

  async function submitNew() {
    if (!form) return;
    const product = data.products.find((p) => p.id === form.productId);
    if (!product || !form.comment.trim()) {
      toast("محصول و متن نظر را کامل کنید.", true);
      return;
    }
    setSaving(true);
    const res = await panelMutate("review.create", {
      data: {
        productId: product.id, productName: product.name, productImage: product.image,
        author: data.profile.name, rating: form.rating, comment: form.comment.trim(),
      },
    });
    setSaving(false);
    if (res.success) {
      toast("نظر شما ثبت شد و پس از تأیید منتشر می‌شود.");
      setForm(null);
      await refresh();
    } else toast(res.error ?? "خطا در ثبت نظر", true);
  }

  return (
    <div>
      <SectionHeader
        title="نظرات من"
        desc="تجربه‌تان از خرید گل‌ها را با دیگران به اشتراک بگذارید."
        action={
          <button
            onClick={() => setForm({ productId: data.products[0]?.id ?? "", rating: 5, comment: "" })}
            className="inline-flex items-center gap-1.5 rounded-full bg-charcoal text-white px-4 py-2 text-xs font-bold hover:bg-charcoal/85 transition-colors"
          >
            <Pencil className="size-3.5" /> ثبت نظر جدید
          </button>
        }
      />
      {myReviews.length === 0 ? (
        <EmptyState icon={<Star className="size-7" />} title="هنوز نظری ثبت نکرده‌اید" desc="بعد از دریافت سفارش، تجربه خود را بنویسید و امتیاز بگیرید." />
      ) : (
        <div className="space-y-4">
          {myReviews.map((r) => (
            <div key={r.id} className="rounded-3xl bg-white border border-border p-4 flex flex-wrap items-start gap-4">
              { }
              <img src={r.productImage || "/images/roses-pink-1.jpg"} alt={r.productName} className="size-16 rounded-2xl object-cover shrink-0" />
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="font-bold text-sm text-charcoal">{r.productName}</p>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${statusCls[r.status] ?? statusCls.pending}`}>
                    {statusLabel[r.status] ?? r.status}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <Stars value={r.rating} />
                  <span className="text-[11px] text-muted-foreground">{faRelative(r.createdAt)}</span>
                </div>
                <p className="mt-2 text-sm text-charcoal/80 leading-6">{r.comment}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => setEditTarget(r)} className="grid place-items-center size-8 rounded-full text-muted-foreground hover:bg-cream-dark transition-colors" aria-label="ویرایش نظر">
                  <Pencil className="size-3.5" />
                </button>
                <button onClick={() => setDeleteTarget(r)} className="grid place-items-center size-8 rounded-full text-muted-foreground hover:bg-[#fbe4e3] hover:text-[#c0392b] transition-colors" aria-label="حذف نظر">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* new review dialog */}
      <Dialog open={!!form} onOpenChange={(v) => !v && setForm(null)}>
        <DialogContent className="max-w-md rounded-3xl" aria-describedby="new-review-desc">
          <DialogHeader>
            <DialogTitle className="text-right text-charcoal">ثبت نظر جدید</DialogTitle>
            <DialogDescription id="new-review-desc" className="text-right">
              نظر شما پس از بررسی کارشناسان منتشر خواهد شد.
            </DialogDescription>
          </DialogHeader>
          {form && (
            <div className="space-y-3">
              <Field label="محصول" required>
                <select className={inputCls} value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}>
                  {data.products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Field>
              <div>
                <span className="block text-xs font-semibold text-charcoal/80 mb-1.5">امتیاز شما</span>
                <div className="flex gap-1" dir="ltr">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <button key={i} onClick={() => setForm({ ...form, rating: i })} aria-label={`${i} ستاره`}>
                      <Star className={`size-7 ${i <= form.rating ? "fill-gold text-gold" : "fill-cream-dark text-cream-dark"} transition-colors`} />
                    </button>
                  ))}
                </div>
              </div>
              <Field label="متن نظر" required>
                <textarea className={`${inputCls} min-h-24 resize-none`} value={form.comment} placeholder="کیفیت گل، بسته‌بندی و ارسال چطور بود؟" onChange={(e) => setForm({ ...form, comment: e.target.value })} />
              </Field>
              <button onClick={submitNew} disabled={saving} className="w-full rounded-full bg-charcoal text-white py-2.5 text-sm font-bold hover:bg-charcoal/85 transition-colors disabled:opacity-60">
                {saving ? "در حال ارسال..." : "ثبت نظر"}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(v) => !v && setEditTarget(null)}>
        <DialogContent className="max-w-md rounded-3xl" aria-describedby="edit-review-desc">
          <DialogHeader>
            <DialogTitle className="text-right text-charcoal">ویرایش نظر</DialogTitle>
            <DialogDescription id="edit-review-desc" className="text-right">{editTarget?.productName}</DialogDescription>
          </DialogHeader>
          {editTarget && (
            <div className="space-y-3">
              <div className="flex gap-1" dir="ltr">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button key={i} onClick={() => setEditTarget({ ...editTarget, rating: i })} aria-label={`${i} ستاره`}>
                    <Star className={`size-7 ${i <= editTarget.rating ? "fill-gold text-gold" : "fill-cream-dark text-cream-dark"} transition-colors`} />
                  </button>
                ))}
              </div>
              <Field label="متن نظر">
                <textarea className={`${inputCls} min-h-24 resize-none`} value={editTarget.comment} onChange={(e) => setEditTarget({ ...editTarget, comment: e.target.value })} />
              </Field>
              <button
                onClick={async () => {
                  const res = await panelMutate("review.update", {
                    id: editTarget.id,
                    data: { rating: editTarget.rating, comment: editTarget.comment },
                  });
                  if (res.success) {
                    toast("نظر شما به‌روزرسانی شد.");
                    setEditTarget(null);
                    await refresh();
                  }
                }}
                className="w-full rounded-full bg-charcoal text-white py-2.5 text-sm font-bold hover:bg-charcoal/85 transition-colors"
              >
                ذخیره تغییرات
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="حذف نظر"
        message="این نظر برای همیشه حذف می‌شود. مطمئن هستید؟"
        onConfirm={async () => {
          if (!deleteTarget) return;
          const res = await panelMutate("review.delete", { id: deleteTarget.id });
          if (res.success) { toast("نظر حذف شد."); await refresh(); }
        }}
      />
    </div>
  );
}

// ==================== Notifications ====================
const NOTIF_STYLE: Record<string, { icon: typeof BellRing; cls: string }> = {
  order: { icon: Tag, cls: "bg-blush-soft text-blush-dark" },
  wallet: { icon: Heart, cls: "bg-sage-soft text-sage-dark" },
  promo: { icon: Megaphone, cls: "bg-gold-soft text-gold-dark" },
  loyalty: { icon: Star, cls: "bg-gold-soft text-gold-dark" },
  blog: { icon: Newspaper, cls: "bg-cream-dark text-charcoal" },
  system: { icon: BellRing, cls: "bg-cream-dark text-charcoal" },
};

export function NotificationsSection() {
  const { data, refresh, toast } = usePanel();
  const unread = data.notifications.filter((n) => !n.isRead).length;

  return (
    <div>
      <SectionHeader
        title="اعلان‌ها"
        desc={unread > 0 ? `${faNumber(unread)} اعلان خوانده‌نشده دارید` : "همه اعلان‌ها خوانده شده‌اند"}
        action={
          unread > 0 ? (
            <button
              onClick={async () => {
                const res = await panelMutate("notification.readAll");
                if (res.success) { toast("همه اعلان‌ها خوانده شد."); await refresh(); }
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-sage-soft text-sage-dark px-4 py-2 text-xs font-bold hover:bg-sage/40 transition-colors"
            >
              <CheckCheck className="size-3.5" /> خواندن همه
            </button>
          ) : undefined
        }
      />
      {data.notifications.length === 0 ? (
        <EmptyState icon={<BellRing className="size-7" />} title="اعلانی ندارید" desc="اخبار سفارش‌ها و کدهای تخفیف اینجا نمایش داده می‌شود." />
      ) : (
        <div className="space-y-3">
          {data.notifications.map((n) => {
            const S = NOTIF_STYLE[n.type] ?? NOTIF_STYLE.system;
            const Icon = S.icon;
            return (
              <div
                key={n.id}
                className={`rounded-3xl border p-4 flex items-start gap-3 transition-colors ${
                  n.isRead ? "bg-white border-border" : "bg-blush-soft/40 border-blush/50"
                }`}
              >
                <span className={`grid place-items-center size-10 rounded-2xl shrink-0 ${S.cls}`}>
                  <Icon className="size-4.5" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sm text-charcoal">{n.title}</p>
                    {!n.isRead && <span className="size-2 rounded-full bg-blush-dark" aria-label="خوانده‌نشده" />}
                  </div>
                  <p className="text-sm text-charcoal/75 leading-6 mt-1">{n.body}</p>
                  <p className="text-[11px] text-muted-foreground mt-1.5">{faDateTime(n.createdAt)}</p>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {!n.isRead && (
                    <button
                      onClick={async () => { await panelMutate("notification.read", { id: n.id }); await refresh(); }}
                      className="grid place-items-center size-8 rounded-full text-muted-foreground hover:bg-sage-soft hover:text-sage-dark transition-colors"
                      aria-label="علامت‌گذاری خوانده‌شده"
                    >
                      <CheckCheck className="size-4" />
                    </button>
                  )}
                  <button
                    onClick={async () => { await panelMutate("notification.delete", { id: n.id }); await refresh(); }}
                    className="grid place-items-center size-8 rounded-full text-muted-foreground hover:bg-[#fbe4e3] hover:text-[#c0392b] transition-colors"
                    aria-label="حذف اعلان"
                  >
                    <Trash className="size-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ==================== Profile ====================
export function ProfileSection() {
  const { data, refresh, toast } = usePanel();
  const [form, setForm] = useState(() => ({ ...data.profile }));
  const [saving, setSaving] = useState(false);
  const dirty = useMemo(() => JSON.stringify({ ...form, memberSince: undefined }) !== JSON.stringify({ ...data.profile, memberSince: undefined }), [form, data.profile]);

  async function save() {
    if (!form.name.trim()) { toast("نام نمی‌تواند خالی باشد.", true); return; }
    if (!/^0\d{10}$/.test(toEnDigits(form.phone).trim())) { toast("شماره تماس باید ۱۱ رقم و با صفر شروع شود.", true); return; }
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) { toast("ایمیل معتبر نیست.", true); return; }
    setSaving(true);
    const res = await panelMutate("profile.update", {
      data: {
        name: form.name.trim(), phone: toEnDigits(form.phone).trim(), email: form.email.trim(),
        birthday: form.birthday, gender: form.gender, avatarHue: form.avatarHue,
        emailOffers: form.emailOffers, smsOffers: form.smsOffers,
      },
    });
    setSaving(false);
    if (res.success) { toast("اطلاعات حساب ذخیره شد."); await refresh(); }
    else toast(res.error ?? "خطا در ذخیره", true);
  }

  const avatarColors = ["#e8b4b8", "#a8c5a0", "#d4a574", "#b8a7d9", "#8fb8d9"];

  return (
    <div>
      <SectionHeader title="اطلاعات حساب" desc="اطلاعات تماس و تنظیمات شخصی خود را مدیریت کنید." />
      <div className="grid lg:grid-cols-3 gap-5">
        {/* avatar card */}
        <div className="rounded-3xl bg-white border border-border p-6 text-center h-fit">
          <span
            className="mx-auto grid place-items-center size-24 rounded-full text-3xl font-extrabold text-white shadow-lg"
            style={{ background: avatarColors[form.avatarHue % avatarColors.length] }}
          >
            {form.name.trim().charAt(0) || "گ"}
          </span>
          <p className="mt-3 font-extrabold text-charcoal">{form.name}</p>
          <p className="text-xs text-muted-foreground mt-1" dir="ltr">{toEnDigits(form.phone).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)])}</p>
          <div className="mt-5">
            <p className="text-xs font-semibold text-charcoal/70 mb-2">رنگ آواتار</p>
            <div className="flex justify-center gap-2">
              {avatarColors.map((c, i) => (
                <button
                  key={c}
                  onClick={() => setForm({ ...form, avatarHue: i })}
                  className={`size-8 rounded-full transition-transform ${form.avatarHue === i ? "ring-2 ring-offset-2 ring-charcoal scale-110" : ""}`}
                  style={{ background: c }}
                  aria-label={`رنگ ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* form */}
        <div className="lg:col-span-2 rounded-3xl bg-white border border-border p-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="نام و نام خانوادگی" required>
              <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="شماره تماس" required>
              <input className={inputCls} dir="ltr" inputMode="numeric" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="ایمیل">
              <input className={inputCls} dir="ltr" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="تاریخ تولد">
              <input className={inputCls} dir="ltr" placeholder="۱۳۷۲/۰۴/۱۸" value={form.birthday} onChange={(e) => setForm({ ...form, birthday: e.target.value })} />
            </Field>
            <div className="sm:col-span-2">
              <span className="block text-xs font-semibold text-charcoal/80 mb-1.5">جنسیت</span>
              <div className="flex gap-2">
                {[
                  { v: "female", l: "بانو" },
                  { v: "male", l: "آقا" },
                  { v: "other", l: "ترجیح می‌دهم نگویم" },
                ].map((g) => (
                  <button
                    key={g.v}
                    onClick={() => setForm({ ...form, gender: g.v })}
                    className={`rounded-full px-4 py-2 text-xs font-bold border transition-colors ${
                      form.gender === g.v ? "bg-blush-soft border-blush text-blush-dark" : "bg-white border-border text-charcoal/60 hover:bg-cream"
                    }`}
                  >
                    {g.l}
                  </button>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2 space-y-2.5 rounded-2xl bg-cream/70 p-4">
              <p className="text-xs font-bold text-charcoal/80 flex items-center gap-1.5"><UserIcon className="size-3.5" /> ترجیحات اطلاع‌رسانی</p>
              <label className="flex items-center justify-between text-sm text-charcoal/80 cursor-pointer">
                اطلاع‌رسانی ایمیلی خبرنامه و تخفیف‌ها
                <input type="checkbox" checked={form.emailOffers} onChange={(e) => setForm({ ...form, emailOffers: e.target.checked })} className="size-4 accent-[#e8b4b8]" />
              </label>
              <label className="flex items-center justify-between text-sm text-charcoal/80 cursor-pointer">
                پیامک وضعیت سفارش و مناسبت‌ها
                <input type="checkbox" checked={form.smsOffers} onChange={(e) => setForm({ ...form, smsOffers: e.target.checked })} className="size-4 accent-[#e8b4b8]" />
              </label>
            </div>
          </div>
          <button
            onClick={save}
            disabled={saving || !dirty}
            className="mt-5 rounded-full bg-charcoal text-white px-8 py-2.5 text-sm font-bold hover:bg-charcoal/85 transition-colors disabled:opacity-50"
          >
            {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== Security ====================
export function SecuritySection() {
  const { refresh, toast } = usePanel();
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [savingPw, setSavingPw] = useState(false);
  const [twoFA, setTwoFA] = useState(false);
  const [sessions, setSessions] = useState([
    { id: 1, device: "مرورگر فعلی — اپلیکیشن وب گلستان حافظ", location: "تهران، ایران", last: "همین حالا", current: true },
  ]);
  const history = [
    { time: "همین حالا", device: "ورود موفق — حساب شما", ok: true },
  ];

  async function changePassword() {
    if (pw.next.length < 8) { toast("رمز جدید باید حداقل ۸ کاراکتر باشد.", true); return; }
    if (pw.next !== pw.confirm) { toast("تکرار رمز جدید مطابقت ندارد.", true); return; }
    setSavingPw(true);
    const res = await panelMutate("auth.changePassword", {
      data: { current: pw.current, next: pw.next },
    });
    setSavingPw(false);
    if (res.success) {
      toast("رمز عبور با موفقیت تغییر کرد.");
      setPw({ current: "", next: "", confirm: "" });
      await refresh();
    } else {
      toast(res.error ?? "خطا در تغییر رمز عبور", true);
    }
  }

  return (
    <div>
      <SectionHeader title="امنیت حساب" desc="رمز عبور، ورود دومرحله‌ای و دستگاه‌های متصل را مدیریت کنید." />
      <div className="grid lg:grid-cols-2 gap-5">
        {/* change password */}
        <div className="rounded-3xl bg-white border border-border p-6 h-fit">
          <h3 className="font-bold text-charcoal flex items-center gap-2 mb-4">
            <KeyRound className="size-4 text-blush-dark" /> تغییر رمز عبور
          </h3>
          <div className="space-y-3">
            <Field label="رمز عبور فعلی" required>
              <input className={inputCls} dir="ltr" type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
            </Field>
            <Field label="رمز عبور جدید" required>
              <input className={inputCls} dir="ltr" type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
            </Field>
            <Field label="تکرار رمز جدید" required>
              <input className={inputCls} dir="ltr" type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
            </Field>
            <div className="rounded-2xl bg-cream/70 p-3 text-[11px] text-muted-foreground leading-5 flex items-start gap-1.5">
              <Lock className="size-3.5 shrink-0 mt-0.5" />
              رمز امن حداقل ۸ کاراکتر و ترجیحاً شامل عدد و حرف است. پس از تغییر، در ورود بعدی از رمز جدید استفاده کنید.
            </div>
            <button onClick={changePassword} disabled={savingPw} className="w-full rounded-full bg-charcoal text-white py-2.5 text-sm font-bold hover:bg-charcoal/85 transition-colors disabled:opacity-60">
              {savingPw ? "در حال ذخیره..." : "تغییر رمز عبور"}
            </button>
          </div>

          <div className="mt-6 pt-5 border-t border-dashed border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-charcoal flex items-center gap-2">
                  <Shield className="size-4 text-sage-dark" /> ورود دومرحله‌ای
                </p>
                <p className="text-xs text-muted-foreground mt-1">تأیید ورود با کد پیامکی</p>
              </div>
              <button
                onClick={() => { setTwoFA(!twoFA); toast(twoFA ? "ورود دومرحله‌ای غیرفعال شد." : "ورود دومرحله‌ای فعال شد."); }}
                role="switch"
                aria-checked={twoFA}
                className={`relative w-12 h-7 rounded-full transition-colors ${twoFA ? "bg-sage-dark" : "bg-cream-dark"}`}
              >
                <span className={`absolute top-1 size-5 rounded-full bg-white shadow transition-all ${twoFA ? "right-1" : "right-6"}`} />
              </button>
            </div>
          </div>
        </div>

        {/* sessions + history */}
        <div className="space-y-5">
          <div className="rounded-3xl bg-white border border-border p-6">
            <h3 className="font-bold text-charcoal flex items-center gap-2 mb-4">
              <MonitorSmartphone className="size-4 text-blush-dark" /> دستگاه‌های فعال
            </h3>
            <div className="space-y-2.5">
              {sessions.map((s) => (
                <div key={s.id} className="flex items-center gap-3 rounded-2xl border border-border/70 p-3">
                  <span className="grid place-items-center size-10 rounded-2xl bg-cream-dark text-charcoal shrink-0">
                    <Smartphone className="size-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-charcoal truncate">{s.device}</p>
                    <p className="text-[11px] text-muted-foreground">{s.location} — {s.last}</p>
                  </div>
                  {s.current ? (
                    <span className="rounded-full bg-sage-soft text-sage-dark text-[10px] font-bold px-2.5 py-1">دستگاه فعلی</span>
                  ) : (
                    <button
                      onClick={() => { setSessions(sessions.filter((x) => x.id !== s.id)); toast("دستگاه از حساب خارج شد."); }}
                      className="inline-flex items-center gap-1 rounded-full bg-[#fbe4e3] text-[#c0392b] px-3 py-1.5 text-[11px] font-bold hover:bg-[#f5cfcc] transition-colors"
                    >
                      <LogOut className="size-3" /> خروج
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-border p-6">
            <h3 className="font-bold text-charcoal flex items-center gap-2 mb-4">
              <Shield className="size-4 text-gold-dark" /> تاریخچه ورود
            </h3>
            <div className="space-y-2.5">
              {history.map((h, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className={`size-2 rounded-full shrink-0 ${h.ok ? "bg-sage-dark" : "bg-destructive"}`} aria-hidden />
                  <p className="flex-1 text-charcoal/80">{h.device}</p>
                  <p className="text-[11px] text-muted-foreground shrink-0">{h.time}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
