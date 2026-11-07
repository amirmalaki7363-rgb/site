"use client";

import { useEffect } from "react";
import { useView } from "@/lib/panel-store";
import type { SessionUser } from "@/lib/types";
import { useWishlist } from "@/lib/wishlist-store";

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: SessionUser;
}

export async function authRequest(
  endpoint: "login" | "register",
  payload: Record<string, unknown>
): Promise<AuthResult> {
  try {
    const res = await fetch(`/api/auth/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = (await res.json()) as AuthResult;
    return json;
  } catch {
    return { success: false, error: "خطا در ارتباط با سرور" };
  }
}

export async function authLogout(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {
    /* ignore */
  }
}

/** Fetch current session and adopt server-side favorites into the wishlist store. */
export async function fetchMe(): Promise<SessionUser | null> {
  try {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
    const json = (await res.json()) as { success: boolean; user: SessionUser | null };
    return json.user ?? null;
  } catch {
    return null;
  }
}

/** Sync localStorage wishlist with the server favorites after login (merge). */
export async function syncFavoritesToServer(): Promise<void> {
  try {
    const res = await fetch("/api/panel/data", { cache: "no-store" });
    const json = await res.json();
    if (!json.success) return;
    const serverFavs = (json.data?.favorites ?? []) as { productId: string }[];
    const serverIds = new Set(serverFavs.map((f) => f.productId));

    // merge local items that are not on the server yet
    const local = useWishlist.getState().items;
    for (const item of local) {
      if (!serverIds.has(item.id)) {
        await fetch("/api/panel/mutate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "favorite.add",
            data: { productId: item.id, name: item.name, price: item.price, image: item.image },
          }),
        });
      }
    }

    // adopt the merged server list locally
    const finalRes = await fetch("/api/panel/data", { cache: "no-store" });
    const finalJson = await finalRes.json();
    if (finalJson.success) {
      const favs = (finalJson.data?.favorites ?? []) as {
        productId: string; name: string; price: number; image: string;
      }[];
      useWishlist.getState().replaceAll(
        favs.map((f) => ({ id: f.productId, name: f.name, price: f.price, image: f.image }))
      );
    }
  } catch {
    /* ignore */
  }
}

/** Hook: loads the session once on mount. */
export function useAuthInit() {
  const setAuthReady = useView((s) => s.setAuthReady);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const user = await fetchMe();
      if (!cancelled) {
        useView.getState().setUser(user);
        setAuthReady(true);
        if (user) await syncFavoritesToServer();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setAuthReady]);
}
