"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  TrendingUp, ShoppingBag, Users, Package, Plus, Search, Pencil, Trash2,
  Minus, AlertTriangle, Crown, Image as ImageIcon, Boxes, Coins, Star,
  Upload, Loader2, CheckCircle2,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  ChartTip, ConfirmDialog, EmptyState, Field, PanelStat, SectionHeader, StatusBadge,
} from "@/components/panel/shared";
import { usePanel } from "@/components/panel/panel-context";
import { panelMutate } from "@/lib/panel-api";
import { useView } from "@/lib/panel-store";
import { CATEGORY_LABELS, type Product } from "@/lib/types";
import { faPrice, faNumber, faDecimal, faShortPrice, faRelative, faDate } from "@/lib/format";

const inputCls =
  "w-full rounded-2xl border border-input bg-white px-3.5 py-2.5 text-sm text-charcoal placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-blush transition-shadow";

const PIE_COLORS = ["#d4a574", "#7fa577", "#e8b4b8", "#8b7cc9", "#a8c5a0", "#c0392b"];

// ==================== Dashboard ====================
export function DashboardSection() {
  const { data } = usePanel();
  const setAdminSection = useSetAdminSection();
  const s = data.stats;

  const pieData = useMemo(
    () =>
      Object.entries(s.statusCounts)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => ({ name: k, value: v })),
    [s.statusCounts]
  );
  const STATUS_FA: Record<string, string> = {
    pending: "در انتظار", confirmed: "تأیید شده", preparing: "آماده‌سازی",
    shipped: "ارسال شده", delivered: "تحویل شده", cancelled: "لغو شده",
  };

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <PanelStat icon={<TrendingUp className="size-5" />} label="فروش امروز" value={faPrice(s.salesToday)} sub={`این ماه: ${faShortPrice(s.salesMonth)} تومان`} tone="gold" />
        <PanelStat icon={<ShoppingBag className="size-5" />} label="سفارش‌های امروز" value={faNumber(s.ordersToday)} sub={`این ماه: ${faNumber(s.ordersMonth)} سفارش`} tone="blush" />
        <PanelStat icon={<Users className="size-5" />} label="مشتریان" value={faNumber(s.customersCount)} sub={`میانگین سفارش: ${faShortPrice(s.avgOrderValue)}`} tone="sage" />
        <PanelStat icon={<Package className="size-5" />} label="محصولات فعال" value={faNumber(s.productsActive)} sub={`${faNumber(s.pendingOrders)} سفارش در انتظار`} tone="charcoal" />
      </div>

      {/* charts row */}
      <div className="grid xl:grid-cols-3 gap-5">
        {/* sales area chart */}
        <div className="xl:col-span-2 rounded-3xl bg-white border border-border p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="font-extrabold text-charcoal">روند فروش ۱۴ روز اخیر</h2>
            <span className="text-xs text-muted-foreground">مبالغ به تومان</span>
          </div>
          <div className="h-64" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={s.salesByDay} margin={{ top: 5, bottom: 0, left: 0, right: 8 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e8b4b8" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#e8b4b8" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ece3d8" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#7a716a" }} tickLine={false} axisLine={false} reversed />
                <YAxis
                  tick={{ fontSize: 10, fill: "#7a716a" }} tickLine={false} axisLine={false} width={48}
                  tickFormatter={(v: number) => faShortPrice(v)}
                />
                <Tooltip content={<ChartTip />} />
                <Area type="monotone" dataKey="total" name="total" stroke="#d9979d" strokeWidth={2.5} fill="url(#salesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* status donut */}
        <div className="rounded-3xl bg-white border border-border p-5">
          <h2 className="font-extrabold text-charcoal mb-2">وضعیت سفارش‌ها</h2>
          <div className="h-64" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}
                  stroke="none"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [faNumber(value), STATUS_FA[name] ?? name]}
                  contentStyle={{ borderRadius: 16, border: "1px solid #ece3d8", fontSize: 12, direction: "rtl" }}
                />
                <Legend
                  formatter={(value: string) => <span style={{ color: "#2c2c2c", fontSize: 12 }}>{STATUS_FA[value] ?? value}</span>}
                  iconType="circle" iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* recent orders + low stock */}
      <div className="grid xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 rounded-3xl bg-white border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-extrabold text-charcoal">آخرین سفارش‌ها</h2>
            <button onClick={() => setAdminSection("orders")} className="text-xs font-bold text-blush-dark hover:text-blush transition-colors">
              مدیریت سفارش‌ها
            </button>
          </div>
          <div className="space-y-2.5">
            {data.orders.slice(0, 5).map((o) => (
              <div key={o.id} className="flex items-center gap-3 rounded-2xl border border-border/70 p-3">
                <div className="flex -space-x-2 space-x-reverse shrink-0">
                  {o.items.slice(0, 2).map((it, i) => (
                     
                    <img key={i} src={it.image || "/images/roses-pink-1.jpg"} alt={it.name} className="size-10 rounded-xl object-cover border-2 border-white" />
                  ))}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-charcoal truncate">{o.customerName}</p>
                  <p className="text-[11px] text-muted-foreground">
                    <span className="font-mono" dir="ltr">{o.code}</span> — {faRelative(o.createdAt)}
                  </p>
                </div>
                <div className="text-left shrink-0 space-y-1">
                  <p className="text-sm font-extrabold text-charcoal">{faPrice(o.total)}</p>
                  <StatusBadge status={o.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          {/* low stock */}
          <div className="rounded-3xl bg-white border border-border p-5">
            <h2 className="font-extrabold text-charcoal mb-3 flex items-center gap-2">
              <AlertTriangle className="size-4 text-gold-dark" /> هشدار موجودی
            </h2>
            {s.lowStockProducts.length === 0 ? (
              <p className="text-xs text-muted-foreground">موجودی همه محصولات مناسب است.</p>
            ) : (
              <div className="space-y-2">
                {s.lowStockProducts.map((p) => (
                  <div key={p.id} className="flex items-center gap-2.5">
                    { }
                    <img src={p.image} alt={p.name} className="size-9 rounded-xl object-cover shrink-0" />
                    <p className="flex-1 text-xs font-bold text-charcoal truncate">{p.name}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0 ${
                      p.stock === 0 ? "bg-[#fbe4e3] text-[#c0392b]" : "bg-gold-soft text-gold-dark"
                    }`}>
                      {p.stock === 0 ? "ناموجود" : `${faNumber(p.stock)} عدد`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* top products */}
          <div className="rounded-3xl bg-white border border-border p-5">
            <h2 className="font-extrabold text-charcoal mb-3 flex items-center gap-2">
              <Crown className="size-4 text-gold-dark" /> پرفروش‌ترین‌ها
            </h2>
            <div className="space-y-2.5">
              {s.topProducts.map((p, i) => (
                <div key={p.id} className="flex items-center gap-2.5">
                  <span className={`grid place-items-center size-6 rounded-full text-[11px] font-extrabold shrink-0 ${
                    i === 0 ? "bg-gold text-white" : "bg-cream-dark text-charcoal"
                  }`}>{faNumber(i + 1)}</span>
                  { }
                  <img src={p.image || "/images/roses-pink-1.jpg"} alt={p.name} className="size-9 rounded-xl object-cover shrink-0" />
                  <p className="flex-1 text-xs font-bold text-charcoal truncate">{p.name}</p>
                  <span className="text-[11px] font-bold text-sage-dark shrink-0">{faNumber(p.qty)} فروش</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function useSetAdminSection() {
  return useView((s) => s.setAdminSection);
}

// ==================== Products ====================
const IMAGE_OPTIONS = [
  "/images/roses-pink-1.jpg", "/images/roses-pink-2.jpg", "/images/roses-pink-3.jpg",
  "/images/roses-red-1.jpg", "/images/roses-red-2.jpg",
  "/images/tulips-1.jpg", "/images/tulips-2.jpg",
  "/images/orchid-1.jpg", "/images/orchid-2.jpg",
  "/images/flowerbox-1.jpg", "/images/flowerbox-2.jpg",
  "/images/peony-1.jpg", "/images/peony-2.jpg",
  "/images/sunflower-1.jpg", "/images/sunflower-2.jpg",
  "/images/plant-1.jpg", "/images/plant-2.jpg",
  "/images/dried-1.jpg", "/images/dried-2.jpg",
  "/images/birthday-1.jpg", "/images/birthday-2.jpg",
  "/images/wedding-1.jpg", "/images/wedding-2.jpg",
];

const emptyProduct = {
  name: "", description: "", category: "bouquet", price: 0, oldPrice: null as number | null,
  image: IMAGE_OPTIONS[0], stock: 10, isBestseller: false, isNew: true, isActive: true,
};

// ==================== Image upload field ====================
function ProductImagePicker({
  value,
  onChange,
  onError,
}: {
  value: string;
  onChange: (url: string) => void;
  onError: (msg: string) => void;
}) {
  const [uploads, setUploads] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [justUploaded, setJustUploaded] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // load gallery once when the picker mounts (dialog opened)
  useEffect(() => {
    let cancelled = false;
    fetch("/api/upload", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json.success) setUploads(json.images ?? []);
      })
      .catch(() => {
        /* ignore */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /** Downscale + re-encode big photos in the browser (max 1600px, JPEG q85)
   *  so uploads stay small even for phone cameras and slow connections. */
  async function compressImage(file: File): Promise<File> {
    // keep small files and animated GIFs as-is
    if (file.size <= 400 * 1024) return file;
    if (file.type === "image/gif") return file;
    try {
      const bitmap = await createImageBitmap(file);
      const maxDim = 1600;
      const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
      if (scale >= 1 && file.size <= 1024 * 1024) {
        bitmap.close?.();
        return file;
      }
      const w = Math.max(1, Math.round(bitmap.width * scale));
      const h = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        bitmap.close?.();
        return file;
      }
      ctx.drawImage(bitmap, 0, 0, w, h);
      bitmap.close?.();
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/jpeg", 0.85)
      );
      if (!blob || blob.size >= file.size) return file;
      const name = file.name.replace(/\.[^.]+$/, "") || "photo";
      return new File([blob], `${name}.jpg`, { type: "image/jpeg" });
    } catch {
      return file; // decoding failed → send the original
    }
  }

  async function handleFile(rawFile: File) {
    onError("");
    if (!rawFile.type.startsWith("image/") && !/\.(jpe?g|png|webp|gif|avif)$/i.test(rawFile.name)) {
      onError("فایل انتخاب‌شده عکس نیست.");
      return;
    }
    if (rawFile.size > 25 * 1024 * 1024) {
      onError("حجم عکس خیلی زیاد است (بیش از ۲۵ مگابایت).");
      return;
    }
    setUploading(true);
    try {
      const file = await compressImage(rawFile);
      const fd = new FormData();
      fd.append("file", file, file.name || "photo.jpg");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      let json: { success?: boolean; url?: string; error?: string } | null = null;
      try {
        json = await res.json();
      } catch {
        // non-JSON response (proxy error page / 404 / 502)
        if (res.status === 404) {
          onError("سرویس آپلود در دسترس نیست — صفحه را با Ctrl+R رفرش کنید و دوباره تلاش کنید.");
        } else if (res.status === 413) {
          onError("عکس خیلی بزرگ است و سرور آن را نپذیرفت؛ عکس کوچک‌تری انتخاب کنید.");
        } else {
          onError(`سرور پاسخ غیرمنتظره داد (کد ${res.status}). دوباره تلاش کنید.`);
        }
        setUploading(false);
        if (fileRef.current) fileRef.current.value = "";
        return;
      }
      if (json?.success && json.url) {
        onChange(json.url);
        setJustUploaded(json.url);
        setUploads((prev) => [json!.url!, ...prev.filter((u) => u !== json!.url)]);
      } else {
        onError(json?.error ?? "آپلود ناموفق بود.");
      }
    } catch {
      onError("ارتباط با سرور قطع شد. اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.");
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  const isCustom = value.startsWith("/uploads/");

  return (
    <div className="space-y-3">
      {/* upload zone + current preview */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 rounded-full bg-blush text-charcoal px-5 py-2.5 text-xs font-extrabold hover:bg-blush-dark hover:text-white transition-colors disabled:opacity-60"
          aria-label="آپلود عکس از دستگاه"
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          {uploading ? "در حال آپلود..." : "آپلود عکس از گوشی/کامپیوتر"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
          }}
        />
        {value && (
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-cream/60 p-1.5 pl-3">
            <img src={value} alt="پیش‌نمایش عکس محصول" className="size-12 rounded-xl object-cover" />
            <span className="text-[11px] font-bold text-charcoal/70 max-w-36 truncate">
              عکس انتخاب‌شده {justUploaded === value && <CheckCircle2 className="inline size-3.5 text-sage-dark mr-0.5" />}
            </span>
          </div>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground">
        JPG، PNG، WebP یا GIF — حداکثر ۶ مگابایت. عکس مربعی (مثلاً ۸۰۰×۸۰۰) بهترین نمایش را دارد.
      </p>

      {/* post-upload guidance: image shows in shop only after saving the product */}
      {justUploaded && (
        <div className="flex items-start gap-2 rounded-2xl border border-sage/70 bg-sage/10 px-3.5 py-2.5">
          <CheckCircle2 className="size-4 text-sage-dark shrink-0 mt-0.5" />
          <p className="text-[11px] font-bold leading-5 text-charcoal/85">
            عکس آپلود شد و به‌عنوان عکس این محصول انتخاب شد. برای اینکه در دسته‌گل‌های فروشگاه نمایش داده شود، دکمه «ذخیره تغییرات» را بزنید.
          </p>
        </div>
      )}

      {/* my uploads gallery */}
      {uploads.length > 0 && (
        <div>
          <p className="text-xs font-bold text-charcoal/80 mb-1.5">گالری آپلودهای شما</p>
          <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
            {uploads.map((img) => (
              <button
                key={img}
                type="button"
                onClick={() => { onChange(img); setJustUploaded(null); }}
                className={`relative rounded-2xl overflow-hidden aspect-square transition-all ${
                  value === img ? "ring-2 ring-blush-dark ring-offset-2" : "opacity-70 hover:opacity-100"
                }`}
                aria-label={`انتخاب عکس آپلودشده ${img}`}
              >
                <img src={img} alt="" className="size-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* default gallery */}
      <div>
        <p className="text-xs font-bold text-charcoal/80 mb-1.5">
          یا از گالری آماده فروشگاه انتخاب کنید {isCustom && "(فعلاً عکس دلخواه شما انتخاب است)"}
        </p>
        <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-36 overflow-y-auto p-1">
          {IMAGE_OPTIONS.map((img) => (
            <button
              key={img}
              type="button"
              onClick={() => { onChange(img); setJustUploaded(null); }}
              className={`relative rounded-2xl overflow-hidden aspect-square transition-all ${
                value === img ? "ring-2 ring-blush-dark ring-offset-2" : "opacity-70 hover:opacity-100"
              }`}
              aria-label={`انتخاب تصویر ${img}`}
            >
              <img src={img} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProductsSection() {
  const { data, refresh, toast } = usePanel();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("all");
  const [form, setForm] = useState<(typeof emptyProduct & { id?: string }) | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    return data.products.filter((p) => {
      if (cat !== "all" && p.category !== cat) return false;
      if (query && !p.name.includes(query) && !p.description.includes(query)) return false;
      return true;
    });
  }, [data.products, query, cat]);

  async function save() {
    if (!form) return;
    if (!form.name.trim() || form.price <= 0) {
      toast("نام و قیمت محصول الزامی است.", true);
      return;
    }
    setSaving(true);
    const res = await panelMutate(form.id ? "product.update" : "product.create", {
      id: form.id,
      data: {
        name: form.name.trim(), description: form.description, category: form.category,
        price: form.price, oldPrice: form.oldPrice || null, image: form.image,
        stock: form.stock, isBestseller: form.isBestseller, isNew: form.isNew, isActive: form.isActive,
      },
    });
    setSaving(false);
    if (res.success) {
      toast(form.id ? "محصول ویرایش شد." : "محصول جدید اضافه شد.");
      setForm(null);
      await refresh();
    } else {
      toast(res.error ?? "خطا در ذخیره محصول", true);
    }
  }

  async function setStock(p: Product, delta: number) {
    const res = await panelMutate("product.setStock", { id: p.id, amount: Math.max(0, p.stock + delta) });
    if (res.success) await refresh();
  }

  return (
    <div>
      <SectionHeader
        title="مدیریت محصولات"
        desc={`${faNumber(data.products.length)} محصول در فروشگاه — جستجو، ویرایش و مدیریت موجودی`}
        action={
          <button
            onClick={() => setForm({ ...emptyProduct })}
            className="inline-flex items-center gap-1.5 rounded-full bg-charcoal text-white px-4 py-2 text-xs font-bold hover:bg-charcoal/85 transition-colors"
          >
            <Plus className="size-3.5" /> محصول جدید
          </button>
        }
      />

      {/* how-to hint: uploaded photo appears in shop only after saving the product */}
      <p className="mb-4 flex items-start gap-2 rounded-2xl border border-border bg-cream/70 px-4 py-3 text-[11px] font-bold leading-5 text-charcoal/75">
        <ImageIcon className="size-3.5 shrink-0 mt-0.5 text-gold" />
        <span>
          برای گذاشتن عکس خودتان روی هر دسته‌گل: روی «ویرایش» همان محصول کلیک کنید، عکس را آپلود کنید و سپس «ذخیره تغییرات» را بزنید؛ عکس بلافاصله در فروشگاه نمایش داده می‌شود. عکس‌های آپلودشده در «گالری آپلودهای شما» می‌مانند و قابل استفاده مجدد هستند.
        </span>
      </p>

      {/* toolbar */}
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            className={`${inputCls} pr-10`}
            placeholder="جستجوی محصول..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select className={`${inputCls} w-auto`} value={cat} onChange={(e) => setCat(e.target.value)} aria-label="فیلتر دسته‌بندی">
          <option value="all">همه دسته‌ها</option>
          {Object.entries(CATEGORY_LABELS).filter(([k]) => k !== "all").map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* table */}
      <div className="rounded-3xl bg-white border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="bg-cream/70 text-xs text-muted-foreground">
                <th className="text-right font-bold px-4 py-3">محصول</th>
                <th className="text-right font-bold px-4 py-3">دسته</th>
                <th className="text-right font-bold px-4 py-3">قیمت</th>
                <th className="text-center font-bold px-4 py-3">موجودی</th>
                <th className="text-center font-bold px-4 py-3">وضعیت</th>
                <th className="text-left font-bold px-4 py-3">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t border-border/60 hover:bg-cream/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      { }
                      <img src={p.image} alt={p.name} className="size-12 rounded-2xl object-cover shrink-0" />
                      <div className="min-w-0">
                        <p className="font-bold text-charcoal truncate max-w-[220px]">{p.name}</p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <Star className="size-3 fill-gold text-gold" /> {faDecimal(p.rating)} ({faNumber(p.reviews)})
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-cream-dark px-2.5 py-1 text-[11px] font-bold text-charcoal/80">
                      {CATEGORY_LABELS[p.category] ?? p.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-extrabold text-charcoal">{faPrice(p.price)}</p>
                    {p.oldPrice && <p className="text-[11px] text-muted-foreground line-through">{faPrice(p.oldPrice)}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setStock(p, 1)}
                        className="grid place-items-center size-7 rounded-lg bg-sage-soft text-sage-dark hover:bg-sage/50 transition-colors"
                        aria-label={`افزودن موجودی ${p.name}`}
                      >
                        <Plus className="size-3.5" />
                      </button>
                      <span className={`w-12 text-center text-xs font-extrabold ${
                        p.stock === 0 ? "text-[#c0392b]" : p.stock < 6 ? "text-gold-dark" : "text-charcoal"
                      }`}>
                        {faNumber(p.stock)}
                      </span>
                      <button
                        onClick={() => setStock(p, -1)}
                        className="grid place-items-center size-7 rounded-lg bg-blush-soft text-blush-dark hover:bg-blush/50 transition-colors"
                        aria-label={`کاهش موجودی ${p.name}`}
                      >
                        <Minus className="size-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-center gap-1">
                      {p.isBestseller && <span className="rounded-full bg-gold-soft text-gold-dark text-[10px] font-bold px-2 py-0.5">پرفروش</span>}
                      {p.isNew && <span className="rounded-full bg-sage-soft text-sage-dark text-[10px] font-bold px-2 py-0.5">جدید</span>}
                      {!p.isActive && <span className="rounded-full bg-[#fbe4e3] text-[#c0392b] text-[10px] font-bold px-2 py-0.5">غیرفعال</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => setForm({
                          id: p.id, name: p.name, description: p.description, category: p.category,
                          price: p.price, oldPrice: p.oldPrice, image: p.image, stock: p.stock,
                          isBestseller: p.isBestseller, isNew: p.isNew, isActive: p.isActive,
                        })}
                        className="grid place-items-center size-8 rounded-full text-muted-foreground hover:bg-cream-dark transition-colors"
                        aria-label={`ویرایش ${p.name}`}
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(p)}
                        className="grid place-items-center size-8 rounded-full text-muted-foreground hover:bg-[#fbe4e3] hover:text-[#c0392b] transition-colors"
                        aria-label={`حذف ${p.name}`}
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
            <EmptyState icon={<Package className="size-7" />} title="محصولی یافت نشد" desc="عبارت جستجو یا فیلتر دسته‌بندی را تغییر دهید." />
          </div>
        )}
      </div>

      {/* product dialog */}
      <Dialog open={!!form} onOpenChange={(v) => !v && setForm(null)}>
        <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto rounded-3xl" aria-describedby="product-form-desc">
          <DialogHeader>
            <DialogTitle className="text-right text-charcoal">{form?.id ? "ویرایش محصول" : "افزودن محصول جدید"}</DialogTitle>
            <DialogDescription id="product-form-desc" className="text-right">
              اطلاعات کامل محصول شامل تصویر، قیمت و موجودی را وارد کنید.
            </DialogDescription>
          </DialogHeader>
          {form && (
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="نام محصول" required>
                <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Field>
              <Field label="دسته‌بندی" required>
                <select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {Object.entries(CATEGORY_LABELS).filter(([k]) => k !== "all").map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="توضیحات">
                  <textarea className={`${inputCls} min-h-24 resize-none`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </Field>
              </div>
              <Field label="قیمت (تومان)" required>
                <input className={inputCls} dir="ltr" inputMode="numeric" value={form.price || ""} onChange={(e) => setForm({ ...form, price: Number(e.target.value.replace(/\D/g, "")) })} />
              </Field>
              <Field label="قیمت قبل از تخفیف">
                <input className={inputCls} dir="ltr" inputMode="numeric" value={form.oldPrice || ""} onChange={(e) => setForm({ ...form, oldPrice: e.target.value ? Number(e.target.value.replace(/\D/g, "")) : null })} />
              </Field>
              <Field label="موجودی انبار">
                <input className={inputCls} dir="ltr" inputMode="numeric" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value.replace(/\D/g, "")) })} />
              </Field>
              <div className="flex items-end gap-4 pb-1">
                <label className="flex items-center gap-2 text-sm text-charcoal cursor-pointer">
                  <input type="checkbox" checked={form.isBestseller} onChange={(e) => setForm({ ...form, isBestseller: e.target.checked })} className="size-4 accent-[#e8b4b8]" />
                  پرفروش
                </label>
                <label className="flex items-center gap-2 text-sm text-charcoal cursor-pointer">
                  <input type="checkbox" checked={form.isNew} onChange={(e) => setForm({ ...form, isNew: e.target.checked })} className="size-4 accent-[#e8b4b8]" />
                  جدید
                </label>
                <label className="flex items-center gap-2 text-sm text-charcoal cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="size-4 accent-[#e8b4b8]" />
                  فعال
                </label>
              </div>
              <div className="sm:col-span-2">
                <span className="block text-xs font-semibold text-charcoal/80 mb-2 flex items-center gap-1">
                  <ImageIcon className="size-3.5" /> تصویر محصول
                </span>
                <ProductImagePicker
                  value={form.image}
                  onChange={(url) => setForm((f) => (f ? { ...f, image: url } : f))}
                  onError={(msg) => {
                    if (msg) toast(msg, true);
                  }}
                />
              </div>
              <div className="sm:col-span-2 flex gap-2 pt-1">
                <button onClick={save} disabled={saving} className="flex-1 rounded-full bg-charcoal text-white py-2.5 text-sm font-bold hover:bg-charcoal/85 transition-colors disabled:opacity-60">
                  {saving ? "در حال ذخیره..." : form.id ? "ذخیره تغییرات" : "افزودن محصول"}
                </button>
                <button onClick={() => setForm(null)} className="rounded-full bg-cream-dark text-charcoal px-6 py-2.5 text-sm font-bold hover:bg-border transition-colors">
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
        title="حذف محصول"
        message={`محصول «${deleteTarget?.name ?? ""}» برای همیشه حذف می‌شود. مطمئن هستید؟`}
        onConfirm={async () => {
          if (!deleteTarget) return;
          const res = await panelMutate("product.delete", { id: deleteTarget.id });
          if (res.success) { toast("محصول حذف شد."); await refresh(); }
        }}
      />
    </div>
  );
}

// ==================== Categories ====================
export function CategoriesSection() {
  const { data } = usePanel();
  const setAdminSection = useSetAdminSection();

  return (
    <div>
      <SectionHeader title="دسته‌بندی‌ها" desc="نمای آماری دسته‌های فروشگاه و محصولات هر دسته." />
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {data.stats.categoryStats.map((c) => {
          const products = data.products.filter((p) => p.category === c.category);
          return (
            <div key={c.category} className="rounded-3xl bg-white border border-border p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-charcoal">{CATEGORY_LABELS[c.category] ?? c.category}</h3>
                <span className="grid place-items-center size-10 rounded-2xl bg-blush-soft text-blush-dark">
                  <Boxes className="size-5" />
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-cream/70 p-3">
                  <p className="text-[11px] text-muted-foreground">تعداد محصول</p>
                  <p className="font-extrabold text-charcoal mt-0.5">{faNumber(c.count)}</p>
                </div>
                <div className="rounded-2xl bg-cream/70 p-3">
                  <p className="text-[11px] text-muted-foreground">ارزش موجودی</p>
                  <p className="font-extrabold text-charcoal mt-0.5">{faShortPrice(c.value)}</p>
                </div>
                <div className="rounded-2xl bg-cream/70 p-3">
                  <p className="text-[11px] text-muted-foreground">میانگین قیمت</p>
                  <p className="font-extrabold text-charcoal mt-0.5">{faShortPrice(c.avg)}</p>
                </div>
                <div className="rounded-2xl bg-cream/70 p-3">
                  <p className="text-[11px] text-muted-foreground">فروش ثبت‌شده</p>
                  <p className="font-extrabold text-charcoal mt-0.5">{faNumber(c.sold)} عدد</p>
                </div>
              </div>
              <button
                onClick={() => setAdminSection("products")}
                className="mt-4 w-full rounded-full bg-cream-dark py-2 text-xs font-bold text-charcoal hover:bg-border transition-colors"
              >
                مدیریت محصولات این دسته
              </button>
              <div className="mt-3 flex gap-1.5">
                {products.slice(0, 5).map((p) => (
                   
                  <img key={p.id} src={p.image} alt={p.name} title={p.name} className="size-9 rounded-xl object-cover" />
                ))}
                {products.length > 5 && (
                  <span className="grid place-items-center size-9 rounded-xl bg-cream-dark text-[10px] font-bold text-charcoal">
                    +{faNumber(products.length - 5)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-5 flex items-start gap-2 rounded-2xl bg-sage-soft/50 border border-sage/30 p-4 text-xs text-charcoal/75 leading-6">
        <Coins className="size-4 text-sage-dark shrink-0 mt-0.5" />
        دسته‌بندی‌ها بر اساس فیلد دسته محصولات محاسبه می‌شوند. برای افزودن محصول به دسته جدید، هنگام ساخت محصول دسته موردنظر را انتخاب کنید.
      </div>
    </div>
  );
}


