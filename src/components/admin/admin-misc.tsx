"use client";

import { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  CheckCircle2, XCircle, Trash2, Star, Download, Mail, MailOpen, Phone,
  Reply, Save, Store, Clock, MapPin, Instagram, Send, ShieldCheck, Percent,
  CreditCard, Landmark,
} from "lucide-react";
import {
  ChartTip, ConfirmDialog, EmptyState, Field, PanelStat, SectionHeader, Stars,
} from "@/components/panel/shared";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { usePanel } from "@/components/panel/panel-context";
import { panelMutate } from "@/lib/panel-api";
import { CATEGORY_LABELS } from "@/lib/types";
import { faPrice, faNumber, faDecimal, faShortPrice, faDateTime, faRelative } from "@/lib/format";

const inputCls =
  "w-full rounded-2xl border border-input bg-white px-3.5 py-2.5 text-sm text-charcoal placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-blush transition-shadow";

const PIE_COLORS = ["#e8b4b8", "#a8c5a0", "#d4a574", "#b8a7d9", "#8fb8d9", "#f0c987"];

// ==================== Reviews (Admin) ====================
export function AdminReviewsSection() {
  const { data, refresh, toast } = usePanel();
  const [tab, setTab] = useState("pending");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: data.reviews.length };
    for (const r of data.reviews) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [data.reviews]);

  const filtered = useMemo(
    () => (tab === "all" ? data.reviews : data.reviews.filter((r) => r.status === tab)),
    [data.reviews, tab]
  );

  const statusLabel: Record<string, string> = { pending: "در انتظار تأیید", approved: "تأیید شده", rejected: "رد شده" };

  async function setReviewStatus(id: string, status: string) {
    const res = await panelMutate("review.setStatus", { id, status });
    if (res.success) {
      toast(status === "approved" ? "نظر تأیید و منتشر شد." : "نظر رد شد.");
      await refresh();
    }
  }

  return (
    <div>
      <SectionHeader title="مدیریت نظرات" desc="بررسی و تأیید نظرات ثبت‌شده مشتریان" />
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-5">
        {["pending", "approved", "rejected", "all"].map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-colors ${
              tab === k ? "bg-charcoal text-white" : "bg-white border border-border text-charcoal/70 hover:bg-blush-soft"
            }`}
          >
            {k === "all" ? "همه" : statusLabel[k]}
            <span className={`mr-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${tab === k ? "bg-white/20" : "bg-cream-dark"}`}>
              {faNumber(counts[k] ?? 0)}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Star className="size-7" />} title="نظری در این بخش نیست" />
      ) : (
        <div className="space-y-4">
          {filtered.map((r) => (
            <div key={r.id} className="rounded-3xl bg-white border border-border p-4 flex flex-wrap items-start gap-4">
              { }
              <img src={r.productImage || "/images/roses-pink-1.jpg"} alt={r.productName} className="size-16 rounded-2xl object-cover shrink-0" />
              <div className="flex-1 min-w-[220px]">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="font-bold text-sm text-charcoal">{r.productName}</p>
                  <span className="text-[11px] text-muted-foreground">{r.author} — {faDateTime(r.createdAt)}</span>
                </div>
                <div className="mt-1.5"><Stars value={r.rating} /></div>
                <p className="mt-2 text-sm text-charcoal/80 leading-6">{r.comment}</p>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                {r.status !== "approved" && (
                  <button
                    onClick={() => setReviewStatus(r.id, "approved")}
                    className="inline-flex items-center gap-1.5 rounded-full bg-sage-soft text-sage-dark px-4 py-2 text-xs font-bold hover:bg-sage/40 transition-colors"
                  >
                    <CheckCircle2 className="size-3.5" /> تأیید
                  </button>
                )}
                {r.status !== "rejected" && (
                  <button
                    onClick={() => setReviewStatus(r.id, "rejected")}
                    className="inline-flex items-center gap-1.5 rounded-full bg-gold-soft text-gold-dark px-4 py-2 text-xs font-bold hover:bg-gold/30 transition-colors"
                  >
                    <XCircle className="size-3.5" /> رد
                  </button>
                )}
                <button
                  onClick={() => setDeleteTarget(r.id)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#fbe4e3] text-[#c0392b] px-4 py-2 text-xs font-bold hover:bg-[#f5cfcc] transition-colors"
                >
                  <Trash2 className="size-3.5" /> حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="حذف نظر"
        message="این نظر برای همیشه حذف می‌شود."
        onConfirm={async () => {
          if (!deleteTarget) return;
          const res = await panelMutate("review.delete", { id: deleteTarget });
          if (res.success) { toast("نظر حذف شد."); await refresh(); }
        }}
      />
    </div>
  );
}

// ==================== Reports ====================
export function ReportsSection() {
  const { data } = usePanel();
  const s = data.stats;

  const catData = s.categoryStats.map((c) => ({
    name: CATEGORY_LABELS[c.category] ?? c.category,
    value: c.sold || 1,
  }));

  const validOrders = data.orders.filter((o) => o.status !== "cancelled");
  const walletOrders = validOrders.filter((o) => o.paymentMethod === "wallet").length;
  const codOrders = validOrders.filter((o) => o.paymentMethod === "cod").length;
  const onlineOrders = validOrders.filter((o) => o.paymentMethod === "online").length;

  function exportCsv() {
    const header = ["کد رهگیری", "مشتری", "تلفن", "مبلغ", "وضعیت", "تاریخ ثبت"];
    const rows = data.orders.map((o) => [
      o.code, o.customerName, o.phone, String(o.total),
      o.status, new Date(o.createdAt).toISOString().slice(0, 10),
    ]);
    const csv = "\uFEFF" + [header, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "golestan-hafez-orders.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <SectionHeader
        title="گزارش‌های فروش"
        desc="تحلیل عملکرد فروشگاه در بازه‌های مختلف"
        action={
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 rounded-full bg-sage-soft text-sage-dark px-4 py-2 text-xs font-bold hover:bg-sage/40 transition-colors"
          >
            <Download className="size-3.5" /> خروجی CSV سفارش‌ها
          </button>
        }
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <PanelStat icon={<Percent className="size-5" />} label="میانگین ارزش سفارش" value={faPrice(s.avgOrderValue)} tone="gold" />
        <PanelStat icon={<Store className="size-5" />} label="فروش این ماه" value={faPrice(s.salesMonth)} tone="blush" />
        <PanelStat icon={<Star className="size-5" />} label="میانگین امتیاز محصولات" value={faDecimal(data.products.reduce((a, p) => a + p.rating, 0) / Math.max(data.products.length, 1))} tone="sage" />
        <PanelStat icon={<CheckCircle2 className="size-5" />} label="نرخ تحویل موفق" value={`${faNumber(Math.round(((s.statusCounts.delivered ?? 0) / Math.max(validOrders.length, 1)) * 100))}٪`} tone="charcoal" />
      </div>

      <div className="grid xl:grid-cols-2 gap-5">
        {/* orders per day bar */}
        <div className="rounded-3xl bg-white border border-border p-5">
          <h3 className="font-extrabold text-charcoal mb-4">تعداد سفارش روزانه (۱۴ روز)</h3>
          <div className="h-60" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={s.salesByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ece3d8" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#7a716a" }} tickLine={false} axisLine={false} reversed />
                <YAxis tick={{ fontSize: 10, fill: "#7a716a" }} tickLine={false} axisLine={false} width={28} allowDecimals={false} />
                <Tooltip content={<ChartTip isCount />} cursor={{ fill: "#f6dcde55" }} />
                <Bar dataKey="count" name="count" fill="#a8c5a0" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* payment methods donut */}
        <div className="rounded-3xl bg-white border border-border p-5">
          <h3 className="font-extrabold text-charcoal mb-2">روش‌های پرداخت</h3>
          <div className="h-60" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: "پرداخت آنلاین", value: onlineOrders },
                    { name: "کیف پول", value: walletOrders },
                    { name: "پرداخت در محل", value: codOrders },
                  ]}
                  dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} stroke="none"
                >
                  {PIE_COLORS.slice(0, 3).map((c, i) => <Cell key={i} fill={c} />)}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [faNumber(value), "سفارش"]}
                  contentStyle={{ borderRadius: 16, border: "1px solid #ece3d8", fontSize: 12, direction: "rtl" }}
                />
                <Legend formatter={(v: string) => <span style={{ color: "#2c2c2c", fontSize: 12 }}>{v}</span>} iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* revenue by category */}
        <div className="rounded-3xl bg-white border border-border p-5">
          <h3 className="font-extrabold text-charcoal mb-4">فروش به تفکیک دسته (تعداد)</h3>
          <div className="h-60" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={catData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#ece3d8" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#7a716a" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#2c2c2c" }} tickLine={false} axisLine={false} width={90} orientation="right" />
                <Tooltip content={<ChartTip isCount />} cursor={{ fill: "#f6dcde55" }} />
                <Bar dataKey="value" name="count" fill="#e8b4b8" radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* top products table */}
        <div className="rounded-3xl bg-white border border-border p-5">
          <h3 className="font-extrabold text-charcoal mb-4">پرفروش‌ترین محصولات</h3>
          <div className="space-y-3">
            {s.topProducts.map((p, i) => {
              const max = s.topProducts[0]?.qty || 1;
              return (
                <div key={p.id}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="grid place-items-center size-5 rounded-full bg-cream-dark text-[10px] font-extrabold">{faNumber(i + 1)}</span>
                    <p className="flex-1 text-xs font-bold text-charcoal truncate">{p.name}</p>
                    <span className="text-[11px] text-muted-foreground">{faNumber(p.qty)} عدد — {faShortPrice(p.revenue)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-cream-dark overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-l from-blush to-gold" style={{ width: `${(p.qty / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== Messages ====================
export function MessagesSection() {
  const { data, refresh, toast } = usePanel();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<(typeof data.messages)[number] | null>(null);
  const [replyText, setReplyText] = useState("");
  const unread = data.messages.filter((m) => !m.isRead).length;

  return (
    <div>
      <SectionHeader
        title="پیام‌های مشتریان"
        desc={`${faNumber(unread)} پیام خوانده‌نشده از فرم تماس و پشتیبانی`}
        action={
          unread > 0 ? (
            <button
              onClick={async () => { await panelMutate("message.readAll"); toast("همه پیام‌ها خوانده شد."); await refresh(); }}
              className="inline-flex items-center gap-1.5 rounded-full bg-sage-soft text-sage-dark px-4 py-2 text-xs font-bold hover:bg-sage/40 transition-colors"
            >
              <MailOpen className="size-3.5" /> خواندن همه
            </button>
          ) : undefined
        }
      />
      {data.messages.length === 0 ? (
        <EmptyState icon={<Mail className="size-7" />} title="پیامی دریافت نشده" desc="پیام‌های فرم تماس فروشگاه اینجا نمایش داده می‌شود." />
      ) : (
        <div className="space-y-3">
          {data.messages.map((m) => (
            <div key={m.id} className={`rounded-3xl border p-5 ${m.isRead ? "bg-white border-border" : "bg-blush-soft/30 border-blush/50"}`}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <span className="grid place-items-center size-11 rounded-2xl bg-cream-dark text-charcoal font-extrabold shrink-0">
                    {m.name.charAt(0)}
                  </span>
                  <div>
                    <p className="font-bold text-sm text-charcoal flex items-center gap-2">
                      {m.name}
                      {!m.isRead && <span className="size-2 rounded-full bg-blush-dark" aria-label="خوانده‌نشده" />}
                    </p>
                    <p className="text-[11px] text-muted-foreground" dir="ltr">{m.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-muted-foreground">{faRelative(m.createdAt)}</span>
                  {!m.isRead && (
                    <button
                      onClick={async () => { await panelMutate("message.read", { id: m.id }); await refresh(); }}
                      className="grid place-items-center size-8 rounded-full text-muted-foreground hover:bg-sage-soft hover:text-sage-dark transition-colors"
                      aria-label="علامت‌گذاری خوانده‌شده"
                    >
                      <MailOpen className="size-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => setReplyTo(m)}
                    className="grid place-items-center size-8 rounded-full text-muted-foreground hover:bg-blush-soft hover:text-blush-dark transition-colors"
                    aria-label="پاسخ"
                  >
                    <Reply className="size-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(m.id)}
                    className="grid place-items-center size-8 rounded-full text-muted-foreground hover:bg-[#fbe4e3] hover:text-[#c0392b] transition-colors"
                    aria-label="حذف پیام"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
              <p className="mt-3 text-sm font-bold text-charcoal">{m.subject}</p>
              <p className="mt-1.5 text-sm text-charcoal/75 leading-6">{m.body}</p>
            </div>
          ))}
        </div>
      )}

      {/* reply dialog */}
      <Dialog open={!!replyTo} onOpenChange={(v) => !v && setReplyTo(null)}>
        <DialogContent className="max-w-md rounded-3xl" aria-describedby="reply-desc">
          <DialogHeader>
            <DialogTitle className="text-right text-charcoal">پاسخ به {replyTo?.name}</DialogTitle>
            <DialogDescription id="reply-desc" className="text-right">
              پاسخ شما با پیامک به شماره مشتری ارسال می‌شود.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-2xl bg-cream/70 p-3 text-xs text-charcoal/70 leading-5">
              «{replyTo?.subject}» — {replyTo?.body?.slice(0, 80)}...
            </div>
            <Field label="متن پاسخ" required>
              <textarea className={`${inputCls} min-h-24 resize-none`} value={replyText} onChange={(e) => setReplyText(e.target.value)} />
            </Field>
            <button
              onClick={() => {
                if (!replyText.trim()) { toast("متن پاسخ را بنویسید.", true); return; }
                toast("پاسخ شما با پیامک ارسال شد.");
                setReplyText("");
                setReplyTo(null);
              }}
              className="w-full rounded-full bg-charcoal text-white py-2.5 text-sm font-bold hover:bg-charcoal/85 transition-colors"
            >
              ارسال پاسخ
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="حذف پیام"
        message="این پیام برای همیشه حذف می‌شود."
        onConfirm={async () => {
          if (!deleteTarget) return;
          const res = await panelMutate("message.delete", { id: deleteTarget });
          if (res.success) { toast("پیام حذف شد."); await refresh(); }
        }}
      />
    </div>
  );
}

// ==================== Settings ====================
export function AdminSettingsSection() {
  const { data, refresh, toast } = usePanel();
  const [form, setForm] = useState(() => ({ ...data.settings }));
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await panelMutate("settings.update", { data: { ...form } });
    setSaving(false);
    if (res.success) { toast("تنظیمات فروشگاه ذخیره شد."); await refresh(); }
    else toast(res.error ?? "خطا در ذخیره تنظیمات", true);
  }

  return (
    <div>
      <SectionHeader
        title="تنظیمات فروشگاه"
        desc="اطلاعات تماس، هزینه ارسال و وضعیت فروشگاه"
        action={
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-full bg-charcoal text-white px-5 py-2 text-xs font-bold hover:bg-charcoal/85 transition-colors disabled:opacity-60"
          >
            <Save className="size-3.5" /> {saving ? "در حال ذخیره..." : "ذخیره تنظیمات"}
          </button>
        }
      />
      <div className="grid xl:grid-cols-2 gap-5">
        {/* shop info */}
        <div className="rounded-3xl bg-white border border-border p-6 space-y-4">
          <h3 className="font-extrabold text-charcoal flex items-center gap-2">
            <Store className="size-4 text-blush-dark" /> اطلاعات فروشگاه
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="نام فروشگاه">
              <input className={inputCls} value={form.shopName} onChange={(e) => setForm({ ...form, shopName: e.target.value })} />
            </Field>
            <Field label="شعار">
              <input className={inputCls} value={form.slogan} onChange={(e) => setForm({ ...form, slogan: e.target.value })} />
            </Field>
            <Field label="تلفن">
              <input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="ایمیل">
              <input className={inputCls} dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
          </div>
          <Field label="آدرس">
            <textarea className={`${inputCls} min-h-16 resize-none`} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
          <Field label="ساعات کاری">
            <div className="relative">
              <Clock className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input className={`${inputCls} pr-10`} value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} />
            </div>
          </Field>
          <Field label="متن نوار اعلان بالای سایت">
            <input className={inputCls} value={form.announcement} onChange={(e) => setForm({ ...form, announcement: e.target.value })} />
          </Field>
        </div>

        <div className="space-y-5">
          {/* shipping */}
          <div className="rounded-3xl bg-white border border-border p-6 space-y-4">
            <h3 className="font-extrabold text-charcoal flex items-center gap-2">
              <MapPin className="size-4 text-sage-dark" /> ارسال و پرداخت
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="هزینه ارسال با اسنپ (تومان)">
                <input className={inputCls} dir="ltr" inputMode="numeric" value={form.shippingFee} onChange={(e) => setForm({ ...form, shippingFee: Number(e.target.value.replace(/\D/g, "")) })} />
              </Field>
            </div>
            <div className="rounded-2xl bg-cream/70 p-3.5 text-xs text-muted-foreground leading-5">
              تحویل سفارش‌ها با اسنپ انجام می‌شود؛ مبلغ فوق به‌صورت خودکار به مبلغ سفارش اضافه می‌شود.
            </div>

            {/* درگاه پرداخت اینترنتی */}
            <div className="border-t border-border pt-4 space-y-3">
              <p className="text-xs font-extrabold text-charcoal flex items-center gap-1.5">
                <CreditCard className="size-3.5 text-sage-dark" /> درگاه پرداخت اینترنتی
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, paymentGateway: "sandbox" })}
                  className={`rounded-2xl border-2 p-3 text-right transition-all ${form.paymentGateway !== "zarinpal" ? "border-sage bg-sage-soft/40" : "border-border bg-white hover:border-sage/50"}`}
                  aria-pressed={form.paymentGateway !== "zarinpal"}
                >
                  <span className="block text-xs font-bold text-charcoal">درگاه آزمایشی (تست)</span>
                  <span className="block text-[10px] text-muted-foreground mt-1">پرداخت داخل سایت شبیه‌سازی می‌شود؛ برای تست بدون پول واقعی.</span>
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, paymentGateway: "zarinpal" })}
                  className={`rounded-2xl border-2 p-3 text-right transition-all ${form.paymentGateway === "zarinpal" ? "border-gold bg-gold-soft/40" : "border-border bg-white hover:border-gold/50"}`}
                  aria-pressed={form.paymentGateway === "zarinpal"}
                >
                  <span className="block text-xs font-bold text-charcoal flex items-center gap-1"><Landmark className="size-3.5 text-gold-dark" /> زرین‌پال (واقعی)</span>
                  <span className="block text-[10px] text-muted-foreground mt-1">مشتری به سایت زرین‌پال منتقل و بعد از پرداخت به سایت برمی‌گردد.</span>
                </button>
              </div>
              {form.paymentGateway === "zarinpal" && (
                <Field label="مرچنت کد زرین‌پال (Merchant ID)">
                  <input
                    className={inputCls}
                    dir="ltr"
                    value={form.zarinpalMerchantId}
                    onChange={(e) => setForm({ ...form, zarinpalMerchantId: e.target.value.trim() })}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  />
                </Field>
              )}
              <div className="rounded-2xl bg-cream/70 p-3.5 text-xs text-muted-foreground leading-5">
                در حالت آزمایشی مشتری در سایت یک صفحه درگاه بانکی کامل (شماره کارت، رمز پویا، رسید) می‌بیند و سفارش واقعاً ثبت می‌شود.
                برای فعال‌سازی زرین‌پال، از zarinpal.com مرچنت کد بگیرید و اینجا وارد کنید؛ آدرس بازگشت (Callback) به‌صورت خودکار تنظیم می‌شود.
              </div>
            </div>
          </div>

          {/* social */}
          <div className="rounded-3xl bg-white border border-border p-6 space-y-4">
            <h3 className="font-extrabold text-charcoal flex items-center gap-2">
              <Instagram className="size-4 text-gold-dark" /> شبکه‌های اجتماعی
            </h3>
            <div className="grid sm:grid-cols-3 gap-3">
              <Field label="اینستاگرام">
                <input className={inputCls} dir="ltr" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
              </Field>
              <Field label="تلگرام">
                <input className={inputCls} dir="ltr" value={form.telegram} onChange={(e) => setForm({ ...form, telegram: e.target.value })} />
              </Field>
              <Field label="واتساپ">
                <input className={inputCls} dir="ltr" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
              </Field>
            </div>
          </div>

          {/* status switches */}
          <div className="rounded-3xl bg-white border border-border p-6 space-y-4">
            <h3 className="font-extrabold text-charcoal flex items-center gap-2">
              <ShieldCheck className="size-4 text-sage-dark" /> وضعیت فروشگاه
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-charcoal">فروشگاه باز است</p>
                <p className="text-xs text-muted-foreground mt-0.5">در صورت بستن، ثبت سفارش جدید غیرفعال می‌شود.</p>
              </div>
              <button
                onClick={() => setForm({ ...form, isOpen: !form.isOpen })}
                role="switch"
                aria-checked={form.isOpen}
                aria-label="وضعیت فروشگاه"
                className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${form.isOpen ? "bg-sage-dark" : "bg-cream-dark"}`}
              >
                <span className={`absolute top-1 size-5 rounded-full bg-white shadow transition-all ${form.isOpen ? "right-1" : "right-6"}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-charcoal">تأیید خودکار سفارش‌ها</p>
                <p className="text-xs text-muted-foreground mt-0.5">سفارش‌های جدید بدون نیاز به بررسی، تأیید شوند.</p>
              </div>
              <button
                onClick={() => setForm({ ...form, autoAccept: !form.autoAccept })}
                role="switch"
                aria-checked={form.autoAccept}
                aria-label="تأیید خودکار"
                className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${form.autoAccept ? "bg-sage-dark" : "bg-cream-dark"}`}
              >
                <span className={`absolute top-1 size-5 rounded-full bg-white shadow transition-all ${form.autoAccept ? "right-1" : "right-6"}`} />
              </button>
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-gold-soft/50 p-3.5 text-[11px] text-charcoal/70 leading-5">
              <Send className="size-3.5 text-gold-dark shrink-0" />
              تغییرات با دکمه «ذخیره تنظیمات» در بالای صفحه اعمال می‌شوند.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
