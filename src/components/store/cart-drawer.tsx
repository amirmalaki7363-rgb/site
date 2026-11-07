"use client";

import { X, Plus, Minus, Trash2, ShoppingBag, ArrowLeft } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart, cartTotalPrice } from "@/lib/cart-store";
import { faNumber } from "@/lib/format";

export default function CartDrawer() {
  const isOpen = useCart((s) => s.isOpen);
  const closeCart = useCart((s) => s.closeCart);
  const openCheckout = useCart((s) => s.openCheckout);
  const items = useCart((s) => s.items);
  const increment = useCart((s) => s.increment);
  const decrement = useCart((s) => s.decrement);
  const removeItem = useCart((s) => s.removeItem);

  const total = cartTotalPrice(items);
  // هزینه تحویل با اسنپ همیشه به عهده مشتری است (مطابق مبلغ واقعی سمت سرور)
  const shipping = items.length === 0 ? 0 : 89_000;

  return (
    <Sheet open={isOpen} onOpenChange={(v) => !v && closeCart()}>
      <SheetContent
        side="left"
        className="w-full sm:max-w-md p-0 flex flex-col bg-cream"
        aria-describedby={undefined}
      >
        <SheetHeader className="px-5 py-4 bg-white border-b border-border flex-row items-center justify-between space-y-0">
          <SheetTitle className="flex items-center gap-2 text-charcoal">
            <ShoppingBag className="size-5 text-blush-dark" />
            سبد خرید شما
            {items.length > 0 && (
              <span className="text-[10px] font-bold bg-blush-soft text-charcoal px-2 py-0.5 rounded-full">
                {faNumber(items.length)} قلم
              </span>
            )}
          </SheetTitle>
          <button
            onClick={closeCart}
            className="grid place-items-center size-8 rounded-full hover:bg-blush-soft transition-colors"
            aria-label="بستن سبد خرید"
          >
            <X className="size-4" />
          </button>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
            <span className="grid place-items-center size-20 rounded-full bg-blush-soft text-blush-dark">
              <ShoppingBag className="size-10" />
            </span>
            <h3 className="font-bold text-lg text-charcoal">سبد خرید شما خالی است</h3>
            <p className="text-sm text-muted-foreground leading-7">
              هنوز گلی انتخاب نکرده‌اید! از میان دسته‌گل‌های تازه و باکس‌های لوکس ما انتخاب کنید.
            </p>
            <Button
              onClick={closeCart}
              className="rounded-full bg-blush text-charcoal hover:bg-blush-dark hover:text-white"
            >
              مشاهده محصولات
            </Button>
          </div>
        ) : (
          <>
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
                      <button
                        onClick={() => increment(item.id)}
                        className="grid place-items-center size-7 rounded-lg bg-blush-soft hover:bg-blush transition-colors"
                        aria-label={`افزودن یک عدد به ${item.name}`}
                      >
                        <Plus className="size-3.5" />
                      </button>
                      <span className="text-sm font-bold w-6 text-center">
                        {faNumber(item.qty)}
                      </span>
                      <button
                        onClick={() => decrement(item.id)}
                        className="grid place-items-center size-7 rounded-lg bg-blush-soft hover:bg-blush transition-colors"
                        aria-label={`کاهش یک عدد از ${item.name}`}
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="grid place-items-center size-7 rounded-lg mr-auto text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors"
                        aria-label={`حذف ${item.name} از سبد`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white border-t border-border px-5 py-4 space-y-3">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>جمع کالاها</span>
                  <span>{faNumber(total)} تومان</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>هزینه ارسال با اسنپ</span>
                  <span>{shipping === 0 ? "—" : `${faNumber(shipping)} تومان`}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-extrabold text-charcoal">
                  <span>مبلغ نهایی</span>
                  <span>{faNumber(total + shipping)} تومان</span>
                </div>
              </div>

              <Button
                onClick={openCheckout}
                className="w-full rounded-full bg-gold hover:bg-gold-dark text-white font-bold h-12 text-base gap-2"
              >
                ادامه و تسویه‌حساب
                <ArrowLeft className="size-5" />
              </Button>
              <p className="text-[11px] text-muted-foreground text-center leading-5">
                زمان و نوع ارسال را در مرحله بعد انتخاب می‌کنید.
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
