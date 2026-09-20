"use client";

import { useEffect, useRef } from "react";
import { analytics } from "@/lib/analytics";

/** Fires a GA4 view_item once per product page mount. */
export function ViewItemTracker({ id, name, price }: { id: string; name: string; price: number }) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    analytics.viewItem({ id, name, price });
  }, [id, name, price]);
  return null;
}
