"use client";

import { useEffect, useState } from "react";
import { PackageSearch, Loader2, CheckCircle2, Circle, XCircle } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { faNumber } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";

interface TrackedOrder {
  code: string;
  customerName: string;
  address: string;
  deliveryDate: string;
  deliverySlot: string;
  cardMessage: string;
  addons: { id: string; name: string; price: number }[];
  items: { id: string; name: string; price: number; qty: number }[];
  total: number;
  status: string;
  createdAt: string;
}

const STATUS_STEPS = [
  { id: "pending", label: "ثبت شد", desc: "سفارش شما دریافت شد" },
  { id: "preparing", label: "در حال آماده‌سازی", desc: "گل‌آرایان در حال چیدن دسته‌گل شما هستند" },
  { id: "shipped", label: "ارسال شد", desc: "سفارش تحویل پیک شده است" },
  { id: "delivered", label: "تحویل شد", desc: "به آرزوی شما رسید! 🌸" },
];

const STATUS_MAP: Record<string, number> = { pending: 0, preparing: 1, shipped: 2, delivered: 3 };

export default function OrderTracking() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [notFound, setNotFound] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("gh:open-tracking", handler);
    return () => window.removeEventListener("gh:open-tracking", handler);
  }, []);

  useEffect(() => {
    if (open) {
      setCode("");
      setOrder(null);
      setNotFound(false);
    }
  }, [open]);

  async function track(e?: React.FormEvent) {
    e?.preventDefault();
    const c = code.trim().toUpperCase();
    if (!c) return;
    setLoading(true);
    setOrder(null);
    setNotFound(false);
    try {
      const res = await fetch(`/api/orders?code=${encodeURIComponent(c)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setOrder(data.order);
      } else {
        setNotFound(true);
        if (data.error) toast({ title: "پیدا نشد", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({
        title: "خطای شبکه",
        description: "لطفاً اتصال اینترنت را بررسی و دوباره تلاش کنید.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const currentStep = order ? (STATUS_MAP[order.status] ?? 0) : -1;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md p-0 rounded-3xl bg-cream overflow-hidden" aria-describedby={undefined}>
        <DialogHeader className="px-6 pt-6 pb-0 space-y-1">
          <DialogTitle className="text-right text-charcoal flex items-center gap-2">
            <PackageSearch className="size-5 text-gold-dark" />
            رهگیری سفارش
          </DialogTitle>
          <DialogDescription className="text-right text-xs leading-6">
            کد رهگیری سفارش (مثل GH-AB12CD) را وارد کنید تا وضعیت لحظه‌ای آن را ببینید.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4 max-h-[65vh] overflow-y-auto">
          <form onSubmit={track} className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="GH-XXXXXX"
              dir="ltr"
              className="flex-1 h-11 rounded-xl bg-white border border-border px-4 text-sm text-charcoal placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-gold/50 text-left"
              aria-label="کد رهگیری سفارش"
            />
            <Button
              type="submit"
              disabled={loading || !code.trim()}
              className="rounded-xl bg-charcoal text-white hover:bg-charcoal/85 h-11 px-5"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : "پیگیری"}
            </Button>
          </form>

          {notFound && !loading && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/10 text-destructive px-4 py-3 text-xs font-semibold">
              <XCircle className="size-4 shrink-0" />
              سفارشی با این کد پیدا نشد؛ کد را دوباره بررسی کنید.
            </div>
          )}

          {order && (
            <div className="space-y-3">
              {/* status timeline */}
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <p className="text-xs font-bold text-charcoal mb-3">
                  وضعیت سفارش <span dir="ltr" className="text-gold-dark">{order.code}</span>
                </p>
                <ol className="space-y-0">
                  {STATUS_STEPS.map((s, i) => {
                    const reached = i <= currentStep;
                    const isLast = i === STATUS_STEPS.length - 1;
                    return (
                      <li key={s.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <span
                            className={`grid place-items-center size-7 rounded-full shrink-0 transition-colors ${
                              reached ? "bg-sage-dark text-white" : "bg-cream-dark text-muted-foreground"
                            }`}
                          >
                            {reached ? <CheckCircle2 className="size-4" /> : <Circle className="size-3.5" />}
                          </span>
                          {!isLast && (
                            <span className={`w-0.5 flex-1 min-h-5 ${i < currentStep ? "bg-sage-dark" : "bg-cream-dark"}`} />
                          )}
                        </div>
                        <div className={`pb-4 ${isLast ? "pb-0" : ""}`}>
                          <p className={`text-xs font-bold ${reached ? "text-charcoal" : "text-muted-foreground"}`}>
                            {s.label}
                          </p>
                          <p className="text-[11px] text-muted-foreground leading-5">{s.desc}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>

              {/* order info */}
              <div className="bg-white rounded-2xl p-4 shadow-sm text-xs space-y-1.5">
                <p className="font-bold text-charcoal mb-1">جزئیات سفارش:</p>
                <p className="text-muted-foreground leading-6">
                  <span className="font-semibold text-charcoal">گیرنده:</span> {order.customerName}
                </p>
                {order.deliveryDate && (
                  <p className="text-muted-foreground leading-6">
                    <span className="font-semibold text-charcoal">زمان ارسال:</span> {order.deliveryDate}، {order.deliverySlot}
                  </p>
                )}
                <Separator className="my-1.5" />
                {order.items.map((i) => (
                  <div key={i.id} className="flex justify-between gap-2">
                    <span className="truncate">{i.name} × {faNumber(i.qty)}</span>
                    <span className="font-bold text-gold-dark whitespace-nowrap">{faNumber(i.price * i.qty)}</span>
                  </div>
                ))}
                {order.addons?.length > 0 && (
                  <p className="text-muted-foreground leading-6 pt-1">
                    <span className="font-semibold text-charcoal">هدایا:</span>{" "}
                    {order.addons.map((a) => a.name).join("، ")}
                  </p>
                )}
                <Separator className="my-1.5" />
                <div className="flex justify-between font-extrabold text-charcoal">
                  <span>مبلغ کل:</span>
                  <span className="text-gold-dark">{faNumber(order.total)} تومان</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
