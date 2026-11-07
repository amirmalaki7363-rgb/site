"use client";

import { useMemo, useState } from "react";
import { escapeHtml as esc } from "@/lib/security";
import {
  Eye, XCircle, ShoppingCart, ChevronDown, MapPin, Phone, CreditCard, Gift,
  CalendarDays, Clock, FileText, StickyNote, Printer, ReceiptText,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog, EmptyState, StatusBadge } from "@/components/panel/shared";
import OrderTimeline from "@/components/user/order-timeline";
import { usePanel } from "@/components/panel/panel-context";
import { useCart } from "@/lib/cart-store";
import { useView } from "@/lib/panel-store";
import { panelMutate } from "@/lib/panel-api";
import type { Order, OrderStatus } from "@/lib/types";
import {
  faPrice, faNumber, faDateTime, faRelative,
} from "@/lib/format";
import { PAYMENT_LABELS } from "@/lib/types";

const TABS: { key: string; label: string }[] = [
  { key: "all", label: "همه" },
  { key: "active", label: "جاری" },
  { key: "pending", label: "در انتظار تأیید" },
  { key: "preparing", label: "در حال آماده‌سازی" },
  { key: "shipped", label: "ارسال شده" },
  { key: "delivered", label: "تحویل شده" },
  { key: "cancelled", label: "لغو شده" },
];

const ACTIVE_STATUSES: OrderStatus[] = ["pending", "confirmed", "preparing", "shipped"];

// ---------- printable invoice ----------
function printInvoice(order: Order) {
  const itemsHtml = [
    ...order.items.map((it) => `
      <tr>
        <td>${esc(it.name)}</td>
        <td style="text-align:center">${faNumber(it.qty)}</td>
        <td>${faPrice(it.price)}</td>
        <td>${faPrice(it.qty * it.price)}</td>
      </tr>`),
    ...order.addons.map((a) => `
      <tr class="muted">
        <td>${esc(a.name)} (افزونه هدیه)</td>
        <td style="text-align:center">${faNumber(1)}</td>
        <td>${faPrice(a.price)}</td>
        <td>${faPrice(a.price)}</td>
      </tr>`),
  ].join("");

  const html = `<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8" />
<title>فاکتور ${esc(order.code)} — گلستان حافظ</title>
<style>
  @page { size: A5; margin: 12mm; }
  body { font-family: Tahoma, "Segoe UI", sans-serif; color: #2c2c2c; padding: 24px; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #e8b4b8; padding-bottom: 14px; margin-bottom: 18px; }
  .brand { font-size: 20px; font-weight: 800; }
  .brand small { display: block; font-size: 11px; color: #777; font-weight: 400; margin-top: 4px; }
  .badge { background: #a8c5a0; color: #fff; border-radius: 999px; padding: 4px 12px; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; }
  th { background: #f9f5f0; padding: 8px; border-bottom: 2px solid #d4a574; text-align: right; }
  td { padding: 8px; border-bottom: 1px solid #eee; }
  tr.muted td { color: #8a7a5c; }
  .totals { margin-top: 12px; font-size: 12px; }
  .totals div { display: flex; justify-content: space-between; padding: 5px 0; }
  .totals .grand { font-weight: 800; font-size: 14px; border-top: 2px dashed #d4a574; margin-top: 6px; padding-top: 10px; }
  .meta { margin-top: 16px; font-size: 11px; color: #555; line-height: 2; background: #f9f5f0; border-radius: 12px; padding: 12px 16px; }
  .foot { margin-top: 24px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 12px; }
</style>
</head>
<body>
  <div class="head">
    <div class="brand">🌸 گلستان حافظ<small>گل، شعر و عشق در هر سفارش — تهران، خیابان ولیعصر، کوچه یاس، پلاک ۸</small></div>
    <div style="text-align:left">
      <div class="badge">فاکتور فروش</div>
      <div style="font-size:11px;color:#777;margin-top:6px">شماره: <b dir="ltr">${esc(order.code)}</b><br/>تاریخ: ${faDateTime(order.createdAt)}</div>
    </div>
  </div>
  <table>
    <thead><tr><th>شرح کالا</th><th style="text-align:center">تعداد</th><th>قیمت واحد</th><th>جمع</th></tr></thead>
    <tbody>${itemsHtml}</tbody>
  </table>
  <div class="totals">
    <div><span>هزینه ارسال</span><span>${order.shippingCost === 0 ? "رایگان" : faPrice(order.shippingCost)}</span></div>
    ${order.discount > 0 ? `<div><span>تخفیف</span><span>- ${faPrice(order.discount)}</span></div>` : ""}
    <div class="grand"><span>مبلغ نهایی</span><span>${faPrice(order.total)} تومان</span></div>
  </div>
  <div class="meta">
    <b>خریدار:</b> ${esc(order.customerName)} — <span dir="ltr">${esc(order.phone)}</span><br/>
    <b>آدرس تحویل:</b> ${esc(order.province)}، ${esc(order.city)}، ${esc(order.address)}${order.postal ? ` — کدپستی: ${esc(order.postal)}` : ""}<br/>
    <b>روش پرداخت:</b> ${esc(PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod)}${order.deliveryDate ? ` — <b>تحویل:</b> ${esc(order.deliveryDate)}، ${esc(order.deliverySlot)}` : ""}
  </div>
  <div class="foot">با سپاس از اعتماد شما 🌷 گلستان حافظ — این فاکتور به‌صورت الکترونیکی صادر شده است.</div>
</body>
</html>`;

  const win = window.open("", "_blank", "width=800,height=640");
  if (!win) {
    window.dispatchEvent(new CustomEvent("gh:panel-toast", { detail: { msg: "مرورگر اجازه بازکردن پنجره چاپ را نداد.", isError: true } }));
    return;
  }
  win.document.write(html);
  win.document.close();
  win.focus();
  win.onload = () => {
    win.print();
    win.close();
  };
}

