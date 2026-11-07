"use client";

import type { PanelData } from "@/lib/types";

export interface MutateResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

export async function fetchPanelData(): Promise<PanelData | null> {
  try {
    const res = await fetch("/api/panel/data", { cache: "no-store" });
    const json = await res.json();
    if (json.success) return json.data as PanelData;
    return null;
  } catch {
    return null;
  }
}

export async function panelMutate(
  action: string,
  payload: Record<string, unknown> = {}
): Promise<MutateResult> {
  try {
    const res = await fetch("/api/panel/mutate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
    });
    const json = await res.json();
    return json as MutateResult;
  } catch {
    return { success: false, error: "خطا در ارتباط با سرور" };
  }
}
