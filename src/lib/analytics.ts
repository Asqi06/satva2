/**
 * Google Analytics 4 helper. No-op without a configured ID or gtag.
 * Never send PII, payment data, secrets, or full payloads — ids,
 * names, prices and quantities only (see ANALYTICS.md).
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export interface AnalyticsItem {
  item_id: string;
  item_name: string;
  price: number;
  quantity?: number;
}

function track(event: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  window.gtag?.("event", event, params);
}

function itemOf(input: { id: string; name: string; price: number; qty?: number }): AnalyticsItem {
  return { item_id: input.id, item_name: input.name, price: input.price, quantity: input.qty ?? 1 };
}

export const analytics = {
  viewItem: (input: { id: string; name: string; price: number }) =>
    track("view_item", { currency: "INR", value: input.price, items: [itemOf(input)] }),

  search: (term: string) => track("search", { search_term: term.slice(0, 100) }),

  addToCart: (input: { id: string; name: string; price: number; qty: number }) =>
    track("add_to_cart", {
      currency: "INR",
      value: input.price * input.qty,
      items: [itemOf(input)],
    }),

  removeFromCart: (input: { id: string; name: string; price: number; qty: number }) =>
    track("remove_from_cart", {
      currency: "INR",
      value: input.price * input.qty,
      items: [itemOf(input)],
    }),

  addToWishlist: (input: { id: string; name: string; price: number }) =>
    track("add_to_wishlist", { currency: "INR", value: input.price, items: [itemOf(input)] }),

  beginCheckout: (input: {
    value: number;
    count: number;
    items: { id: string; name: string; price: number; qty: number }[];
  }) =>
    track("begin_checkout", {
      currency: "INR",
      value: input.value,
      items: input.items.map(itemOf),
    }),

  addPaymentInfo: (value: number) => track("add_payment_info", { currency: "INR", value }),

  purchase: (input: {
    orderId: string;
    value: number;
    coupon?: string;
    items: { id: string; name: string; price: number; qty: number }[];
  }) =>
    track("purchase", {
      currency: "INR",
      transaction_id: input.orderId,
      value: input.value,
      coupon: input.coupon,
      items: input.items.map(itemOf),
    }),
};
