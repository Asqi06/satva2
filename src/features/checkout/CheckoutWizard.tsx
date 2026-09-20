"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useBag } from "@/features/cart/CartProvider";
import { analytics } from "@/lib/analytics";
import type { AddressDTO } from "@/services/address-service";
import { formatINR } from "@/utils/format";
import { AddressForm } from "./AddressForm";
import { loadRazorpay } from "./razorpay-checkout";

type Step = "address" | "delivery" | "payment" | "done";

interface SettingsView {
  freeShippingThreshold: number;
  shippingFlatFee: number;
  announcement?: string;
}

interface PlacedOrder {
  id: string;
  total: number;
  subtotal: number;
  discount: number;
  shipping: number;
  couponCode?: string;
}

const STEPS: { id: Step; label: string }[] = [
  { id: "address", label: "Address" },
  { id: "delivery", label: "Delivery" },
  { id: "payment", label: "Payment" },
];

/**
 * Checkout wizard. Guests see a login prompt (bag merges on login);
 * members walk address → delivery → Razorpay → confirmation.
 * All money is server-calculated; the client only displays responses.
 */
export function CheckoutWizard() {
  const { lines, count, subtotal } = useBag();
  const [step, setStep] = useState<Step>("address");
  const [authState, setAuthState] = useState<"checking" | "guest" | "member">("checking");
  const [addresses, setAddresses] = useState<AddressDTO[]>([]);
  const [addressId, setAddressId] = useState<string>("");
  const [settings, setSettings] = useState<SettingsView | null>(null);
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const [order, setOrder] = useState<PlacedOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const begunRef = useRef(false);

  const shippingPreview = settings
    ? subtotal - discount >= settings.freeShippingThreshold || subtotal - discount <= 0
      ? 0
      : settings.shippingFlatFee
    : 0;

  // GA4 begin_checkout once per arrival at the payment step.
  useEffect(() => {
    if (step !== "payment" || begunRef.current) return;
    begunRef.current = true;
    analytics.beginCheckout({
      value: subtotal - discount + shippingPreview,
      count,
      items: lines.map((l) => ({ id: l.productId, name: l.name, price: l.price, qty: l.qty })),
    });
  }, [step, subtotal, discount, shippingPreview, count, lines]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/addresses");
        if (res.status === 401) {
          setAuthState("guest");
          return;
        }
        const body = (await res.json()) as { success: boolean; data?: { addresses: AddressDTO[] } };
        if (body.success && body.data) {
          setAddresses(body.data.addresses);
          const def = body.data.addresses.find((a) => a.isDefault) ?? body.data.addresses[0];
          if (def) setAddressId(def.id);
        }
        setAuthState("member");
      } catch {
        setAuthState("guest");
      }
      try {
        const res = await fetch("/api/settings");
        const body = (await res.json()) as { success: boolean; data?: SettingsView };
        if (body.success && body.data) setSettings(body.data);
      } catch {
        // Shipping falls back to defaults below.
      }
    })();
  }, []);

  const refreshAddresses = async (selectId?: string) => {
    const res = await fetch("/api/addresses");
    const body = (await res.json()) as { success: boolean; data?: { addresses: AddressDTO[] } };
    if (body.success && body.data) {
      setAddresses(body.data.addresses);
      if (selectId) setAddressId(selectId);
    }
  };

  const applyCoupon = async () => {
    setCouponMsg(null);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: coupon }),
      });
      const body = (await res.json()) as {
        success: boolean;
        data?: { valid: boolean; discount: number; reason?: string };
        error?: { message: string };
      };
      if (!body.success || !body.data) throw new Error(body.error?.message ?? "Validation failed");
      if (!body.data.valid) {
        setDiscount(0);
        setCouponMsg(`Code not applied (${body.data.reason ?? "invalid"}).`);
        return;
      }
      setDiscount(body.data.discount);
      setCouponMsg(`Applied — you save ${formatINR(body.data.discount)}.`);
    } catch (err) {
      setDiscount(0);
      setCouponMsg(err instanceof Error ? err.message : "Validation failed");
    }
  };

  const pay = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addressId, couponCode: coupon.trim() || undefined }),
      });
      const orderBody = (await orderRes.json()) as {
        success: boolean;
        data?: { order: PlacedOrder & { couponCode?: string }; excluded: number };
        error?: { message: string };
      };
      if (!orderBody.success || !orderBody.data) {
        throw new Error(orderBody.error?.message ?? "Could not place order");
      }
      const placed = orderBody.data.order;
      setOrder(placed);

      const payRes = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: placed.id }),
      });
      const payBody = (await payRes.json()) as {
        success: boolean;
        data?: { razorpayOrderId: string; amount: number; currency: string; keyId: string };
        error?: { message: string };
      };
      if (!payBody.success || !payBody.data) {
        throw new Error(payBody.error?.message ?? "Could not start payment");
      }
      await loadRazorpay();
      if (!window.Razorpay) throw new Error("Payment widget failed to load");
      analytics.addPaymentInfo(placed.total);
      const rzp = new window.Razorpay({
        key: payBody.data.keyId,
        amount: payBody.data.amount,
        currency: payBody.data.currency,
        name: "SatvaStones",
        description: "Jewellery order",
        order_id: payBody.data.razorpayOrderId,
        theme: { color: "#1a1512" },
        handler: (response) => {
          void (async () => {
            try {
              const verifyRes = await fetch("/api/payments/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                }),
              });
              const verifyBody = (await verifyRes.json()) as {
                success: boolean;
                data?: { order: PlacedOrder };
                error?: { message: string };
              };
              if (!verifyBody.success || !verifyBody.data) {
                throw new Error(verifyBody.error?.message ?? "Verification failed");
              }
              const confirmed = verifyBody.data.order;
              analytics.purchase({
                orderId: confirmed.id,
                value: confirmed.total,
                coupon: confirmed.couponCode,
                items: lines.map((l) => ({ id: l.productId, name: l.name, price: l.price, qty: l.qty })),
              });
              setOrder({ ...confirmed });
              setStep("done");
            } catch (err) {
              setError(err instanceof Error ? err.message : "Verification failed");
            } finally {
              setBusy(false);
            }
          })();
        },
        modal: {
          ondismiss: () => {
            setError("Payment window closed — your order is reserved for 30 minutes. You can retry from your orders.");
            setBusy(false);
          },
        },
      });
      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setBusy(false);
    }
  };

  if (authState === "checking") {
    return <p className="px-6 py-12 text-sm text-ink/60">Loading checkout…</p>;
  }

  if (authState === "guest") {
    return (
      <div className="mx-auto w-full max-w-md rounded-3xl border border-ink/10 bg-white/60 p-8 text-center">
        <h1 className="font-display text-3xl">One step first.</h1>
        <p className="mt-2 text-sm leading-6 text-ink/70">
          Login connects your bag, addresses and orders. Your guest bag merges automatically.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-full bg-ink px-8 py-3 text-sm font-medium text-ivory hover:bg-clay"
        >
          Continue with Google
        </Link>
      </div>
    );
  }

  if (lines.length === 0 && step !== "done") {
    return (
      <div className="mx-auto w-full max-w-md rounded-3xl border border-ink/10 bg-white/60 p-8 text-center">
        <h1 className="font-display text-3xl">Your bag is empty.</h1>
        <Link href="/shop" className="mt-6 inline-block rounded-full bg-ink px-8 py-3 text-sm font-medium text-ivory hover:bg-clay">
          Back to the shop
        </Link>
      </div>
    );
  }

  const selectedAddress = addresses.find((a) => a.id === addressId);

  return (
    <div>
      {step !== "done" && (
        <ol aria-label="Checkout steps" className="flex gap-2">
          {STEPS.map((s, i) => (
            <li
              key={s.id}
              aria-current={step === s.id ? "step" : undefined}
              className={`rounded-full px-4 py-1.5 text-sm ${
                step === s.id ? "bg-ink text-ivory" : "border border-ink/15 text-ink/60"
              }`}
            >
              {i + 1}. {s.label}
            </li>
          ))}
        </ol>
      )}

      {error && (
        <p role="alert" className="mt-4 rounded-2xl border border-clay/40 bg-clay/10 p-3 text-sm">
          {error}
        </p>
      )}

      {step === "address" && (
        <section aria-label="Delivery address" className="mt-6 rounded-3xl border border-ink/10 bg-white/60 p-6">
          <h2 className="font-display text-2xl">Where is it going?</h2>
          {addresses.length === 0 ? (
            <p className="mt-2 text-sm text-ink/70">No addresses yet — add your first one.</p>
          ) : (
            <div role="radiogroup" aria-label="Saved addresses" className="mt-4 space-y-3">
              {addresses.map((a) => (
                <label
                  key={a.id}
                  className={`block cursor-pointer rounded-2xl border p-4 text-sm ${
                    a.id === addressId ? "border-ink" : "border-ink/15"
                  }`}
                >
                  <span className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="address"
                      checked={a.id === addressId}
                      onChange={() => setAddressId(a.id)}
                      className="mt-1 accent-[#b34a2b]"
                    />
                    <span>
                      <strong>{a.fullName}</strong> · {a.phone}
                      <br />
                      {a.addressLine1}
                      {a.addressLine2 ? `, ${a.addressLine2}` : ""}, {a.city}, {a.state} — {a.pincode}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          )}
          <div className="mt-4">
            <AddressForm onCreated={(id) => void refreshAddresses(id)} />
          </div>
          <button
            type="button"
            disabled={!addressId}
            onClick={() => setStep("delivery")}
            className="mt-6 rounded-full bg-ink px-8 py-3 text-sm font-medium text-ivory hover:bg-clay disabled:opacity-40"
          >
            Continue to delivery
          </button>
        </section>
      )}

      {step === "delivery" && (
        <section aria-label="Delivery method" className="mt-6 rounded-3xl border border-ink/10 bg-white/60 p-6">
          <h2 className="font-display text-2xl">How should it travel?</h2>
          <div className="mt-4 rounded-2xl border border-ink bg-ivory p-4 text-sm">
            <p className="font-semibold">Standard delivery · 5–7 days</p>
            <p className="mt-1 text-ink/70">
              {settings
                ? subtotal - discount >= settings.freeShippingThreshold
                  ? `Free (orders over ${formatINR(settings.freeShippingThreshold)})`
                  : `${formatINR(settings.shippingFlatFee)} · free over ${formatINR(settings.freeShippingThreshold)}`
                : "Calculated at payment."}
            </p>
            {selectedAddress && (
              <p className="mt-2 text-ink/70">
                To {selectedAddress.fullName}, {selectedAddress.city} {selectedAddress.pincode}
              </p>
            )}
          </div>
          <div className="mt-4">
            <label htmlFor="coupon" className="text-sm text-ink/70">
              Coupon code (optional)
            </label>
            <div className="mt-1 flex gap-2">
              <input
                id="coupon"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                placeholder="WELCOME10"
                maxLength={32}
                className="w-full max-w-xs rounded-full border border-ink/15 bg-ivory px-4 py-2 text-sm uppercase"
              />
              <button
                type="button"
                onClick={() => void applyCoupon()}
                className="rounded-full border border-ink/20 px-5 py-2 text-sm hover:border-ink"
              >
                Apply
              </button>
            </div>
            {couponMsg && (
              <p role="status" className="mt-2 text-sm">
                {couponMsg}
              </p>
            )}
          </div>
          <div className="mt-6 flex gap-2">
            <button type="button" onClick={() => setStep("address")} className="rounded-full border border-ink/20 px-6 py-3 text-sm">
              ← Back
            </button>
            <button
              type="button"
              onClick={() => setStep("payment")}
              className="rounded-full bg-ink px-8 py-3 text-sm font-medium text-ivory hover:bg-clay"
            >
              Continue to payment
            </button>
          </div>
        </section>
      )}

      {step === "payment" && (
        <section aria-label="Payment" className="mt-6 rounded-3xl border border-ink/10 bg-white/60 p-6">
          <h2 className="font-display text-2xl">Almost yours.</h2>
          <dl className="mt-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink/60">Subtotal ({count} items)</dt>
              <dd>{formatINR(subtotal)}</dd>
            </div>
            {discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-ink/60">Coupon {coupon && `(${coupon})`}</dt>
                <dd>−{formatINR(discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-ink/60">Shipping</dt>
              <dd>{shippingPreview === 0 ? "Free" : formatINR(shippingPreview)}</dd>
            </div>
            <div className="flex justify-between border-t border-ink/10 pt-2 font-semibold">
              <dt>Estimated total</dt>
              <dd>{formatINR(subtotal - discount + shippingPreview)}</dd>
            </div>
          </dl>
          <p className="mt-2 text-xs text-ink/60">Final amounts are confirmed by the server when you pay. UPI, cards, netbanking & wallets via Razorpay.</p>
          <div className="mt-6 flex gap-2">
            <button type="button" onClick={() => setStep("delivery")} className="rounded-full border border-ink/20 px-6 py-3 text-sm">
              ← Back
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void pay()}
              className="rounded-full bg-ink px-8 py-3 text-sm font-medium text-ivory hover:bg-clay disabled:opacity-60"
            >
              {busy ? "Processing…" : `Pay ${formatINR(subtotal - discount + shippingPreview)}`}
            </button>
          </div>
        </section>
      )}

      {step === "done" && order && (
        <section aria-label="Order confirmation" className="mt-6 rounded-3xl border border-ink/10 bg-white/60 p-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-clay">Payment confirmed</p>
          <h2 className="mt-2 font-display text-4xl">Thank you — it&apos;s yours.</h2>
          <dl className="mx-auto mt-6 max-w-sm space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink/60">Order</dt>
              <dd className="font-mono">{order.id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink/60">Amount paid</dt>
              <dd className="font-semibold">{formatINR(order.total)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink/60">Arriving in</dt>
              <dd>5–7 days</dd>
            </div>
          </dl>
          <p className="mt-4 text-sm text-ink/70">A confirmation email is on its way (order emails land in Phase 7).</p>
          <Link href="/shop" className="mt-6 inline-block rounded-full bg-ink px-8 py-3 text-sm font-medium text-ivory hover:bg-clay">
            Keep browsing
          </Link>
        </section>
      )}
    </div>
  );
}
