"use client";

import { useMemo, useState } from "react";
import {
  Search, Eye, Trash2, Plus, Phone, MapPin, CreditCard, CalendarDays, Gift,
  StickyNote, FileText, Users, Pencil, RefreshCcw, Wand2, Ticket, Crown, Copy,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  ConfirmDialog, EmptyState, Field, SectionHeader, StatusBadge,
} from "@/components/panel/shared";
import OrderTimeline from "@/components/user/order-timeline";
import { usePanel } from "@/components/panel/panel-context";
import { panelMutate } from "@/lib/panel-api";
import {
  ORDER_STATUS_LABELS, PAYMENT_LABELS,
  type Customer, type Order, type OrderStatus,
} from "@/lib/types";
import { faPrice, faNumber, faDateTime, faDate, faRelative, toEnDigits, faShortPrice } from "@/lib/format";

const inputCls =
  "w-full rounded-2xl border border-input bg-white px-3.5 py-2.5 text-sm text-charcoal placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-blush transition-shadow";

const TAB_KEYS: (OrderStatus | "all")[] = [
  "all", "pending", "confirmed", "preparing", "shipped", "delivered", "cancelled",
];

// ==================== Orders (Admin) ====================
export function AdminOrdersSection() {
  const { data, refresh, toast } = usePanel();
  const [tab, setTab] = useState<(typeof TAB_KEYS)[number]>("all");
  const [query, setQuery] = useState("");
  const [details, setDetails] = useState<Order | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
  const [newOrder, setNewOrder] = useState(false);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: data.orders.length };
    for (const o of data.orders) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [data.orders]);

  const filtered = useMemo(() => {
    return data.orders.filter((o) => {
      if (tab !== "all" && o.status !== tab) return false;
      if (query) {
        const q = query.trim();
        return o.code.includes(q.toUpperCase()) || o.customerName.includes(q) || o.phone.includes(q);
      }
      return true;
    });
  }, [data.orders, tab, query]);

  async function setStatus(o: Order, status: string) {
    const res = await panelMutate("order.setStatus", { id: o.id, status });
    if (res.success) {
      toast(`وضعیت سفارش ${o.code} به «${ORDER_STATUS_LABELS[status as OrderStatus] ?? status}» تغییر کرد.`);
      await refresh();
    } else toast(res.error ?? "خطا در تغییر وضعیت", true);
  }

  return (
    <div>
      <SectionHeader
        title="مدیریت سفارش‌ها"
        desc={`${faNumber(data.orders.length)} سفارش ثبت‌شده — تأیید، آماده‌سازی و ارسال`}
        action={
          <button
            onClick={() => setNewOrder(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-charcoal text-white px-4 py-2 text-xs font-bold hover:bg-charcoal/85 transition-colors"
          >
            <Plus className="size-3.5" /> ثبت سفارش تلفنی
          </button>
        }
      />

      {/* tabs + search */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="flex gap-1.5 overflow-x-auto flex-1 min-w-[280px] pb-1">
          {TAB_KEYS.map((k) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-bold transition-colors ${
                tab === k ? "bg-charcoal text-white" : "bg-white border border-border text-charcoal/70 hover:bg-blush-soft"
              }`}
            >
              {k === "all" ? "همه" : ORDER_STATUS_LABELS[k]}
              <span className={`mr-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${tab === k ? "bg-white/20" : "bg-cream-dark"}`}>
                {faNumber(counts[k] ?? 0)}
              </span>
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            className={`${inputCls} pr-10`}
            placeholder="کد رهگیری، نام یا تلفن..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* table */}
      <div className="rounded-3xl bg-white border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[940px]">
            <thead>
              <tr className="bg-cream/70 text-xs text-muted-foreground">
                <th className="text-right font-bold px-4 py-3">کد سفارش</th>
                <th className="text-right font-bold px-4 py-3">مشتری</th>
                <th className="text-right font-bold px-4 py-3">اقلام</th>
                <th className="text-right font-bold px-4 py-3">مبلغ</th>
                <th className="text-right font-bold px-4 py-3">تاریخ</th>
                <th className="text-center font-bold px-4 py-3">پرداخت</th>
                <th className="text-center font-bold px-4 py-3">وضعیت</th>
                <th className="text-left font-bold px-4 py-3">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-t border-border/60 hover:bg-cream/40 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-bold" dir="ltr">{o.code}</td>
                  <td className="px-4 py-3">
                    <p className="font-bold text-charcoal">{o.customerName}</p>
                    <p className="text-[11px] text-muted-foreground" dir="ltr">{o.phone}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2 space-x-reverse">
                        {o.items.slice(0, 2).map((it, i) => (
                           
                          <img key={i} src={it.image || "/images/roses-pink-1.jpg"} alt={it.name} className="size-8 rounded-lg object-cover border-2 border-white" />
                        ))}
                      </div>
                      <span className="text-[11px] text-muted-foreground">{faNumber(o.items.length)} قلم</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-extrabold text-charcoal">{faPrice(o.total)}</td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-charcoal/80">{faDate(o.createdAt)}</p>
                    <p className="text-[10px] text-muted-foreground">{faRelative(o.createdAt)}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {o.paidAt ? (
                      <span className="inline-block rounded-full bg-sage-soft text-sage-dark px-2.5 py-1 text-[10px] font-bold">پرداخت شد ✓</span>
                    ) : o.paymentMethod === "online" && o.status !== "cancelled" ? (
                      <span className="inline-block rounded-full bg-[#fbe4e3] text-[#c0392b] px-2.5 py-1 text-[10px] font-bold">پرداخت نشده</span>
                    ) : (
                      <span className="inline-block rounded-full bg-gold-soft/60 text-gold-dark px-2.5 py-1 text-[10px] font-bold">در محل</span>
                    )}
                    <p className="text-[9px] text-muted-foreground mt-1">{PAYMENT_LABELS[o.paymentMethod] ?? o.paymentMethod}</p>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={o.status}
                      onChange={(e) => setStatus(o, e.target.value)}
                      className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-bold text-charcoal focus:outline-none focus:ring-2 focus:ring-blush cursor-pointer"
                      aria-label={`تغییر وضعیت سفارش ${o.code}`}
                    >
                      {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => setDetails(o)}
                        className="grid place-items-center size-8 rounded-full text-muted-foreground hover:bg-blush-soft hover:text-blush-dark transition-colors"
                        aria-label={`جزئیات ${o.code}`}
                      >
                        <Eye className="size-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(o)}
                        className="grid place-items-center size-8 rounded-full text-muted-foreground hover:bg-[#fbe4e3] hover:text-[#c0392b] transition-colors"
                        aria-label={`حذف ${o.code}`}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-4">
            <EmptyState icon={<FileText className="size-7" />} title="سفارشی یافت نشد" desc="فیلتر وضعیت یا عبارت جستجو را تغییر دهید." />
          </div>
        )}
      </div>

      {/* details dialog */}
      <Dialog open={!!details} onOpenChange={(v) => !v && setDetails(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl" aria-describedby="admin-order-desc">
          <DialogHeader>
            <DialogTitle className="text-right flex items-center justify-between text-charcoal">
              <span>سفارش</span>
              <span className="font-mono text-sm text-muted-foreground" dir="ltr">{details?.code}</span>
            </DialogTitle>
            <DialogDescription id="admin-order-desc" className="text-right">
              {details ? faDateTime(details.createdAt) : ""}
            </DialogDescription>
          </DialogHeader>
          {details && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <StatusBadge status={details.status} />
                <select
                  value={details.status}
                  onChange={(e) => { setStatus(details, e.target.value); setDetails(null); }}
                  className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blush"
                >
                  {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              {details.status !== "cancelled" && (
                <div className="rounded-2xl border border-border p-3">
                  <OrderTimeline status={details.status} createdAt={details.createdAt} />
                </div>
              )}
              <div className="space-y-2">
                {details.items.map((it, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-2xl bg-cream/70 p-2.5">
                    { }
                    <img src={it.image || "/images/roses-pink-1.jpg"} alt={it.name} className="size-10 rounded-xl object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-charcoal truncate">{it.name}</p>
                      <p className="text-xs text-muted-foreground">{faNumber(it.qty)} × {faPrice(it.price)}</p>
                    </div>
                    <p className="text-sm font-extrabold">{faPrice(it.qty * it.price)}</p>
                  </div>
                ))}
                {details.addons.map((a, i) => (
                  <div key={`a-${i}`} className="flex items-center gap-3 rounded-2xl bg-gold-soft/50 p-2.5">
                    <span className="grid place-items-center size-10 rounded-xl bg-gold-soft text-gold-dark"><Gift className="size-4" /></span>
                    <p className="flex-1 text-sm font-bold">{a.name}</p>
                    <p className="text-sm font-extrabold">{faPrice(a.price)}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl bg-cream/70 p-4 space-y-2 text-sm">
                <p className="flex items-start gap-2"><MapPin className="size-4 text-blush-dark shrink-0 mt-0.5" /><span>{details.province}، {details.city}، {details.address}</span></p>
                <p className="flex items-center gap-2"><Phone className="size-4 text-blush-dark" /><span dir="ltr">{details.phone}</span></p>
                <p className="flex items-center gap-2 flex-wrap">
                  <CreditCard className="size-4 text-blush-dark shrink-0" />
                  <span>
                    {PAYMENT_LABELS[details.paymentMethod] ?? details.paymentMethod}
                    {details.paidAt ? (
                      <span className="text-sage-dark font-bold"> — پرداخت‌شده ✓ {details.paymentRef && `/ پیگیری: ${details.paymentRef}`}</span>
                    ) : details.paymentMethod === "online" && details.status !== "cancelled" ? (
                      <span className="text-[#c0392b] font-bold"> — پرداخت نشده</span>
                    ) : (
                      <span className="text-gold-dark font-bold"> — در محل</span>
                    )}
                  </span>
                </p>
                {(details.deliveryDate || details.deliverySlot) && (
                  <p className="flex items-center gap-2"><CalendarDays className="size-4 text-blush-dark" /><span>{details.deliveryDate} — {details.deliverySlot}</span></p>
                )}
                {details.cardMessage && (
                  <p className="flex items-start gap-2"><StickyNote className="size-4 text-blush-dark shrink-0 mt-0.5" /><span>کارت: «{details.cardMessage}»</span></p>
                )}
                {details.note && (
                  <p className="flex items-start gap-2"><FileText className="size-4 text-blush-dark shrink-0 mt-0.5" /><span>یادداشت: {details.note}</span></p>
                )}
              </div>
              <p className="flex justify-between font-extrabold text-charcoal text-base border-t border-dashed border-border pt-3">
                <span>مبلغ کل</span>
                <span>{faPrice(details.total)}</span>
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* phone order dialog */}
      <PhoneOrderDialog open={newOrder} onOpenChange={setNewOrder} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="حذف سفارش"
        message={`سفارش ${deleteTarget?.code ?? ""} حذف شود؟ این عملیات قابل بازگشت نیست.`}
        onConfirm={async () => {
          if (!deleteTarget) return;
          const res = await panelMutate("order.delete", { id: deleteTarget.id });
          if (res.success) { toast("سفارش حذف شد."); await refresh(); }
        }}
      />
    </div>
  );
}

// ==================== Phone Order ====================
function PhoneOrderDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data, refresh, toast } = usePanel();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState(1);
  const [saving, setSaving] = useState(false);

  async function submit() {
    const p = data.products.find((x) => x.id === productId);
    if (!name.trim() || !/^0\d{10}$/.test(toEnDigits(phone).trim()) || !p) {
      toast("نام، تلفن ۱۱ رقمی و محصول الزامی است.", true);
      return;
    }
    setSaving(true);
    const res = await panelMutate("order.create", {
      data: {
        customerName: name.trim(), phone: toEnDigits(phone).trim(), address: "ثبت حضوری/تلفنی",
        items: [{ id: p.id, name: p.name, price: p.price, qty, image: p.image }],
        total: p.price * qty, status: "confirmed",
      },
    });
    setSaving(false);
    if (res.success) {
      toast("سفارش تلفنی ثبت شد.");
      setName(""); setPhone(""); setQty(1);
      onOpenChange(false);
      await refresh();
    } else toast(res.error ?? "خطا در ثبت سفارش", true);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl" aria-describedby="phone-order-desc">
        <DialogHeader>
          <DialogTitle className="text-right text-charcoal">ثبت سفارش تلفنی</DialogTitle>
          <DialogDescription id="phone-order-desc" className="text-right">
            برای سفارش‌های حضوری یا تلفنی مشتریان استفاده کنید.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="نام مشتری" required>
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="شماره تماس" required>
            <input className={inputCls} dir="ltr" inputMode="numeric" placeholder="09xxxxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Field label="محصول" required>
            <select className={inputCls} value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="">انتخاب کنید...</option>
              {data.products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} — {faPrice(p.price)}</option>
              ))}
            </select>
          </Field>
          <Field label="تعداد">
            <input className={inputCls} dir="ltr" inputMode="numeric" value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1))} />
          </Field>
          <button onClick={submit} disabled={saving} className="w-full rounded-full bg-charcoal text-white py-2.5 text-sm font-bold hover:bg-charcoal/85 transition-colors disabled:opacity-60">
            {saving ? "در حال ثبت..." : "ثبت سفارش"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ==================== Customers ====================
export function CustomersSection() {
  const { data, refresh, toast } = usePanel();
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<{ id?: string; name: string; phone: string; email: string; city: string; note: string; wallet?: number; points?: number; isBanned?: boolean; password?: string } | null>(null);
  const [detail, setDetail] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

  const filtered = useMemo(() => {
    return data.customers.filter((c) => {
      if (!query) return true;
      const q = query.trim();
      return c.name.includes(q) || c.phone.includes(q);
    });
  }, [data.customers, query]);

  function isVip(c: Customer) {
    return (c.totalSpent ?? 0) >= 2000000 || (c.orderCount ?? 0) >= 3;
  }

  return (
    <div>
      <SectionHeader
        title="مشتریان"
        desc={`${faNumber(data.customers.length)} مشتری ثبت‌شده — باشگاه مشتریان گلستان حافظ`}
        action={
          <button
            onClick={() => setForm({ name: "", phone: "", email: "", city: "تهران", note: "" })}
            className="inline-flex items-center gap-1.5 rounded-full bg-charcoal text-white px-4 py-2 text-xs font-bold hover:bg-charcoal/85 transition-colors"
          >
            <Plus className="size-3.5" /> مشتری جدید
          </button>
        }
      />
      <div className="relative mb-5 max-w-sm">
        <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input className={`${inputCls} pr-10`} placeholder="جستجوی نام یا شماره تماس..." value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <div className="rounded-3xl bg-white border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[780px]">
            <thead>
              <tr className="bg-cream/70 text-xs text-muted-foreground">
                <th className="text-right font-bold px-4 py-3">مشتری</th>
                <th className="text-right font-bold px-4 py-3">شهر</th>
                <th className="text-center font-bold px-4 py-3">سفارش‌ها</th>
                <th className="text-right font-bold px-4 py-3">مجموع خرید</th>
                <th className="text-right font-bold px-4 py-3">آخرین خرید</th>
                <th className="text-center font-bold px-4 py-3">سطح</th>
                <th className="text-left font-bold px-4 py-3">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-t border-border/60 hover:bg-cream/40 transition-colors">
                  <td className="px-4 py-3">
                    <button onClick={() => setDetail(c)} className="flex items-center gap-3 text-right hover:opacity-80 transition-opacity">
                      <span className="grid place-items-center size-10 rounded-2xl bg-blush-soft text-blush-dark font-extrabold shrink-0">
                        {c.name.charAt(0)}
                      </span>
                      <div>
                        <p className="font-bold text-charcoal">{c.name}</p>
                        <p className="text-[11px] text-muted-foreground" dir="ltr">{c.phone}</p>
                      </div>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-charcoal/80">{c.city}</td>
                  <td className="px-4 py-3 text-center font-bold">{faNumber(c.orderCount ?? 0)}</td>
                  <td className="px-4 py-3 font-extrabold text-charcoal">{faPrice(c.totalSpent ?? 0)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{c.lastOrder ? faRelative(c.lastOrder) : "—"}</td>
                  <td className="px-4 py-3 text-center">
                    {isVip(c) ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gold-soft text-gold-dark text-[10px] font-bold px-2.5 py-1">
                        <Crown className="size-3" /> VIP
                      </span>
                    ) : (
                      <span className="rounded-full bg-cream-dark text-charcoal/70 text-[10px] font-bold px-2.5 py-1">عادی</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {c.role === "admin" && (
                        <span className="inline-flex items-center rounded-full bg-charcoal text-white text-[10px] font-bold px-2.5 py-1" title="مدیر فروشگاه">مدیر</span>
                      )}
                      {c.isBanned && (
                        <span className="inline-flex items-center rounded-full bg-[#fbe4e3] text-[#c0392b] text-[10px] font-bold px-2.5 py-1">مسدود</span>
                      )}
                      <button
                        onClick={() => setForm({ id: c.id, name: c.name, phone: c.phone, email: c.email, city: c.city, note: c.note, wallet: c.wallet, points: c.points, isBanned: c.isBanned })}
                        className="grid place-items-center size-8 rounded-full text-muted-foreground hover:bg-cream-dark transition-colors"
                        aria-label={`ویرایش ${c.name}`}
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(c)}
                        className="grid place-items-center size-8 rounded-full text-muted-foreground hover:bg-[#fbe4e3] hover:text-[#c0392b] transition-colors"
                        aria-label={`حذف ${c.name}`}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-4">
            <EmptyState icon={<Users className="size-7" />} title="مشتری‌ای یافت نشد" />
          </div>
        )}
      </div>

      {/* customer detail */}
      <Dialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto rounded-3xl" aria-describedby="cust-detail-desc">
          <DialogHeader>
            <DialogTitle className="text-right text-charcoal">{detail?.name}</DialogTitle>
            <DialogDescription id="cust-detail-desc" className="text-right" dir="ltr">{detail?.phone}</DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-2xl bg-cream/70 p-3">
                  <p className="text-[11px] text-muted-foreground">سفارش‌ها</p>
                  <p className="font-extrabold text-charcoal">{faNumber(detail.orderCount ?? 0)}</p>
                </div>
                <div className="rounded-2xl bg-cream/70 p-3">
                  <p className="text-[11px] text-muted-foreground">مجموع خرید</p>
                  <p className="font-extrabold text-charcoal text-sm">{faPrice(detail.totalSpent ?? 0)}</p>
                </div>
                <div className="rounded-2xl bg-cream/70 p-3">
                  <p className="text-[11px] text-muted-foreground">امتیاز</p>
                  <p className="font-extrabold text-charcoal">{faNumber(detail.points)}</p>
                </div>
              </div>
              {detail.note && (
                <p className="rounded-2xl bg-gold-soft/50 p-3 text-sm text-charcoal/80 flex items-start gap-2">
                  <StickyNote className="size-4 text-gold-dark shrink-0 mt-0.5" /> {detail.note}
                </p>
              )}
              <div>
                <h4 className="text-sm font-bold text-charcoal mb-2">سفارش‌های اخیر</h4>
                <div className="space-y-2">
                  {data.orders.filter((o) => o.userId === detail.id).slice(0, 5).map((o) => (
                    <div key={o.id} className="flex items-center gap-2 rounded-2xl border border-border/70 p-2.5">
                      <span className="font-mono text-[11px] font-bold" dir="ltr">{o.code}</span>
                      <span className="flex-1 text-xs text-muted-foreground">{faRelative(o.createdAt)}</span>
                      <span className="text-xs font-extrabold">{faPrice(o.total)}</span>
                      <StatusBadge status={o.status} />
                    </div>
                  ))}
                  {data.orders.filter((o) => o.userId === detail.id).length === 0 && (
                    <p className="text-xs text-muted-foreground">سفارشی ثبت نشده.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* customer form */}
      <Dialog open={!!form} onOpenChange={(v) => !v && setForm(null)}>
        <DialogContent className="max-w-md rounded-3xl" aria-describedby="cust-form-desc">
          <DialogHeader>
            <DialogTitle className="text-right text-charcoal">{form?.id ? "ویرایش مشتری" : "افزودن مشتری"}</DialogTitle>
            <DialogDescription id="cust-form-desc" className="text-right">اطلاعات تماس مشتری را کامل کنید.</DialogDescription>
          </DialogHeader>
          {form && (
            <div className="space-y-3">
              <Field label="نام و نام خانوادگی" required>
                <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Field>
              <Field label="شماره تماس" required>
                <input className={inputCls} dir="ltr" inputMode="numeric" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </Field>
              <Field label="ایمیل">
                <input className={inputCls} dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </Field>
              <Field label="شهر">
                <input className={inputCls} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </Field>
              <Field label="یادداشت">
                <textarea className={`${inputCls} min-h-16 resize-none`} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
              </Field>
              {form.id && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="موجودی کیف پول (تومان)">
                    <input className={inputCls} dir="ltr" inputMode="numeric" value={form.wallet ?? 0} onChange={(e) => setForm({ ...form, wallet: Number(e.target.value.replace(/\D/g, "")) || 0 })} />
                  </Field>
                  <Field label="امتیاز باشگاه">
                    <input className={inputCls} dir="ltr" inputMode="numeric" value={form.points ?? 0} onChange={(e) => setForm({ ...form, points: Number(e.target.value.replace(/\D/g, "")) || 0 })} />
                  </Field>
                </div>
              )}
              {form.id && (
                <Field label="رمز جدید (فقط برای بازیابی رمز؛ خالی = بدون تغییر)">
                  <input className={inputCls} dir="ltr" autoComplete="off" placeholder="حداقل ۸ کاراکتر" value={form.password ?? ""} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                </Field>
              )}
              {form.id && (
                <label className="flex items-center justify-between rounded-2xl bg-cream/70 px-4 py-3 cursor-pointer">
                  <span className="text-sm font-bold text-charcoal">مسدودسازی حساب کاربر</span>
                  <input
                    type="checkbox"
                    checked={!!form.isBanned}
                    onChange={(e) => setForm({ ...form, isBanned: e.target.checked })}
                    className="size-4 accent-[#c0392b]"
                  />
                </label>
              )}
              <button
                onClick={async () => {
                  if (!form.name.trim() || !/^0\d{10}$/.test(toEnDigits(form.phone).trim())) {
                    toast("نام و تلفن ۱۱ رقمی الزامی است.", true);
                    return;
                  }
                  const res = await panelMutate(form.id ? "customer.update" : "customer.create", {
                    id: form.id,
                    data: form.id
                      ? { name: form.name.trim(), phone: toEnDigits(form.phone).trim(), email: form.email, city: form.city, note: form.note, wallet: form.wallet, points: form.points, isBanned: form.isBanned, password: form.password || undefined }
                      : { name: form.name.trim(), phone: toEnDigits(form.phone).trim(), email: form.email, city: form.city, note: form.note },
                  });
                  if (res.success) {
                    const initialPw = (res as { data?: { initialPassword?: string } }).data?.initialPassword;
                    toast(form.id ? "مشتری ویرایش شد." : `مشتری جدید اضافه شد.${initialPw ? ` رمز اولیه (آن را به مشتری بدهید): ${initialPw}` : ""}`);
                    setForm(null);
                    await refresh();
                  } else toast(res.error ?? "خطا", true);
                }}
                className="w-full rounded-full bg-charcoal text-white py-2.5 text-sm font-bold hover:bg-charcoal/85 transition-colors"
              >
                ذخیره
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="حذف مشتری"
        message={`مشتری «${deleteTarget?.name ?? ""}» حذف شود؟`}
        onConfirm={async () => {
          if (!deleteTarget) return;
          const res = await panelMutate("customer.delete", { id: deleteTarget.id });
          if (res.success) { toast("مشتری حذف شد."); await refresh(); }
        }}
      />
    </div>
  );
}

// ==================== Coupons (Admin) ====================
function genCouponCode(): string {
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += A[Math.floor(Math.random() * A.length)];
  return s;
}

export function AdminCouponsSection() {
  const { data, refresh, toast } = usePanel();
  const [form, setForm] = useState<{ id?: string; code: string; title: string; type: string; value: number; minOrder: number; maxUses: number; expiresAt: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<(typeof data.coupons)[number] | null>(null);

  return (
    <div>
      <SectionHeader
        title="کدهای تخفیف"
        desc="ساخت و مدیریت کمپین‌های تخفیف فروشگاه"
        action={
          <button
            onClick={() => setForm({ code: genCouponCode(), title: "", type: "percent", value: 10, minOrder: 0, maxUses: 100, expiresAt: "" })}
            className="inline-flex items-center gap-1.5 rounded-full bg-charcoal text-white px-4 py-2 text-xs font-bold hover:bg-charcoal/85 transition-colors"
          >
            <Plus className="size-3.5" /> کد تخفیف جدید
          </button>
        }
      />
      <div className="grid md:grid-cols-2 gap-4">
        {data.coupons.map((c) => {
          const expired = c.expiresAt && new Date(c.expiresAt) <= new Date();
          const usagePct = Math.min(100, Math.round((c.used / Math.max(c.maxUses, 1)) * 100));
          return (
            <div key={c.id} className={`relative overflow-hidden rounded-3xl border p-5 ${c.isActive && !expired ? "bg-white border-gold/30" : "bg-cream/60 border-border opacity-75"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded-xl bg-cream-dark px-3 py-1.5 text-sm font-extrabold text-charcoal border border-border tracking-widest" dir="ltr">{c.code}</span>
                    {!c.isActive && <span className="rounded-full bg-[#fbe4e3] text-[#c0392b] text-[10px] font-bold px-2 py-0.5">غیرفعال</span>}
                    {expired && <span className="rounded-full bg-[#fbe4e3] text-[#c0392b] text-[10px] font-bold px-2 py-0.5">منقضی</span>}
                  </div>
                  <p className="font-bold text-sm text-charcoal mt-2">{c.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {c.type === "percent" ? `${faNumber(c.value)}٪ تخفیف` : `${faPrice(c.value)} تخفیف`} — حداقل سبد: {faPrice(c.minOrder)}
                    {c.expiresAt && <> — تا {faDate(c.expiresAt)}</>}
                  </p>
                  <div className="mt-3">
                    <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                      <span>مصرف: {faNumber(c.used)} از {faNumber(c.maxUses)}</span>
                      <span>{faNumber(usagePct)}٪</span>
                    </div>
                    <div className="h-2 rounded-full bg-cream-dark overflow-hidden">
                      <div className="h-full rounded-full bg-gold" style={{ width: `${usagePct}%` }} />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <p className="text-2xl font-extrabold text-gold-dark" dir="ltr">
                    {c.type === "percent" ? `${faNumber(c.value)}٪` : faShortPrice(c.value)}
                  </p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(c.code).catch(() => {});
                        toast(`کد «${c.code}» کپی شد.`);
                      }}
                      className="grid place-items-center size-8 rounded-full text-muted-foreground hover:bg-cream-dark transition-colors"
                      aria-label={`کپی ${c.code}`}
                    >
                      <Copy className="size-3.5" />
                    </button>
                    <button
                      onClick={() => setForm({ id: c.id, code: c.code, title: c.title, type: c.type, value: c.value, minOrder: c.minOrder, maxUses: c.maxUses, expiresAt: c.expiresAt })}
                      className="grid place-items-center size-8 rounded-full text-muted-foreground hover:bg-cream-dark transition-colors"
                      aria-label={`ویرایش ${c.code}`}
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(c)}
                      className="grid place-items-center size-8 rounded-full text-muted-foreground hover:bg-[#fbe4e3] hover:text-[#c0392b] transition-colors"
                      aria-label={`حذف ${c.code}`}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                  <button
                    onClick={async () => {
                      const res = await panelMutate("coupon.update", { id: c.id, data: { isActive: !c.isActive } });
                      if (res.success) { toast(c.isActive ? "کد غیرفعال شد." : "کد فعال شد."); await refresh(); }
                    }}
                    role="switch"
                    aria-checked={c.isActive}
                    aria-label={`فعال/غیرفعال ${c.code}`}
                    className={`relative w-11 h-6 rounded-full transition-colors ${c.isActive ? "bg-sage-dark" : "bg-cream-dark"}`}
                  >
                    <span className={`absolute top-1 size-4 rounded-full bg-white shadow transition-all ${c.isActive ? "right-1" : "right-6"}`} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* coupon form */}
      <Dialog open={!!form} onOpenChange={(v) => !v && setForm(null)}>
        <DialogContent className="max-w-md rounded-3xl" aria-describedby="coupon-form-desc">
          <DialogHeader>
            <DialogTitle className="text-right text-charcoal">{form?.id ? "ویرایش کد تخفیف" : "کد تخفیف جدید"}</DialogTitle>
            <DialogDescription id="coupon-form-desc" className="text-right">کمپین تخفیف خود را تنظیم کنید.</DialogDescription>
          </DialogHeader>
          {form && (
            <div className="space-y-3">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Field label="کد" required>
                    <input className={inputCls} dir="ltr" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
                  </Field>
                </div>
                <button
                  onClick={() => setForm({ ...form, code: genCouponCode() })}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-2xl bg-gold-soft text-gold-dark px-4 py-2.5 text-xs font-bold hover:bg-gold/30 transition-colors"
                >
                  <Wand2 className="size-3.5" /> تولید کد
                </button>
              </div>
              <Field label="عنوان کمپین" required>
                <input className={inputCls} value={form.title} placeholder="مثلاً ۱۵٪ تخفیف یلدا" onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="نوع تخفیف">
                  <select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="percent">درصدی</option>
                    <option value="amount">مبلغ ثابت</option>
                  </select>
                </Field>
                <Field label={form.type === "percent" ? "درصد تخفیف" : "مبلغ (تومان)"} required>
                  <input className={inputCls} dir="ltr" inputMode="numeric" value={form.value || ""} onChange={(e) => setForm({ ...form, value: Number(e.target.value.replace(/\D/g, "")) })} />
                </Field>
                <Field label="حداقل سبد (تومان)">
                  <input className={inputCls} dir="ltr" inputMode="numeric" value={form.minOrder || ""} onChange={(e) => setForm({ ...form, minOrder: Number(e.target.value.replace(/\D/g, "")) })} />
                </Field>
                <Field label="سقف استفاده">
                  <input className={inputCls} dir="ltr" inputMode="numeric" value={form.maxUses || ""} onChange={(e) => setForm({ ...form, maxUses: Number(e.target.value.replace(/\D/g, "")) })} />
                </Field>
              </div>
              <Field label="تاریخ انقضا (اختیاری — میلادی)">
                <input className={inputCls} dir="ltr" type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
              </Field>
              <button
                onClick={async () => {
                  if (!form.code.trim() || !form.title.trim() || !form.value) {
                    toast("کد، عنوان و مقدار تخفیف الزامی است.", true);
                    return;
                  }
                  const res = await panelMutate(form.id ? "coupon.update" : "coupon.create", {
                    id: form.id,
                    data: { code: form.code.trim(), title: form.title.trim(), type: form.type, value: form.value, minOrder: form.minOrder, maxUses: form.maxUses, expiresAt: form.expiresAt },
                  });
                  if (res.success) {
                    toast(form.id ? "کد تخفیف ویرایش شد." : "کد تخفیف جدید ساخته شد.");
                    setForm(null);
                    await refresh();
                  } else toast(res.error ?? "خطا", true);
                }}
                className="w-full rounded-full bg-charcoal text-white py-2.5 text-sm font-bold hover:bg-charcoal/85 transition-colors"
              >
                ذخیره کد تخفیف
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="حذف کد تخفیف"
        message={`کد «${deleteTarget?.code ?? ""}» حذف شود؟`}
        onConfirm={async () => {
          if (!deleteTarget) return;
          const res = await panelMutate("coupon.delete", { id: deleteTarget.id });
          if (res.success) { toast("کد تخفیف حذف شد."); await refresh(); }
        }}
      />
    </div>
  );
}
