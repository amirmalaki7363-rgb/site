"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useView } from "@/lib/panel-store";

export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  image: string;
}

async function serverFavorite(action: "favorite.add" | "favorite.remove", productId: string) {
  const user = useView.getState().user;
  if (!user) return; // guests stay local-only until login
  try {
    await fetch("/api/panel/mutate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, data: { productId } }),
    });
  } catch {
    /* ignore network hiccups; state stays optimistic */
  }
}

interface WishlistState {
  items: WishlistItem[];
  isOpen: boolean;
  openWishlist: () => void;
  closeWishlist: () => void;
  toggle: (item: WishlistItem) => boolean; // returns true if now favorited
  isFavorited: (id: string) => boolean;
  remove: (id: string) => void;
  clear: () => void;
  replaceAll: (items: WishlistItem[]) => void;
  syncLocal: (productId: string) => void; // remove from local mirror without server call
}

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      openWishlist: () => set({ isOpen: true }),
      closeWishlist: () => set({ isOpen: false }),
      toggle: (item) => {
        const items = [...get().items];
        const idx = items.findIndex((i) => i.id === item.id);
        if (idx >= 0) {
          items.splice(idx, 1);
          set({ items });
          void serverFavorite("favorite.remove", item.id);
          return false;
        }
        set({ items: [item, ...items] });
        void serverFavorite("favorite.add", item.id);
        return true;
      },
      isFavorited: (id) => get().items.some((i) => i.id === id),
      remove: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) });
        void serverFavorite("favorite.remove", id);
      },
      clear: () => set({ items: [] }),
      replaceAll: (items) => set({ items }),
      syncLocal: (productId) => set({ items: get().items.filter((i) => i.id !== productId) }),
    }),
    { name: "golestan-hafez-wishlist", partialize: (s) => ({ items: s.items }) }
  )
);
