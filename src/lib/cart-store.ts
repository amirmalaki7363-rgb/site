"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  qty: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  checkoutOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  openCheckout: () => void;
  closeCheckout: () => void;
  addItem: (item: Omit<CartItem, "qty">, qty?: number) => void;
  removeItem: (id: string) => void;
  increment: (id: string) => void;
  decrement: (id: string) => void;
  clear: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      checkoutOpen: false,
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      openCheckout: () => set({ isOpen: false, checkoutOpen: true }),
      closeCheckout: () => set({ checkoutOpen: false }),
      addItem: (item, qty = 1) => {
        const items = [...get().items];
        const existing = items.find((i) => i.id === item.id);
        if (existing) {
          existing.qty += qty;
          set({ items });
        } else {
          set({ items: [...items, { ...item, qty }] });
        }
      },
      removeItem: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
      increment: (id) => {
        const items = get().items.map((i) =>
          i.id === id ? { ...i, qty: Math.min(i.qty + 1, 99) } : i
        );
        set({ items });
      },
      decrement: (id) => {
        const items = get()
          .items.map((i) => (i.id === id ? { ...i, qty: i.qty - 1 } : i))
          .filter((i) => i.qty > 0);
        set({ items });
      },
      clear: () => set({ items: [] }),
    }),
    { name: "golestan-hafez-cart", partialize: (s) => ({ items: s.items }) }
  )
);

export const cartTotalCount = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + i.qty, 0);

export const cartTotalPrice = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + i.qty * i.price, 0);
