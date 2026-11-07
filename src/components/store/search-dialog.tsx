"use client";

import { useEffect, useRef, useState } from "react";
import { Search, ShoppingBag, Loader2, Flower2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useCart } from "@/lib/cart-store";
import { faNumber, faDecimal } from "@/lib/format";
import { CATEGORY_LABELS, type Product } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export default function SearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const addItem = useCart((s) => s.addItem);
  const { toast } = useToast();

  // debounce search
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      const q = query.trim();
      if (!q) {
        setResults([]);
        setSearched(false);
        setLoading(false);
        return;
      }
      setLoading(true);
      fetch(`/api/products?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((d) => {
          setResults(d.products ?? []);
          setSearched(true);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [query, open]);

  // reset + focus when opening
  function handleOpenChange(v: boolean) {
    if (v) {
      setQuery("");
      setResults([]);
      setSearched(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
    onOpenChange(v);
  }

  function handleAdd(p: Product) {
    addItem({ id: p.id, name: p.name, price: p.price, image: p.image });
    toast({
      title: "به سبد خرید اضافه شد",
      description: `${p.name} اکنون در سبد شماست.`,
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-xl p-0 rounded-3xl bg-cream overflow-hidden top-[15%] translate-y-0"
        aria-describedby={undefined}
      >
        <DialogHeader className="px-5 pt-5 pb-0 space-y-1">
          <DialogTitle className="text-right flex items-center gap-2 text-charcoal">
            <Search className="size-5 text-gold-dark" />
            جستجو در گلستان
          </DialogTitle>
          <DialogDescription className="text-right text-xs leading-6">
            نام گل، دسته‌بندی یا هر کلمه‌ای که به‌دنبالش هستید را بنویسید؛ مثلاً «رز» یا «لاله».
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 pt-3">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="مثلاً رز صورتی، لاله، باکس گل..."
              className="w-full h-12 rounded-2xl bg-white border border-border pr-11 pl-4 text-sm text-charcoal placeholder:text-muted-foreground/70 outline-none focus:ring-2 focus:ring-blush"
              aria-label="عبارت جستجو"
            />
          </div>
        </div>

        <div className="max-h-[50vh] overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="py-10 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-5 animate-spin text-blush-dark" />
              در حال جستجو...
            </div>
          ) : !query.trim() ? (
            <div className="py-8 text-center space-y-3">
              <span className="grid place-items-center size-14 mx-auto rounded-full bg-blush-soft text-blush-dark">
                <Flower2 className="size-7" />
              </span>
              <p className="text-sm text-muted-foreground">
                دنبال گلی خاص هستید؟ همین‌جا بنویسیدش.
              </p>
            </div>
          ) : searched && results.length === 0 ? (
            <div className="py-8 text-center space-y-3">
              <span className="grid place-items-center size-14 mx-auto rounded-full bg-cream-dark text-muted-foreground">
                <Search className="size-6" />
              </span>
              <p className="text-sm text-muted-foreground leading-6">
                چیزی برای «{query}» پیدا نشد.
                <br />
                عبارت دیگری را امتحان کنید.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {results.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 bg-white rounded-2xl p-2.5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <img
                    src={p.image}
                    alt={p.name}
                    className="size-14 rounded-xl object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-charcoal truncate">{p.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-semibold text-sage-dark bg-sage-soft px-2 py-0.5 rounded-full">
                        {CATEGORY_LABELS[p.category] ?? p.category}
                      </span>
                      <span className="text-[11px] text-gold-dark flex items-center gap-0.5">
                        ★ {faDecimal(p.rating)}
                      </span>
                    </div>
                    <p className="text-xs font-extrabold text-gold-dark mt-1">
                      {faNumber(p.price)} تومان
                    </p>
                  </div>
                  <button
                    onClick={() => handleAdd(p)}
                    className="grid place-items-center size-9 rounded-full bg-blush text-charcoal hover:bg-charcoal hover:text-white transition-colors shrink-0"
                    aria-label={`افزودن ${p.name} به سبد`}
                  >
                    <Plus className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
