"use client";

import type { ReactNode } from "react";
import {
  CheckCircle2, Clock, Package, Truck, XCircle, ChefHat, CircleAlert, Inbox,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/types";
import { faPrice } from "@/lib/format";

// ---------- order status helpers ----------
export const STATUS_STYLES: Record<string, { cls: string; dot: string }> = {
  pending: { cls: "bg-gold-soft text-gold-dark border-gold/30", dot: "bg-gold" },
  confirmed: { cls: "bg-sage-soft text-sage-dark border-sage/40", dot: "bg-sage-dark" },
  preparing: { cls: "bg-blush-soft text-blush-dark border-blush/40", dot: "bg-blush-dark" },
  shipped: { cls: "bg-[#efe6fb] text-[#7c5cbf] border-[#c9b3ea]/40", dot: "bg-[#7c5cbf]" },
  delivered: { cls: "bg-sage text-white border-sage-dark/30", dot: "bg-sage-dark" },
  cancelled: { cls: "bg-[#fbe4e3] text-[#c0392b] border-[#e8a7a3]/40", dot: "bg-[#c0392b]" },
};

export const STATUS_ICONS: Record<string, ReactNode> = {
  pending: <Clock className="size-3.5" />,
  confirmed: <CheckCircle2 className="size-3.5" />,
  preparing: <ChefHat className="size-3.5" />,
  shipped: <Truck className="size-3.5" />,
  delivered: <Package className="size-3.5" />,
  cancelled: <XCircle className="size-3.5" />,
};

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${s.cls}`}>
      {STATUS_ICONS[status]}
      {ORDER_STATUS_LABELS[status as OrderStatus] ?? status}
    </span>
  );
}

// ---------- stat card ----------
export function PanelStat({
  icon, label, value, sub, tone = "blush",
}: {
  icon: ReactNode; label: string; value: string; sub?: string;
  tone?: "blush" | "sage" | "gold" | "charcoal";
}) {
  const tones = {
    blush: "bg-blush-soft text-blush-dark",
    sage: "bg-sage-soft text-sage-dark",
    gold: "bg-gold-soft text-gold-dark",
    charcoal: "bg-cream-dark text-charcoal",
  };
  return (
    <div className="rounded-3xl bg-white border border-border p-5 flex items-center gap-4 shadow-[0_2px_12px_rgba(44,44,44,0.04)] hover:shadow-[0_6px_24px_rgba(44,44,44,0.08)] transition-shadow">
      <span className={`grid place-items-center size-12 rounded-2xl shrink-0 ${tones[tone]}`}>{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-extrabold text-charcoal truncate">{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground truncate">{sub}</p>}
      </div>
    </div>
  );
}

// ---------- stars ----------
export function Stars({ value, size = "size-4" }: { value: number; size?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" dir="ltr" aria-label={`${value} از ۵`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 24 24" className={`${size} ${i <= Math.round(value) ? "fill-gold text-gold" : "fill-cream-dark text-cream-dark"}`}>
          <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8L12 2z" />
        </svg>
      ))}
    </span>
  );
}

// ---------- section header ----------
export function SectionHeader({ title, desc, action }: { title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-5 flex-wrap">
      <div>
        <h2 className="text-xl font-extrabold text-charcoal">{title}</h2>
        {desc && <p className="text-sm text-muted-foreground mt-1">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

// ---------- empty state ----------
export function EmptyState({ icon, title, desc, action }: { icon: ReactNode; title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6 rounded-3xl border border-dashed border-border bg-white/60">
      <span className="grid place-items-center size-16 rounded-full bg-blush-soft text-blush-dark mb-4">
        {icon ?? <Inbox className="size-7" />}
      </span>
      <p className="font-bold text-charcoal">{title}</p>
      {desc && <p className="text-sm text-muted-foreground mt-1.5 max-w-sm">{desc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ---------- confirm dialog ----------
export function ConfirmDialog({
  open, onOpenChange, title, message, confirmLabel = "حذف", onConfirm, destructive = true,
}: {
  open: boolean; onOpenChange: (v: boolean) => void; title: string; message: string;
  confirmLabel?: string; onConfirm: () => void; destructive?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl" aria-describedby="confirm-msg">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center gap-2 text-charcoal">
            <CircleAlert className={`size-5 ${destructive ? "text-destructive" : "text-gold-dark"}`} />
            {title}
          </DialogTitle>
          <DialogDescription id="confirm-msg" className="text-right leading-6">
            {message}
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 justify-start">
          <button
            onClick={() => { onConfirm(); onOpenChange(false); }}
            className={`px-4 py-2 rounded-full text-sm font-bold text-white transition-colors ${
              destructive ? "bg-destructive hover:bg-destructive/85" : "bg-charcoal hover:bg-charcoal/85"
            }`}
          >
            {confirmLabel}
          </button>
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-full text-sm font-bold text-charcoal bg-cream-dark hover:bg-border transition-colors"
          >
            انصراف
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------- form field ----------
export function Field({ label, children, required }: { label: string; children: ReactNode; required?: boolean }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-charcoal/80 mb-1.5">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </span>
      {children}
    </label>
  );
}

// ---------- panel skeleton ----------
export function PanelSkeleton() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <span className="relative grid place-items-center size-16">
          <span className="absolute inset-0 rounded-full border-4 border-blush-soft" />
          <span className="absolute inset-0 rounded-full border-4 border-transparent border-t-blush animate-spin" />
          <Package className="size-6 text-blush-dark" />
        </span>
        <p className="text-sm text-muted-foreground font-medium">در حال بارگذاری پنل...</p>
      </div>
    </div>
  );
}

// ---------- chart tooltip ----------
export function ChartTip({ active, payload, label, isCount = false }: {
  active?: boolean;
  payload?: { value?: number; name?: string }[];
  label?: string;
  isCount?: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl bg-charcoal text-white px-3.5 py-2.5 shadow-lg text-xs" dir="rtl">
      <p className="font-bold mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-1.5">
          <span className="inline-block size-2 rounded-full bg-gold" />
          {p.name === "total" ? "فروش" : p.name === "count" ? "تعداد" : p.name}:{" "}
          <span className="font-bold">
            {isCount
              ? new Intl.NumberFormat("fa-IR").format(p.value ?? 0)
              : faPrice(p.value ?? 0)}
          </span>
        </p>
      ))}
    </div>
  );
}
