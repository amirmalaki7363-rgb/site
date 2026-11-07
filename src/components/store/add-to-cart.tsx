"use client";

import { useCart } from "@/lib/cart-store";

export default function AddToCart(props: { id: string; name: string; price: number; image: string; disabled?: boolean }) {
  const addItem = useCart((s) => s.addItem);
  const openCart = useCart((s) => s.openCart);
  return (
    <button
      type="button"
      disabled={props.disabled}
      onClick={() => {
        addItem({ id: props.id, name: props.name, price: props.price, image: props.image });
        openCart();
      }}
      className="rounded-full bg-charcoal text-white px-8 py-3 text-sm font-extrabold hover:bg-charcoal/85 transition-colors disabled:opacity-50"
    >
      {props.disabled ? "ناموجود" : "افزودن به سبد خرید"}
    </button>
  );
}
