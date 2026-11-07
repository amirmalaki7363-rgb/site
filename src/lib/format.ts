export function faNumber(n: number): string {
  return new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 0 }).format(n);
}

export function faPrice(n: number): string {
  return `${faNumber(n)} تومان`;
}

export function faDecimal(n: number): string {
  return new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 1 }).format(n);
}

export function faShortPrice(n: number): string {
  if (n >= 1000000) {
    const m = n / 1000000;
    return `${new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 1 }).format(m)} م`;
  }
  if (n >= 1000) {
    const k = n / 1000;
    return `${new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 0 }).format(k)} هـ`;
  }
  return faNumber(n);
}

export function faDate(d: Date | string): string {
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(d));
}

export function faDateTime(d: Date | string): string {
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));
}

export function faDayMonth(d: Date | string): string {
  return new Intl.DateTimeFormat("fa-IR", {
    month: "numeric",
    day: "numeric",
  }).format(new Date(d));
}

export function faWeekday(d: Date | string): string {
  return new Intl.DateTimeFormat("fa-IR", { weekday: "long" }).format(new Date(d));
}

export function faRelative(d: Date | string): string {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "همین حالا";
  if (mins < 60) return `${faNumber(mins)} دقیقه پیش`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${faNumber(hours)} ساعت پیش`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${faNumber(days)} روز پیش`;
  return faDate(d);
}

export function toEnDigits(s: string): string {
  return s.replace(/[۰-۹]/g, (c) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(c)));
}
