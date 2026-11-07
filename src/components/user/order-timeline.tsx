"use client";

import { faDate, faDateTime } from "@/lib/format";
import { ClipboardList, CheckCircle2, ChefHat, Truck, PackageOpen, XCircle } from "lucide-react";

const STEPS = [
  { key: "pending", label: "ثبت سفارش", icon: ClipboardList, offsetH: 0 },
  { key: "confirmed", label: "تأیید سفارش", icon: CheckCircle2, offsetH: 3 },
  { key: "preparing", label: "آماده‌سازی گل", icon: ChefHat, offsetH: 5 },
  { key: "shipped", label: "تحویل به پیک", icon: Truck, offsetH: 9 },
  { key: "delivered", label: "تحویل شد", icon: PackageOpen, offsetH: 26 },
] as const;

const STATUS_INDEX: Record<string, number> = {
  pending: 0, confirmed: 1, preparing: 2, shipped: 3, delivered: 4,
};

export default function OrderTimeline({ status, createdAt }: { status: string; createdAt: string }) {
  const created = new Date(createdAt);
  const currentIdx = STATUS_INDEX[status] ?? 0;

  if (status === "cancelled") {
    return (
      <div className="rounded-2xl bg-[#fbe4e3] border border-[#e8a7a3]/40 p-4 text-sm text-[#c0392b] font-semibold flex items-center gap-2">
        <XCircle className="size-4 shrink-0" />
        این سفارش لغو شده است. در صورت پرداخت آنلاین، مبلغ حداکثر تا ۷۲ ساعت به حساب یا کیف پول شما بازمی‌گردد.
      </div>
    );
  }

  return (
    <div className="relative pt-1">
      <div className="absolute top-6 right-6 left-6 h-0.5 bg-border" aria-hidden />
      <div
        className="absolute top-6 right-6 h-0.5 bg-sage-dark transition-all"
        style={{ width: `calc((100% - 3rem) * ${currentIdx / (STEPS.length - 1)})` }}
        aria-hidden
      />
      <ol className="relative flex justify-between gap-1">
        {STEPS.map((step, i) => {
          const reached = i <= currentIdx;
          const stepDate = new Date(created.getTime() + step.offsetH * 3600 * 1000);
          const Icon = step.icon;
          return (
            <li key={step.key} className="flex flex-col items-center text-center flex-1 min-w-0">
              <span
                className={`grid place-items-center size-10 rounded-full border-2 shadow-sm ${
                  reached ? "bg-sage-dark text-white border-sage-dark" : "bg-white text-muted-foreground border-border"
                }`}
              >
                <Icon className="size-4" />
              </span>
              <span className={`mt-2 text-[11px] sm:text-xs font-bold whitespace-nowrap ${reached ? "text-charcoal" : "text-muted-foreground"}`}>
                {step.label}
              </span>
              <span className={`mt-1 text-[10px] rounded-full border px-1.5 py-0.5 whitespace-nowrap ${
                reached ? "bg-sage-soft text-sage-dark border-sage/40" : "bg-white text-muted-foreground border-border"
              }`}>
                {i === 0 ? faDateTime(created) : faDate(stepDate)}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="sr-only">{`وضعیت فعلی سفارش: ${STEPS[currentIdx]?.label ?? status}`}</p>
    </div>
  );
}
