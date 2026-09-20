/**
 * Guest cart (localStorage). Snapshots carry display data so the bag
 * renders offline; prices are display-only and revalidated server-side
 * at checkout (Phase 4). Storage-parametric for testability.
 */

export interface GuestCartItem {
  productId: string;
  variantSku?: string;
  qty: number;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  image?: { secureUrl: string; alt: string };
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const GUEST_CART_KEY = "satvastones:guest-cart:v1";
export const CART_MERGED_KEY = "satvastones:cart-merged:v1";

export function guestKey(productId: string, variantSku?: string): string {
  return `${productId}:${(variantSku ?? "").trim().toUpperCase()}`;
}

export function loadGuestCart(storage: StorageLike): GuestCartItem[] {
  try {
    const raw = storage.getItem(GUEST_CART_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (i): i is GuestCartItem =>
        typeof i === "object" &&
        i !== null &&
        typeof (i as GuestCartItem).productId === "string" &&
        typeof (i as GuestCartItem).qty === "number",
    );
  } catch {
    return [];
  }
}

export function saveGuestCart(storage: StorageLike, items: GuestCartItem[]): void {
  storage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}

export function addGuestItem(
  storage: StorageLike,
  item: GuestCartItem,
): GuestCartItem[] {
  const items = loadGuestCart(storage);
  const key = guestKey(item.productId, item.variantSku);
  const existing = items.find((i) => guestKey(i.productId, i.variantSku) === key);
  if (existing) {
    existing.qty = Math.min(existing.qty + item.qty, 99);
    // Refresh snapshot (name/price may have changed since last add).
    existing.name = item.name;
    existing.price = item.price;
    existing.image = item.image;
  } else {
    items.push({ ...item, qty: Math.min(item.qty, 99) });
  }
  saveGuestCart(storage, items);
  return items;
}

export function setGuestQty(
  storage: StorageLike,
  productId: string,
  variantSku: string | undefined,
  qty: number,
): GuestCartItem[] {
  const key = guestKey(productId, variantSku);
  const items = loadGuestCart(storage).filter((i) => {
    if (guestKey(i.productId, i.variantSku) !== key) return true;
    if (qty <= 0) return false;
    i.qty = Math.min(qty, 99);
    return true;
  });
  saveGuestCart(storage, items);
  return items;
}

export function guestSubtotal(items: GuestCartItem[]): number {
  return items.reduce((n, i) => n + i.qty * i.price, 0);
}

export function guestCount(items: GuestCartItem[]): number {
  return items.reduce((n, i) => n + i.qty, 0);
}

/** Merge-once bookkeeping: merged guest carts per logged-in email. */
export function mergedEmails(storage: StorageLike): string[] {
  try {
    const raw = storage.getItem(CART_MERGED_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((e): e is string => typeof e === "string") : [];
  } catch {
    return [];
  }
}

export function markMerged(storage: StorageLike, email: string): void {
  const emails = mergedEmails(storage);
  if (!emails.includes(email)) {
    emails.push(email);
    storage.setItem(CART_MERGED_KEY, JSON.stringify(emails));
  }
}
