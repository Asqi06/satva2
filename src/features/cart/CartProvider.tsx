"use client";

import { useSession } from "next-auth/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { analytics } from "@/lib/analytics";
import type { CartView, CartViewItem } from "@/services/cart-service";
import {
  addGuestItem,
  guestCount,
  guestSubtotal,
  loadGuestCart,
  saveGuestCart,
  setGuestQty,
  type GuestCartItem,
} from "./guest-cart";

export interface BagLine {
  key: string;
  productId: string;
  variantSku?: string;
  variantLabel?: string;
  qty: number;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  image?: { secureUrl: string; alt: string };
  adjusted?: boolean;
  available?: boolean;
}

interface BagContextValue {
  lines: BagLine[];
  count: number;
  subtotal: number;
  loading: boolean;
  authed: boolean;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  refresh: () => Promise<void>;
  add: (item: GuestCartItem) => Promise<boolean>;
  setQty: (key: string, qty: number) => Promise<boolean>;
  clearPurchased: () => Promise<void>;
  remove: (key: string) => Promise<void>;
  notice: string | null;
}

const BagContext = createContext<BagContextValue | null>(null);

async function readJson(res: Response): Promise<{ ok: boolean; body: unknown }> {
  const body: unknown = await res.json().catch(() => null);
  return { ok: res.ok, body };
}

function toLines(view: CartView): BagLine[] {
  return view.items.map((i: CartViewItem) => ({ ...i }));
}

