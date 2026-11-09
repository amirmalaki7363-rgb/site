"use client";

import { useEffect, useState } from "react";
import { Star, ShoppingBag, Eye, BadgePercent, Flower2, Heart, Plus, Minus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/lib/cart-store";
import { useWishlist } from "@/lib/wishlist-store";
import { faNumber, faDecimal } from "@/lib/format";
import { SIZE_OPTIONS } from "@/lib/shop-options";
import { CATEGORY_LABELS, type Product } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const FILTERS = ["all", "bouquet", "box", "plant", "seasonal", "dried"];

/** شرایط اعلام‌شده برای تازگی تضمینی (متن تاییدشده توسط فروشگاه) */
const FRESHNESS_CONDITIONS = [
  "حتما گل باید در جای خنک باشد.",
  "گل اگر در اسفنج هست هر روز باید به اسفنج آب داده بشود و اگه دسته گل هست و گل در آب مستقیم هست هر روز باید آب گل تعویض بشود و آب گل خنک باشد.",
  "حتما هر روز یه سانت از انتهای شاخه‌ی گل بریده بشود.",
];

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-1 text-gold-dark" aria-label={`امتیاز ${faDecimal(rating)} از ۵`}>
      <Star className="size-4 fill-gold text-gold" />
      <span className="text-xs font-bold">{faDecimal(rating)}</span>
    </span>
  );
}

function HeartButton({ product, size = "size-9" }: { product: Product; size?: string }) {
  const toggle = useWishlist((s) => s.toggle);
  const isFav = useWishlist((s) => s.items.some((i) => i.id === product.id));
  const { toast } = useToast();

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        const added = toggle({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
        });
        toast({
          title: added ? "به علاقه‌مندی‌ها اضافه شد" : "از علاقه‌مندی‌ها حذف شد",
          description: added ? `${product.name} به لیست علاقه‌مندی‌های شما اضافه شد.` : `${product.name} از لیست علاقه‌مندی‌ها برداشته شد.`,
        });
      }}
      className={`grid place-items-center ${size} rounded-full backdrop-blur shadow transition-all bg-white/90 text-charcoal hover:bg-white hover:scale-110 ${
        isFav ? "text-blush-dark" : ""
      }`}
      aria-label={isFav ? `حذف ${product.name} از علاقه‌مندی‌ها` : `افزودن ${product.name} به علاقه‌مندی‌ها`}
      aria-pressed={isFav}
    >
      <Heart className={`size-4 ${isFav ? "fill-blush-dark" : ""}`} />
    </button>
  );
}

