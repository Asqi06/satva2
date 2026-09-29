// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CheckoutWizard } from "@/features/checkout/CheckoutWizard";

const fixture = vi.hoisted(() => ({
  bag: { lines: [{ key: "piece:", productId: "piece", name: "Earrings", slug: "earrings", qty: 4, price: 149 }], count: 4, subtotal: 596, authed: true, loading: false, refresh: vi.fn(), clearPurchased: vi.fn(), add: vi.fn(), setDrawerOpen: vi.fn() },
  benefit: { offerIndex: 0, code: "GGWINNER", valid: true, discount: 197, message: "Ready", progress: 100, eligibleProductIds: ["piece"], gifts: [], giftCount: 0 },
}));
vi.mock("@/features/cart/CartProvider", () => ({ useBag: () => fixture.bag }));
vi.mock("@/features/checkout/AddressForm", () => ({ AddressForm: () => null }));
vi.mock("@/features/checkout/razorpay-checkout", () => ({ loadRazorpay: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/analytics", () => ({ analytics: { beginCheckout: vi.fn(), checkoutStepCompleted: vi.fn(), addPaymentInfo: vi.fn() } }));

const settings = { freeShippingThreshold: 399, shippingFlatFee: 49, reservationTtlMinutes: 30 };
const ok = (data: unknown) => new Response(JSON.stringify({ success: true, data }));

describe("automatic Garba checkout", () => {
  beforeEach(() => {
    sessionStorage.clear();
    fixture.benefit.valid = true; fixture.benefit.discount = 197;
    fixture.bag.lines = [{ key: "piece:", productId: "piece", name: "Earrings", slug: "earrings", qty: 4, price: 149 }];
    fixture.bag.subtotal = 596;
    window.Razorpay = class { open() {} close() {} };
  });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); delete window.Razorpay; });

  function network() {
    const fetcher = vi.fn(async (url: string, options?: RequestInit) => {
      if (url === "/api/addresses") return ok({ addresses: [{ id: "address", fullName: "Meera", addressLine1: "Street", city: "Vapi", state: "Gujarat", pincode: "396191", phone: "9876543210" }] });
      if (url === "/api/garba-ghumar/benefit") return ok({ benefit: { ...fixture.benefit } });
      if (url === "/api/coupons/validate") return ok({ valid: true, discount: 29 });
      if (url === "/api/orders") {
        const input = JSON.parse(options?.body as string);
        return ok({ order: { id: "order", total: input.couponCode === "NAV29" ? 567 : 399, subtotal: 596, discount: input.couponCode === "NAV29" ? 29 : 197, shipping: 0, tax: 0, items: [{ productId: "piece", name: "Earrings", qty: 4, unitPrice: 149, totalPrice: 596 }], address: { fullName: "Meera", phone: "9876543210" }, paymentStatus: "PENDING", orderStatus: "PENDING" } });
      }
      if (url === "/api/payments/create") return ok({ keyId: "test", razorpayOrderId: "rzp_order", amount: 39900, currency: "INR" });
      throw new Error(`Unexpected request: ${url}`);
    });
    vi.stubGlobal("fetch", fetcher);
    return fetcher;
  }

  it("automatically sends the verified winning code when creating the order", async () => {
    const fetcher = network();
    render(<CheckoutWizard settings={settings} />);
    await screen.findByText(/Automatically applied. You save ₹197/);
    fireEvent.click(await screen.findByRole("button", { name: "Continue to Payment" }));
    fireEvent.click(await screen.findByRole("button", { name: "Pay ₹399" }));
    await waitFor(() => expect(fetcher.mock.calls.some(([url]) => url === "/api/orders")).toBe(true));
    const posted = fetcher.mock.calls.find(([url]) => url === "/api/orders")!;
    expect(JSON.parse(posted[1]?.body as string)).toEqual({ addressId: "address", couponCode: "GGWINNER" });
  });

  it("lets the customer replace the reward with a different coupon without stacking", async () => {
    const fetcher = network();
    render(<CheckoutWizard settings={settings} />);
    fireEvent.click(await screen.findByRole("button", { name: "Use a different coupon" }));
    fireEvent.change(screen.getByLabelText("Coupon code"), { target: { value: "Nav29" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    await screen.findByText("Applied. You save ₹29.");
    fireEvent.click(screen.getByRole("button", { name: "Continue to Payment" }));
    fireEvent.click(await screen.findByRole("button", { name: "Pay ₹567" }));
    await waitFor(() => expect(fetcher.mock.calls.some(([url]) => url === "/api/orders")).toBe(true));
    expect(JSON.parse(fetcher.mock.calls.find(([url]) => url === "/api/orders")![1]?.body as string).couponCode).toBe("NAV29");
  });

  it("removes a stale saving and prevents payment when the changed cart no longer qualifies", async () => {
    network();
    const view = render(<CheckoutWizard settings={settings} />);
    await screen.findByText(/Automatically applied. You save ₹197/);
    fireEvent.click(screen.getByRole("button", { name: "Continue to Payment" }));
    await screen.findByRole("button", { name: "Pay ₹399" });
    fixture.benefit.valid = false; fixture.benefit.discount = 0;
    fixture.bag.lines = [{ ...fixture.bag.lines[0], qty: 2 }]; fixture.bag.subtotal = 298;
    view.rerender(<CheckoutWizard settings={settings} />);
    await waitFor(() => expect(screen.queryByText(/Automatically applied/)).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Pay ₹347" })).toBeDisabled();
  });
});
