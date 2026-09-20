/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { analytics } from "@/lib/analytics";

describe("analytics", () => {
  beforeEach(() => {
    window.gtag = vi.fn();
  });

  it("emits GA4-shaped commerce events without PII", () => {
    analytics.purchase({
      orderId: "order1",
      value: 900,
      coupon: "WELCOME10",
      items: [{ id: "p1", name: "Ring", price: 500, qty: 2 }],
    });
    expect(window.gtag).toHaveBeenCalledWith(
      "event",
      "purchase",
      expect.objectContaining({
        currency: "INR",
        transaction_id: "order1",
        value: 900,
        items: [{ item_id: "p1", item_name: "Ring", price: 500, quantity: 2 }],
      }),
    );
    const blob = JSON.stringify((window.gtag as ReturnType<typeof vi.fn>).mock.calls);
    expect(blob).not.toMatch(/email|password|card|secret/i);
  });

  it("truncates search terms and stays silent without gtag", () => {
    analytics.search("a".repeat(200));
    const params = (window.gtag as ReturnType<typeof vi.fn>).mock.calls[0]?.[2] as {
      search_term: string;
    };
    expect(params.search_term).toHaveLength(100);
    window.gtag = undefined;
    expect(() => analytics.viewItem({ id: "p1", name: "Ring", price: 500 })).not.toThrow();
  });

  it("covers bag and checkout steps", () => {
    analytics.addToCart({ id: "p1", name: "Ring", price: 500, qty: 2 });
    analytics.removeFromCart({ id: "p1", name: "Ring", price: 500, qty: 1 });
    analytics.addToWishlist({ id: "p1", name: "Ring", price: 500 });
    analytics.beginCheckout({ value: 1000, count: 2, items: [{ id: "p1", name: "Ring", price: 500, qty: 2 }] });
    analytics.addPaymentInfo(1000);
    const calls = (window.gtag as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[1]);
    expect(calls).toEqual(["add_to_cart", "remove_from_cart", "add_to_wishlist", "begin_checkout", "add_payment_info"]);
  });
});
