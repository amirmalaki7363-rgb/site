"use client";

import { Heart, Trash2, ShoppingBag } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/lib/wishlist-store";
import { useCart } from "@/lib/cart-store";
import { faNumber } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";

export default function WishlistDrawer() {
  const isOpen = useWishlist((s) => s.isOpen);
  const closeWishlist = useWishlist((s) => s.closeWishlist);
  const items = useWishlist((s) => s.items);
  const remove = useWishlist((s) => s.remove);
  const addItem = useCart((s) => s.addItem);
  const openCart = useCart((s) => s.openCart);
  const { toast } = useToast();

  function handleAddToCart(id: string) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    addItem({ id: item.id, name: item.name, price: item.price, image: item.image });
    toast({
      title: "به سبد خرید اضافه شد",
      description: `${item.name} اکنون در سبد شماست.`,
    });
  }

  return (
    <Sheet open={isOpen} onOpenChange={(v) => !v && closeWishlist()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col bg-cream" aria-describedby={undefined}>
        <SheetHeader className="px-5 py-4 bg-white border-b border-border flex-row items-center justify-between space-y-0">
          <SheetTitle className="flex items-center gap-2 text-charcoal">
            <Heart className="size-5 fill-blush-dark text-blush-dark" />
            علاقه‌مندی‌های من
            {items.length > 0 && (
              <span className="text-[10px] font-bold bg-blush-soft text-charcoal px-2 py-0.5 rounded-full">
                {faNumber(items.length)} گل
              </span>
            )}
          </SheetTitle>
          <button
            onClick={closeWishlist}
            className="grid place-items-center size-8 rounded-full hover:bg-blush-soft transition-colors"
            aria-label="بستن علاقه‌مندی‌ها"
          >
            <span className="text-lg leading-none">×</span>
          </button>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
            <span className="grid place-items-center size-20 rounded-full bg-blush-soft text-blush-dark">
              <Heart className="size-10" />
            </span>
            <h3 className="font-bold text-lg text-charcoal">لیست علاقه‌مندی خالی است</h3>
            <p className="text-sm text-muted-foreground leading-7">
              با زدن قلب روی هر گل، آن را برای بعد ذخیره کنید تا یادتان نرود!
            </p>
            <Button
              onClick={closeWishlist}
              className="rounded-full bg-blush text-charcoal hover:bg-blush-dark hover:text-white"
            >
              گشتن در گلستان
            </Button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex gap-3 bg-white rounded-2xl p-3 shadow-sm items-center"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="size-16 rounded-xl object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-charcoal truncate">{item.name}</p>
                  <p className="text-xs text-gold-dark font-bold mt-0.5">
                    {faNumber(item.price)} تومان
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      size="sm"
                      onClick={() => handleAddToCart(item.id)}
                      className="h-8 rounded-full bg-blush text-charcoal hover:bg-charcoal hover:text-white text-[11px] font-bold gap-1.5 px-3"
                    >
                      <ShoppingBag className="size-3.5" />
                      افزودن به سبد
                    </Button>
                    <button
                      onClick={() => remove(item.id)}
                      className="grid place-items-center size-8 rounded-lg text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors"
                      aria-label={`حذف ${item.name} از علاقه‌مندی‌ها`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
