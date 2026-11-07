"use client";

import { createContext, useContext } from "react";
import type { PanelData } from "@/lib/types";

export interface PanelCtx {
  data: PanelData;
  refresh: () => Promise<void>;
  toast: (msg: string, isError?: boolean) => void;
}

export const PanelContext = createContext<PanelCtx | null>(null);

export function usePanel(): PanelCtx {
  const ctx = useContext(PanelContext);
  if (!ctx) throw new Error("usePanel must be used within PanelContext");
  return ctx;
}