export default function Products() {
  const [active, setActive] = useState("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickView, setQuickView] = useState<Product | null>(null);
  const [size, setSize] = useState("classic");
  const [qty, setQty] = useState(1);
  const addItem = useCart((s) => s.addItem);
  const openCart = useCart((s) => s.openCart);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/products?category=${active}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setProducts(d.products ?? []);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setProducts([]);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [active]);

  // category filter events from Categories section
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail) {
        setActive(detail);
        setLoading(true);
      }
    };
    window.addEventListener("gh:filter-category", handler);
    return () => window.removeEventListener("gh:filter-category", handler);
  }, []);

  // open full detail (from search results)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<Product>).detail;
      if (detail) {
        setQuickView(detail);
        setSize("classic");
        setQty(1);
      }
    };
    window.addEventListener("gh:open-product", handler);
    return () => window.removeEventListener("gh:open-product", handler);
  }, []);

  function changeFilter(f: string) {
    if (f === active) return;
    setLoading(true);
    setActive(f);
  }

  function openDetail(p: Product) {
    setSize("classic");
    setQty(1);
    setQuickView(p);
  }

  function handleAdd(p: Product, opts?: { size?: string; qty?: number; openDrawer?: boolean }) {
    const sizeOpt = SIZE_OPTIONS.find((s) => s.id === opts?.size) ?? SIZE_OPTIONS[0];
    const quantity = opts?.qty ?? 1;
    const finalPrice = Math.round((p.price * sizeOpt.multiplier) / 1000) * 1000;
    addItem(
      {
        id: opts?.size && opts.size !== "classic" ? `${p.id}-${opts.size}` : p.id,
        name: sizeOpt.id === "classic" ? p.name : `${p.name} (${sizeOpt.label})`,
        price: finalPrice,
        image: p.image,
      },
      quantity
    );
    toast({
      title: "به سبد خرید اضافه شد",
      description: `${p.name} اکنون در سبد شماست.`,
    });
    if (opts?.openDrawer) openCart();
  }

  const quickViewPrice = quickView
    ? Math.round((quickView.price * (SIZE_OPTIONS.find((s) => s.id === size)?.multiplier ?? 1)) / 1000) * 1000
    : 0;

  return (
    <section id="products" className="py-16 md:py-24 px-4 bg-white scroll-mt-16">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-xs font-bold tracking-widest text-sage-dark bg-sage-soft px-4 py-1.5 rounded-full inline-block">
            گلستان محصولات
          </span>
          <h2 className="mt-4 text-2xl md:text-4xl font-extrabold text-charcoal">
            گل‌های تازه و محبوب مشتریان
          </h2>
          <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-2xl mx-auto leading-7">
            هر بوت با دست چیده و همان روز ارسال می‌شود؛ اگر به هر دلیل از کیفیت
            گل راضی نبودید، تا ۷ روز امکان بازگشت دارید. با توجه به شرایط زیر:
          </p>
          <ol className="mt-4 max-w-2xl mx-auto space-y-2 text-right">
            {FRESHNESS_CONDITIONS.map((c, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 text-xs md:text-sm text-muted-foreground leading-6"
              >
                <span
                  aria-hidden="true"
                  className="shrink-0 grid place-items-center size-5 md:size-6 rounded-full bg-blush-soft text-blush-dark text-[10px] md:text-xs font-extrabold mt-0.5"
                >
                  {faNumber(i + 1)}
                </span>
                <span>{c}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* filters */}
        <div
          className="flex flex-wrap justify-center gap-2 mb-10"
          role="tablist"
          aria-label="فیلتر دسته‌بندی محصولات"
        >
          {FILTERS.map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={active === f}
              onClick={() => changeFilter(f)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                active === f
                  ? "bg-charcoal text-white shadow-lg shadow-charcoal/20 scale-105"
                  : "bg-cream text-charcoal/70 hover:bg-blush-soft hover:text-charcoal"
              }`}
            >
              {CATEGORY_LABELS[f]}
            </button>
          ))}
        </div>

        {/* grid */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-3xl overflow-hidden bg-cream">
                <div className="aspect-square bg-cream-dark animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-4 w-3/4 bg-cream-dark rounded-full animate-pulse" />
                  <div className="h-4 w-1/2 bg-cream-dark rounded-full animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Flower2 className="size-12 mx-auto mb-3 text-blush" />
            محصولی در این دسته یافت نشد.
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((p) => (
              <article
                key={p.id}
                className="group bg-cream rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col"
              >
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={p.image}
                    alt={p.name}
                    width={400}
                    height={400}
                    decoding="async"
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute top-3 right-3 flex flex-col gap-1.5">
                    {p.isBestseller && (
                      <Badge className="bg-gold hover:bg-gold text-white text-[10px] font-bold rounded-full px-2.5 shadow">
                        پرفروش
                      </Badge>
                    )}
                    {p.isNew && (
                      <Badge className="bg-sage hover:bg-sage text-charcoal text-[10px] font-bold rounded-full px-2.5 shadow">
                        جدید
                      </Badge>
                    )}
                    {p.oldPrice && (
                      <Badge className="bg-blush-dark hover:bg-blush-dark text-white text-[10px] font-bold rounded-full px-2.5 shadow flex items-center gap-1">
                        <BadgePercent className="size-3" />
                        {faNumber(Math.round((1 - p.price / p.oldPrice) * 100))}٪
                      </Badge>
                    )}
                  </div>

                  {/* wishlist + quick view actions */}
                  <div className="absolute bottom-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity sm:opacity-100">
                    <HeartButton product={p} />
                    <button
                      onClick={() => openDetail(p)}
                      className="grid place-items-center size-9 rounded-full bg-white/90 backdrop-blur text-charcoal shadow hover:bg-white hover:scale-110 transition-all"
                      aria-label={`مشاهده جزئیات ${p.name}`}
                    >
                      <Eye className="size-4" />
                    </button>
                  </div>
                </div>

                <div className="p-3.5 md:p-5 flex flex-col gap-2 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold text-sage-dark bg-sage-soft px-2 py-0.5 rounded-full">
                      {CATEGORY_LABELS[p.category] ?? p.category}
                    </span>
                    {p.reviews > 0 ? <Stars rating={p.rating} /> : <span />}
                  </div>
                  <h3 className="font-bold text-sm md:text-base text-charcoal leading-6">
                    <a
                      href={`/product/${p.slug}`}
                      onClick={(e) => { e.preventDefault(); openDetail(p); }}
                      className="hover:text-blush-dark"
                    >
                      {p.name}
                    </a>
                  </h3>
                  <div className="mt-auto flex items-end justify-between gap-2 pt-1">
                    <div>
                      {p.oldPrice && (
                        <p className="text-[11px] text-muted-foreground line-through">
                          {faNumber(p.oldPrice)}
                        </p>
                      )}
                      <p className="font-extrabold text-sm md:text-base text-gold-dark whitespace-nowrap">
                        {faNumber(p.price)}
                        <span className="text-[10px] font-medium text-muted-foreground"> تومان</span>
                      </p>
                    </div>
                    <button
                      onClick={() => handleAdd(p)}
                      className="grid place-items-center size-9 md:size-10 rounded-full bg-blush text-charcoal hover:bg-charcoal hover:text-white transition-colors shadow-md shadow-blush/40 shrink-0"
                      aria-label={`افزودن ${p.name} به سبد خرید`}
                    >
                      <ShoppingBag className="size-4 md:size-5" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* full product detail dialog */}
      <Dialog open={!!quickView} onOpenChange={(v) => !v && setQuickView(null)}>
        <DialogContent
          aria-describedby={undefined}
          className="max-w-3xl p-0 overflow-hidden bg-cream rounded-3xl"
        >
          {quickView && (
            <div className="grid sm:grid-cols-2 max-h-[85vh] overflow-y-auto">
              <div className="relative aspect-square sm:aspect-auto sm:min-h-full">
                <img
                  src={quickView.image}
                  alt={quickView.name}
                  className="size-full object-cover sm:absolute sm:inset-0"
                />
                <div className="absolute top-3 left-3 sm:hidden">
                  <HeartButton product={quickView} />
                </div>
              </div>
              <div className="p-6 flex flex-col gap-3.5">
                <DialogHeader className="text-right space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-sage-dark bg-sage-soft px-2 py-0.5 rounded-full">
                      {CATEGORY_LABELS[quickView.category] ?? quickView.category}
                    </span>
                    {quickView.reviews > 0 && (
                      <>
                        <Stars rating={quickView.rating} />
                        <span className="text-[11px] text-muted-foreground">
                          ({faNumber(quickView.reviews)} دیدگاه)
                        </span>
                      </>
                    )}
                    <span className="mr-auto hidden sm:block">
                      <HeartButton product={quickView} />
                    </span>
                  </div>
                  <DialogTitle className="text-xl font-extrabold text-charcoal text-right">
                    {quickView.name}
                  </DialogTitle>
                  <DialogDescription className="text-sm leading-7 text-charcoal/70 text-right">
                    {quickView.description}
                  </DialogDescription>
                </DialogHeader>

                {/* size selection */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-charcoal">اندازه دسته‌گل:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {SIZE_OPTIONS.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setSize(s.id)}
                        className={`rounded-2xl border-2 p-2.5 text-right transition-all ${
                          size === s.id
                            ? "border-blush-dark bg-blush-soft/60"
                            : "border-border bg-white hover:border-blush"
                        }`}
                        aria-pressed={size === s.id}
                      >
                        <span className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-charcoal">{s.label}</span>
                          {size === s.id && <Check className="size-3.5 text-blush-dark" />}
                        </span>
                        <span className="block text-[10px] text-muted-foreground leading-4 mt-1">
                          {s.desc}
                        </span>
                        <span className="block text-[10px] font-bold text-gold-dark mt-1">
                          ×{faDecimal(s.multiplier)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* quantity */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-charcoal">تعداد:</span>
                  <div className="flex items-center gap-2 bg-white rounded-full border border-border p-1">
                    <button
                      onClick={() => setQty((q) => Math.min(q + 1, 20))}
                      className="grid place-items-center size-8 rounded-full bg-blush-soft hover:bg-blush transition-colors"
                      aria-label="افزایش تعداد"
                    >
                      <Plus className="size-4" />
                    </button>
                    <span className="w-8 text-center text-sm font-extrabold">{faNumber(qty)}</span>
                    <button
                      onClick={() => setQty((q) => Math.max(q - 1, 1))}
                      className="grid place-items-center size-8 rounded-full bg-blush-soft hover:bg-blush transition-colors"
                      aria-label="کاهش تعداد"
                    >
                      <Minus className="size-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-auto space-y-3">
                  <div className="flex items-end gap-2">
                    {quickView.oldPrice && size === "classic" && qty === 1 && (
                      <span className="text-sm text-muted-foreground line-through">
                        {faNumber(quickView.oldPrice)} تومان
                      </span>
                    )}
                    <span className="text-2xl font-extrabold text-gold-dark">
                      {faNumber(quickViewPrice * qty)}
                      <span className="text-xs font-medium text-muted-foreground"> تومان</span>
                    </span>
                  </div>
                  <Button
                    onClick={() => {
                      handleAdd(quickView, { size, qty, openDrawer: true });
                      setQuickView(null);
                    }}
                    className="w-full rounded-full bg-blush text-charcoal hover:bg-blush-dark hover:text-white font-bold h-11"
                  >
                    <ShoppingBag className="size-5" />
                    افزودن به سبد خرید
                  </Button>
                  <p className="text-[11px] text-muted-foreground leading-5">
                    تحویل در محل انتخابی شما، بسته‌بندی هدیه رایگان و کارت تبریک دست‌نویس
                    همراه سفارش شماست.
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </section>
  );
}