function guestToLines(items: GuestCartItem[]): BagLine[] {
  return items.map((i) => ({
    key: `${i.productId}:${(i.variantSku ?? "").toUpperCase()}`,
    productId: i.productId,
    variantSku: i.variantSku,
    variantLabel: i.variantLabel,
    qty: i.qty,
    name: i.name,
    slug: i.slug,
    price: i.price,
    compareAtPrice: i.compareAtPrice,
    image: i.image,
    available: true,
  }));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const authed = status === "authenticated";
  const [lines, setLines] = useState<BagLine[]>([]);
  const [count, setCount] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const email = session?.user?.email ?? null;
  const mergedRef = useRef<string | null>(null);

  const applyView = useCallback((view: CartView, saveEmpty = true) => {
    setLines(toLines(view)); setCount(view.count); setSubtotal(view.subtotal);
    if (!authed && (view.items.length || saveEmpty)) saveGuestCart(window.localStorage, view.items.map(i => ({ productId: i.productId, variantSku: i.variantSku, variantLabel: i.variantLabel, qty: i.qty, name: i.name, slug: i.slug, price: i.price, compareAtPrice: i.compareAtPrice, image: i.image })));
  }, [authed]);
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { ok, body } = await readJson(await fetch("/api/cart"));
      if (ok) {
        const view = (body as { success: true; data: CartView }).data;
        applyView(view, false);
      } else if (!authed) {
        const items = loadGuestCart(window.localStorage);
        setLines(guestToLines(items));
        setCount(guestCount(items));
        setSubtotal(guestSubtotal(items));
      } else { setNotice("Could not refresh your cart. Please try again."); }
    } catch {
      const items = loadGuestCart(window.localStorage);
      if (!authed) { setLines(guestToLines(items)); setCount(guestCount(items)); setSubtotal(guestSubtotal(items)); }
      setNotice("Could not refresh your cart. Your saved items are safe; try again.");
    } finally {
      setLoading(false);
    }
  }, [applyView, authed]);

  const clearPurchased = useCallback(async () => { saveGuestCart(window.localStorage, []); await refresh(); }, [refresh]);

  // Initial load + merge once per login. Async auth/sync
  // effect, not a render cascade.
  useEffect(() => {
    if (status === "loading") return;
    if (!authed || !email) {
      mergedRef.current = null;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void refresh();
      return;
    }
    if (mergedRef.current === email) {
      void refresh();
      return;
    }
    mergedRef.current = email;
    const guestItems = loadGuestCart(window.localStorage);
    (async () => {
      let merged = guestItems.length === 0;
      try {
        if (guestItems.length > 0) {
          const res = await fetch("/api/cart/merge", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: guestItems.map((i) => ({
                productId: i.productId,
                variantSku: i.variantSku,
                qty: i.qty,
              })),
            }),
          });
          const { ok, body } = await readJson(res);
          if (ok) {
            const summary = body as {
              success: true;
              data: { added: number; capped: number; dropped: number };
            };
            if (summary.data.capped > 0 || summary.data.dropped > 0) {
              setNotice("Some bag quantities were adjusted to available stock.");
            }
            // Clear the guest bag only after the server confirms the
            // merge — a failed merge must never wipe the shopper's items.
            saveGuestCart(window.localStorage, []);
            merged = true;
          } else {
            setNotice("Couldn't sync your guest bag — your picks are still saved on this device.");
          }
        }
      } catch {
        setNotice("Couldn't sync your guest bag — your picks are still saved on this device.");
      } finally {
        // A failed merge must remain retryable on the next login.
        if (!merged) mergedRef.current = null;
        await refresh();
      }
    })();
  }, [authed, email, status, refresh]);

  const add = useCallback(
    async (item: GuestCartItem) => {
      setNotice(null);
      try {
        const res = await fetch("/api/cart/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: item.productId,
            variantSku: item.variantSku,
            qty: item.qty,
          }),
        });
        const { ok, body } = await readJson(res);
        if (ok) {
          const data = (body as { success: true; data: CartView & { adjusted?: boolean } }).data;
          applyView(data);
          if (data.adjusted) setNotice("Quantity adjusted to available stock.");
          setDrawerOpen(true);
          analytics.addToCart({ id: item.productId, name: item.name, price: item.price, qty: item.qty });
          return true;
        }
        if (res.status === 401) {
          const items = addGuestItem(window.localStorage, item);
          setLines(guestToLines(items));
          setCount(guestCount(items));
          setSubtotal(guestSubtotal(items));
          setDrawerOpen(true);
          analytics.addToCart({ id: item.productId, name: item.name, price: item.price, qty: item.qty });
          return true;
        }
        const message =
          body !== null && typeof body === "object" && "error" in body
            ? String((body as { error: { message?: string } }).error.message ?? "Could not add to bag")
            : "Could not add to bag";
        setNotice(message);
        return false;
      } catch {
        setNotice("Could not add to your bag. Please try again.");
        return false;
      }
    },
    [applyView],
  );

  const setQty = useCallback(async (key: string, qty: number) => {
    setNotice(null);
    try {
      const res = await fetch(`/api/cart/items/${encodeURIComponent(key)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ qty }) });
      const { ok, body } = await readJson(res);
      if (ok) { applyView((body as { data: CartView }).data); return true; }
      if (res.status === 401 && !authed) {
        const target = lines.find(l => l.key === key);
        if (!target) return false;
        const items = setGuestQty(window.localStorage, target.productId, target.variantSku, qty);
        setLines(guestToLines(items)); setCount(guestCount(items)); setSubtotal(guestSubtotal(items)); return true;
      }
      setNotice((body as { error?: { message?: string } })?.error?.message || "Could not update your cart. Try again.");
    } catch { setNotice("Could not update your cart. Try again."); }
    return false;
  }, [lines, applyView, authed]);

  const remove = useCallback(
    async (key: string) => {
      const target = lines.find((l) => l.key === key);
      const removed = await setQty(key, 0);
      if (target && removed) {
        analytics.removeFromCart({
          id: target.productId,
          name: target.name,
          price: target.price,
          qty: target.qty,
        });
      }
    },
    [lines, setQty],
  );

  const value = useMemo<BagContextValue>(
    () => ({
      lines,
      count,
      subtotal,
      loading,
      authed,
      drawerOpen,
      setDrawerOpen,
      refresh,
      clearPurchased,
      add,
      setQty,
      remove,
      notice,
    }),
    [lines, count, subtotal, loading, authed, drawerOpen, refresh, clearPurchased, add, setQty, remove, notice],
  );

  return <BagContext.Provider value={value}>{children}</BagContext.Provider>;
}

export function useBag(): BagContextValue {
  const ctx = useContext(BagContext);
  if (!ctx) throw new Error("useBag must be used inside CartProvider");
  return ctx;
}
