import { describe, expect, it } from "vitest";
import {
  addGuestItem,
  guestCount,
  guestSubtotal,
  loadGuestCart,
  markMerged,
  mergedEmails,
  setGuestQty,
  type GuestCartItem,
  type StorageLike,
} from "@/features/cart/guest-cart";

function fakeStorage(initial: Record<string, string> = {}): StorageLike {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

const RING: GuestCartItem = {
  productId: "64f000000000000000000001",
  qty: 1,
  name: "Ring",
  slug: "ring",
  price: 499,
};

describe("guest cart", () => {
  it("starts empty and tolerates corrupt data", () => {
    expect(loadGuestCart(fakeStorage())).toEqual([]);
    expect(loadGuestCart(fakeStorage({ "satvastones:guest-cart:v1": "nope{" }))).toEqual([]);
  });

  it("adds and sums quantities up to 99", () => {
    const s = fakeStorage();
    addGuestItem(s, RING);
    addGuestItem(s, { ...RING, qty: 2, price: 599 });
    const items = loadGuestCart(s);
    expect(items).toHaveLength(1);
    expect(items[0]?.qty).toBe(3);
    // Snapshot refreshed on re-add.
    expect(items[0]?.price).toBe(599);
    addGuestItem(s, { ...RING, qty: 200 });
    expect(loadGuestCart(s)[0]?.qty).toBe(99);
  });

  it("keeps variants as separate lines", () => {
    const s = fakeStorage();
    addGuestItem(s, RING);
    addGuestItem(s, { ...RING, variantSku: "RING-S6" });
    expect(loadGuestCart(s)).toHaveLength(2);
  });

  it("sets quantity and removes at zero", () => {
    const s = fakeStorage();
    addGuestItem(s, RING);
    setGuestQty(s, RING.productId, undefined, 3);
    expect(loadGuestCart(s)[0]?.qty).toBe(3);
    setGuestQty(s, RING.productId, undefined, 0);
    expect(loadGuestCart(s)).toEqual([]);
  });

  it("computes count and subtotal", () => {
    const s = fakeStorage();
    addGuestItem(s, RING);
    addGuestItem(s, { ...RING, productId: "64f000000000000000000002", qty: 2, price: 100 });
    const items = loadGuestCart(s);
    expect(guestCount(items)).toBe(3);
    expect(guestSubtotal(items)).toBe(499 + 200);
  });

  it("tracks merged emails once", () => {
    const s = fakeStorage();
    expect(mergedEmails(s)).toEqual([]);
    markMerged(s, "a@x.co");
    markMerged(s, "a@x.co");
    expect(mergedEmails(s)).toEqual(["a@x.co"]);
  });
});