export default function OrdersSection() {
  const { data, refresh, toast } = usePanel();
  const openGateway = useView((s) => s.openGateway);
  const addItem = useCart((s) => s.addItem);
  const openCart = useCart((s) => s.openCart);
  const [tab, setTab] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [details, setDetails] = useState<Order | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

  // سفارش آنلاین پرداخت‌نشده → «در انتظار پرداخت» + دکمه ادامه پرداخت
  const isUnpaid = (o: Order) =>
    o.paymentMethod === "online" && !o.paidAt && o.status !== "cancelled";

  async function continuePayment(order: Order) {
    if (payingId) return;
    setPayingId(order.id);
    try {
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "retry", orderId: order.id }),
      });
      const json = await res.json();
      if (json.success && json.authority) {
        if (json.redirectUrl) {
          window.location.href = json.redirectUrl;
          return;
        }
        openGateway(json.authority);
      } else {
        toast(json.error ?? "خطا در اتصال به درگاه", true);
      }
    } catch {
      toast("خطای شبکه در اتصال به درگاه", true);
    } finally {
      setPayingId(null);
    }
  }

  const myOrders = useMemo(
    () => data.orders.filter((o) => o.phone === data.profile.phone),
    [data.orders, data.profile.phone]
  );

  const filtered = useMemo(() => {
    if (tab === "all") return myOrders;
    if (tab === "active") return myOrders.filter((o) => ACTIVE_STATUSES.includes(o.status));
    return myOrders.filter((o) => o.status === tab);
  }, [myOrders, tab]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: myOrders.length, active: 0 };
    for (const o of myOrders) {
      if (ACTIVE_STATUSES.includes(o.status)) c.active = (c.active ?? 0) + 1;
      c[o.status] = (c[o.status] ?? 0) + 1;
    }
    return c;
  }, [myOrders]);

  async function doCancel(order: Order) {
    const res = await panelMutate("order.cancel", { id: order.id });
    if (res.success) {
      toast("سفارش با موفقیت لغو شد.");
      await refresh();
    } else {
      toast(res.error ?? "خطا در لغو سفارش", true);
    }
  }

  function reorder(order: Order) {
    for (const it of order.items) {
      addItem({ id: it.id, name: it.name, price: it.price, image: it.image ?? "/images/roses-pink-1.jpg" }, it.qty);
    }
    toast("اقلام سفارش به سبد خرید اضافه شد.");
    openCart();
  }

  return (
    <div>
      {/* tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 -mx-1 px-1" role="tablist" aria-label="فیلتر سفارش‌ها">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-colors ${
              tab === t.key
                ? "bg-charcoal text-white shadow"
                : "bg-white text-charcoal/70 border border-border hover:bg-blush-soft"
            }`}
          >
            {t.label}
            <span className={`mr-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${tab === t.key ? "bg-white/20" : "bg-cream-dark"}`}>
              {faNumber(counts[t.key] ?? 0)}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<FileText className="size-7" />}
          title="سفارشی در این بخش نیست"
          desc="هنوز سفارشی با این وضعیت ثبت نکرده‌اید. از فروشگاه اولین گل خود را انتخاب کنید."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((o) => {
            const isOpen = expanded === o.id;
            return (
              <div key={o.id} className="rounded-3xl bg-white border border-border overflow-hidden shadow-[0_2px_12px_rgba(44,44,44,0.04)]">
                <button
                  onClick={() => setExpanded(isOpen ? null : o.id)}
                  className="w-full p-4 sm:p-5 flex flex-wrap items-center gap-3 text-right hover:bg-cream/50 transition-colors"
                  aria-expanded={isOpen}
                >
                  <div className="flex -space-x-3 space-x-reverse shrink-0">
                    {o.items.slice(0, 3).map((it, i) => (
                       
                      <img
                        key={i}
                        src={it.image || "/images/roses-pink-1.jpg"}
                        alt={it.name}
                        className="size-12 rounded-2xl object-cover border-2 border-white shadow-sm"
                      />
                    ))}
                    {o.items.length > 3 && (
                      <span className="grid place-items-center size-12 rounded-2xl bg-cream-dark text-[11px] font-bold text-charcoal border-2 border-white shadow-sm">
                        +{faNumber(o.items.length - 3)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-[140px]">
                    <p className="font-bold text-sm text-charcoal">
                      {o.items[0]?.name}
                      {o.items.length > 1 && ` و ${faNumber(o.items.length - 1)} مورد دیگر`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                      <span className="font-mono" dir="ltr">{o.code}</span>
                      <span>•</span>
                      <span>{faRelative(o.createdAt)}</span>
                    </p>
                  </div>
                  <div className="text-left shrink-0 flex items-center gap-3">
                    <div>
                      <p className="text-sm font-extrabold text-charcoal">{faPrice(o.total)}</p>
                      <div className="mt-1 flex justify-end items-center gap-1.5">
                        {isUnpaid(o) && (
                          <span className="rounded-full bg-[#fbe4e3] text-[#c0392b] px-2 py-0.5 text-[9px] font-bold">
                            در انتظار پرداخت
                          </span>
                        )}
                        <StatusBadge status={o.status} />
                      </div>
                    </div>
                    <ChevronDown className={`size-5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-border bg-cream/40 p-4 sm:p-5 space-y-4">
                    <OrderTimeline status={o.status} createdAt={o.createdAt} />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="rounded-2xl bg-white border border-border p-3">
                        <p className="text-muted-foreground flex items-center gap-1"><CalendarDays className="size-3.5" /> تاریخ ثبت</p>
                        <p className="font-bold mt-1">{faDateTime(o.createdAt)}</p>
                      </div>
                      <div className="rounded-2xl bg-white border border-border p-3">
                        <p className="text-muted-foreground flex items-center gap-1"><Clock className="size-3.5" /> زمان ارسال</p>
                        <p className="font-bold mt-1">{o.deliveryDate || "—"} {o.deliverySlot && `(${o.deliverySlot})`}</p>
                      </div>
                      <div className="rounded-2xl bg-white border border-border p-3">
                        <p className="text-muted-foreground flex items-center gap-1"><CreditCard className="size-3.5" /> پرداخت</p>
                        <p className="font-bold mt-1">
                          {PAYMENT_LABELS[o.paymentMethod] ?? o.paymentMethod}
                          {o.paidAt ? " — پرداخت‌شده ✓" : isUnpaid(o) ? " — پرداخت نشده" : ""}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white border border-border p-3">
                        <p className="text-muted-foreground flex items-center gap-1"><MapPin className="size-3.5" /> مقصد</p>
                        <p className="font-bold mt-1 truncate">{o.city}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {isUnpaid(o) && (
                        <button
                          onClick={() => continuePayment(o)}
                          disabled={payingId === o.id}
                          className="inline-flex items-center gap-1.5 rounded-full bg-gold text-white px-4 py-2 text-xs font-bold hover:bg-gold-dark transition-colors disabled:opacity-60"
                        >
                          <CreditCard className="size-3.5" />
                          {payingId === o.id ? "در حال اتصال به درگاه..." : "ادامه پرداخت"}
                        </button>
                      )}
                      <button
                        onClick={() => setDetails(o)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-charcoal text-white px-4 py-2 text-xs font-bold hover:bg-charcoal/85 transition-colors"
                      >
                        <Eye className="size-3.5" /> جزئیات کامل
                      </button>
                      <button
                        onClick={() => reorder(o)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-sage-soft text-sage-dark px-4 py-2 text-xs font-bold hover:bg-sage/40 transition-colors"
                      >
                        <ShoppingCart className="size-3.5" /> خرید مجدد
                      </button>
                      {(o.status === "pending" || o.status === "confirmed") && (
                        <button
                          onClick={() => setCancelTarget(o)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#fbe4e3] text-[#c0392b] px-4 py-2 text-xs font-bold hover:bg-[#f5cfcc] transition-colors"
                        >
                          <XCircle className="size-3.5" /> لغو سفارش
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* details dialog */}
      <Dialog open={!!details} onOpenChange={(v) => !v && setDetails(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl" aria-describedby="order-detail-desc">
          <DialogHeader>
            <DialogTitle className="text-right flex items-center justify-between text-charcoal">
              <span>جزئیات سفارش</span>
              <span className="font-mono text-sm text-muted-foreground" dir="ltr">{details?.code}</span>
            </DialogTitle>
            <DialogDescription id="order-detail-desc" className="text-right">
              ثبت‌شده در {details ? faDateTime(details.createdAt) : ""}
            </DialogDescription>
          </DialogHeader>
          {details && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <StatusBadge status={details.status} />
                <button
                  onClick={() => printInvoice(details)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-cream-dark text-charcoal px-4 py-2 text-xs font-bold hover:bg-border transition-colors"
                >
                  <Printer className="size-3.5" /> چاپ فاکتور
                </button>
              </div>
              {details.status !== "cancelled" && (
                <div className="rounded-2xl border border-border p-4">
                  <OrderTimeline status={details.status} createdAt={details.createdAt} />
                </div>
              )}

              <div>
                <h4 className="text-sm font-bold text-charcoal mb-2">اقلام سفارش</h4>
                <div className="space-y-2">
                  {details.items.map((it, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-2xl bg-cream/70 p-2.5">
                      { }
                      <img src={it.image || "/images/roses-pink-1.jpg"} alt={it.name} className="size-11 rounded-xl object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-charcoal truncate">{it.name}</p>
                        <p className="text-xs text-muted-foreground">{faNumber(it.qty)} × {faPrice(it.price)}</p>
                      </div>
                      <p className="text-sm font-extrabold text-charcoal shrink-0">{faPrice(it.qty * it.price)}</p>
                    </div>
                  ))}
                  {details.addons.map((a, i) => (
                    <div key={`a-${i}`} className="flex items-center gap-3 rounded-2xl bg-gold-soft/50 p-2.5">
                      <span className="grid place-items-center size-11 rounded-xl bg-gold-soft text-gold-dark">
                        <Gift className="size-5" />
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-charcoal">{a.name}</p>
                        <p className="text-xs text-muted-foreground">افزونه هدیه</p>
                      </div>
                      <p className="text-sm font-extrabold text-charcoal">{faPrice(a.price)}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 space-y-1.5 text-sm border-t border-dashed border-border pt-3">
                  <p className="flex justify-between text-muted-foreground">
                    <span>هزینه ارسال</span>
                    <span>{details.shippingCost === 0 ? "رایگان" : faPrice(details.shippingCost)}</span>
                  </p>
                  {details.discount > 0 && (
                    <p className="flex justify-between text-sage-dark">
                      <span>تخفیف</span>
                      <span>-{faPrice(details.discount)}</span>
                    </p>
                  )}
                  <p className="flex justify-between font-extrabold text-charcoal text-base">
                    <span>مبلغ کل</span>
                    <span>{faPrice(details.total)}</span>
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-cream/70 p-4 space-y-2 text-sm">
                <p className="flex items-start gap-2">
                  <MapPin className="size-4 text-blush-dark shrink-0 mt-0.5" />
                  <span><span className="text-muted-foreground">آدرس:</span> {details.province}، {details.city}، {details.address}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="size-4 text-blush-dark" />
                  <span><span className="text-muted-foreground">گیرنده:</span> {details.customerName} — <span dir="ltr">{details.phone}</span></span>
                </p>
                <p className="flex items-center gap-2">
                  <CreditCard className="size-4 text-blush-dark" />
                  <span>
                    <span className="text-muted-foreground">روش پرداخت:</span> {PAYMENT_LABELS[details.paymentMethod] ?? details.paymentMethod}
                    {details.paidAt && <span className="text-sage-dark font-bold"> — پرداخت‌شده در {faDateTime(details.paidAt)}</span>}
                    {!details.paidAt && isUnpaid(details) && <span className="text-[#c0392b] font-bold"> — پرداخت نشده</span>}
                  </span>
                </p>
                {details.paymentRef && (
                  <p className="flex items-center gap-2">
                    <ReceiptText className="size-4 text-blush-dark" />
                    <span><span className="text-muted-foreground">شماره پیگیری:</span> <span dir="ltr" className="font-bold">{details.paymentRef}</span></span>
                  </p>
                )}
                {details.deliveryDate && (
                  <p className="flex items-center gap-2">
                    <CalendarDays className="size-4 text-blush-dark" />
                    <span><span className="text-muted-foreground">زمان تحویل:</span> {details.deliveryDate} — {details.deliverySlot}</span>
                  </p>
                )}
                {details.cardMessage && (
                  <p className="flex items-start gap-2">
                    <StickyNote className="size-4 text-blush-dark shrink-0 mt-0.5" />
                    <span><span className="text-muted-foreground">کارت تبریک:</span> «{details.cardMessage}»</span>
                  </p>
                )}
                {details.note && (
                  <p className="flex items-start gap-2">
                    <FileText className="size-4 text-blush-dark shrink-0 mt-0.5" />
                    <span><span className="text-muted-foreground">یادداشت:</span> {details.note}</span>
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!cancelTarget}
        onOpenChange={(v) => !v && setCancelTarget(null)}
        title="لغو سفارش"
        message={`آیا از لغو سفارش ${cancelTarget?.code ?? ""} مطمئن هستید؟ این عملیات قابل بازگشت نیست.`}
        confirmLabel="بله، لغو کن"
        onConfirm={() => cancelTarget && doCancel(cancelTarget)}
      />
    </div>
  );
}
