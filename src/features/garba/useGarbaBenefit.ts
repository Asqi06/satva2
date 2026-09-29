"use client";
import { useEffect, useState } from "react";
import type { GarbaBenefit } from "@/lib/garba-benefit";

export function useGarbaBenefit(enabled: boolean, cartKey: string) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; benefit: GarbaBenefit | null; error: boolean } | null>(null);
  const key = `${enabled}:${cartKey}:${attempt}`;
  useEffect(() => {
    if (!enabled) return;
    const abort = new AbortController();
    fetch("/api/garba-ghumar/benefit", { cache: "no-store", signal: abort.signal })
      .then(async res => { const body = await res.json(); if (!res.ok || !body.success) throw new Error("Reward unavailable"); return body.data.benefit as GarbaBenefit | null; })
      .then(benefit => { if (!abort.signal.aborted) setResult({ key, benefit, error: false }); })
      .catch(() => { if (!abort.signal.aborted) setResult({ key, benefit: null, error: true }); });
    return () => abort.abort();
  }, [enabled, key]);
  const current = enabled && result?.key === key ? result : null;
  return { benefit: current?.benefit ?? null, pending: enabled && !current, error: current?.error ?? false, retry: () => setAttempt(a => a + 1) };
}
