"use client";

import { create } from "zustand";
import type { SessionUser } from "@/lib/types";

export type AppView = "shop" | "user" | "admin" | "gateway";

interface ViewState {
  view: AppView;
  userSection: string;
  adminSection: string;
  user: SessionUser | null;
  authReady: boolean;
  authModalOpen: boolean;
  authModalMode: "login" | "register";
  gatewayAuthority: string | null;
  setView: (v: AppView) => void;
  setUserSection: (s: string) => void;
  setAdminSection: (s: string) => void;
  setUser: (u: SessionUser | null) => void;
  setAuthReady: (v: boolean) => void;
  openAuthModal: (mode?: "login" | "register") => void;
  closeAuthModal: () => void;
  openGateway: (authority: string) => void;
}

function syncHash(target: string) {
  if (typeof window !== "undefined") {
    if (window.location.hash !== target) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search + target);
    }
  }
}

export const useView = create<ViewState>()((set) => ({
  view: "shop",
  userSection: "overview",
  adminSection: "dashboard",
  user: null,
  authReady: false,
  authModalOpen: false,
  authModalMode: "login",
  gatewayAuthority: null,
  setView: (v) => {
    if (v !== "gateway") set({ view: v, gatewayAuthority: null });
    else set({ view: v });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0 });
      const target =
        v === "admin" ? "#admin" : v === "user" ? "#user" : v === "gateway" ? "" : "#shop";
      syncHash(target);
    }
  },
  setUserSection: (s) => set({ userSection: s }),
  setAdminSection: (s) => set({ adminSection: s }),
  setUser: (u) => set({ user: u }),
  setAuthReady: (v) => set({ authReady: v }),
  openAuthModal: (mode = "login") => set({ authModalOpen: true, authModalMode: mode }),
  closeAuthModal: () => set({ authModalOpen: false }),
  openGateway: (authority) => {
    set({ view: "gateway", gatewayAuthority: authority });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0 });
      syncHash(`#pay/${authority}`);
    }
  },
}));
