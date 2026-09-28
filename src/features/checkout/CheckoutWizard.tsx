"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useBag } from "@/features/cart/CartProvider";
import { analytics } from "@/lib/analytics";
import { guestOrderSchema, type GuestOrderInput } from "@/schemas/checkout";
import type { AddressDTO } from "@/services/address-service";
import type { OrderDTO } from "@/services/order-service";
import type { CartView } from "@/services/cart-service";
import type { ShippingSettings } from "@/services/settings-service";
import { formatINR } from "@/utils/format";
import { AddressForm } from "./AddressForm";
import { AddressFields } from "./AddressFields";
import { OrderConfirmation, OrderSummary } from "./OrderSummary";
import { loadRazorpay } from "./razorpay-checkout";

const PENDING_KEY = "satva:pending-order";
async function request<T>(url: string, data?: unknown): Promise<T> {
  const response = await fetch(url, data === undefined ? { cache: "no-store" } : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  const body = await response.json();
  if (!response.ok || !body.success) throw new Error(body.error?.details?.map((item: { message: string }) => item.message).join(". ") || body.error?.message || "Could not complete this request. Try again.");
  return body.data;
}

export function CheckoutWizard({ settings, resumeOrderId }: { settings: ShippingSettings; resumeOrderId?: string }) {
  const { lines, count, subtotal, authed, loading, refresh, clearPurchased } = useBag();
  const [step, setStep] = useState<"information" | "payment" | "done">("information");
  const [addresses, setAddresses] = useState<AddressDTO[]>([]);
  const [addressId, setAddressId] = useState("");
  const [guest, setGuest] = useState<GuestOrderInput | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string,string>>({});
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState("");
  const [order, setOrder] = useState<OrderDTO | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const begun = useRef(false);
  const lock = useRef(false);
  const discounted = Math.max(0, subtotal - discount);
  const shipping = discounted <= 0 || discounted >= settings.freeShippingThreshold ? 0 : settings.shippingFlatFee;
  const total = discounted + shipping;

  useEffect(() => {
    let cancelled = false;
    const id = resumeOrderId || sessionStorage.getItem(PENDING_KEY);
    (async () => {
      if (id) {
        try {
          const data = await request<{ order: OrderDTO }>(`/api/orders/${id}`);
          if (!cancelled) { setOrder(data.order); setStep(data.order.paymentStatus === "PAID" ? "done" : "payment"); if (data.order.paymentStatus === "PENDING") sessionStorage.setItem(PENDING_KEY, data.order.id); }
          if (data.order.paymentStatus === "PAID") { sessionStorage.removeItem(PENDING_KEY); await clearPurchased(); }
        } catch { if (!cancelled) setError("Could not load the unfinished order. Check your order status before starting a new payment."); }
      }
      if (!cancelled) setRestoring(false);
    })();
    return () => { cancelled = true; };
  }, [clearPurchased, resumeOrderId]);
  useEffect(() => {
    if (!authed) return;
    let cancelled = false;
    request<{ addresses: AddressDTO[] }>("/api/addresses").then(data => {
      if (cancelled) return;
      setAddresses(data.addresses);
      setAddressId((data.addresses.find(a => a.isDefault) ?? data.addresses[0])?.id ?? "");
    }).catch(() => { if (!cancelled) setError("Could not load saved addresses. Try refreshing this page."); });
    return () => { cancelled = true; };
  }, [authed]);
  useEffect(() => {
    if (loading || restoring || !count || begun.current) return;
    begun.current = true;
    analytics.beginCheckout({ value: total, count, items: lines.map(l => ({ id: l.productId, name: l.name, price: l.price, qty: l.qty })) });
  }, [loading, restoring, total, count, lines]);

  const prepareGuest = async () => {
    if (authed) return;
    const view = await request<CartView>("/api/checkout/guest", { items: lines.map(l => ({ productId: l.productId, variantSku: l.variantSku, qty: l.qty })) });
    await refresh();
    if (view.unavailableCount || view.items.some(i => i.adjusted)) throw new Error("Your cart changed because some quantities are unavailable. Review your cart before continuing.");
    if (view.subtotal !== subtotal) { setDiscount(0); setAppliedCoupon(""); setCouponMessage("Cart prices updated. Review the order summary before paying."); }
  };
  const continueToPayment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(""); setFieldErrors({});
    const values = new FormData(event.currentTarget);
    if (!authed) {
      const parsed = guestOrderSchema.safeParse({ email: values.get("email"), address: Object.fromEntries(values) });
      if (!parsed.success) { setFieldErrors(Object.fromEntries(parsed.error.issues.map(issue => [String(issue.path.at(-1)), issue.message]))); return; }
      setGuest(parsed.data);
    } else if (!addressId) { setError("Choose or add a delivery address."); return; }
    setBusy(true);
    try { await prepareGuest(); analytics.checkoutStepCompleted("information"); setStep("payment"); } catch (e) { setError(e instanceof Error ? e.message : "Could not check your cart. Try again."); } finally { setBusy(false); }
  };
  const applyCoupon = async () => {
    setBusy(true); setCouponMessage(""); setError("");
    try {
      await prepareGuest();
      const check = await request<{ valid: boolean; discount: number; reason?: string }>("/api/coupons/validate", { code: coupon.trim() });
      setDiscount(check.valid ? check.discount : 0); setAppliedCoupon(check.valid ? coupon.trim().toUpperCase() : "");
      setCouponMessage(check.valid ? `Applied. You save ${formatINR(check.discount)}.` : check.reason === "SIGN_IN_REQUIRED" ? "This coupon requires a signed-in account. You can continue without it." : `Coupon not applied (${check.reason?.toLowerCase().replaceAll("_", " ") || "invalid code"}).`);
    } catch (e) { setDiscount(0); setAppliedCoupon(""); setCouponMessage(e instanceof Error ? e.message : "Could not check this coupon."); } finally { setBusy(false); }
  };
  const pay = async () => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError("");
    const finish = () => { lock.current = false; setBusy(false); };
    try {
      await loadRazorpay();
      if (!window.Razorpay) throw new Error("Payment could not load. Check your connection and try again.");
      let placed = order;
      if (!placed) {
        if (sessionStorage.getItem(PENDING_KEY)) throw new Error("An unfinished order is saved. Reload this page to check it before paying again.");
        const data = await request<{ order: OrderDTO }>("/api/orders", authed ? { addressId, couponCode: appliedCoupon || undefined } : { ...guest, couponCode: appliedCoupon || undefined });
        placed = data.order; setOrder(placed); sessionStorage.setItem(PENDING_KEY, placed.id);
        if (placed.total !== total || placed.items.length !== lines.length || placed.items.some((item,index) => item.qty !== lines[index]?.qty || item.unitPrice !== lines[index]?.price)) {
          setError("Your order amount or items changed. Review the updated summary, then confirm payment."); finish(); return;
        }
      }
      const payment = await request<{ keyId: string; amount: number; currency: string; razorpayOrderId: string }>("/api/payments/create", { orderId: placed.id });
      const snapshot = placed;
      analytics.addPaymentInfo(snapshot.total);
      const widget = new window.Razorpay({
        key: payment.keyId, amount: payment.amount, currency: payment.currency, name: "SatvaStones", description: `Order ${snapshot.id.slice(-8).toUpperCase()}`, order_id: payment.razorpayOrderId,
        prefill: { name: snapshot.address.fullName, contact: snapshot.address.phone, email: snapshot.customerEmail || guest?.email }, theme: { color: "#d61f2c" },
        handler: response => { void (async () => {
          try {
            const verified = await request<{ order: OrderDTO }>("/api/payments/verify", { razorpayOrderId: response.razorpay_order_id, razorpayPaymentId: response.razorpay_payment_id, razorpaySignature: response.razorpay_signature });
            if (verified.order.paymentStatus !== "PAID") throw new Error("Payment is still being confirmed. Check order status before paying again.");
            setOrder(verified.order); setStep("done"); sessionStorage.removeItem(PENDING_KEY);
            analytics.purchase({ orderId: verified.order.id, value: verified.order.total, coupon: verified.order.couponCode, items: verified.order.items.map(i => ({ id: i.productId, name: i.name, price: i.unitPrice, qty: i.qty })) });
            await clearPurchased();
          } catch (e) { setError(e instanceof Error ? e.message : "Could not confirm payment. Check order status before trying again."); } finally { finish(); }
        })(); },
        modal: { ondismiss: () => { setError("Payment window closed. Your order is saved; retry payment or check its status below."); finish(); } },
      });
      widget.open();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not start payment. Try again."); finish(); }
  };
  const startAgain = async () => {
    if (!order) return;
    setBusy(true); setError("");
    try {
      const fresh = await request<{ order: OrderDTO }>(`/api/orders/${order.id}`);
      if (fresh.order.paymentStatus === "PAID") { setOrder(fresh.order); setStep("done"); await clearPurchased(); sessionStorage.removeItem(PENDING_KEY); return; }
      if (fresh.order.orderStatus === "PENDING") await request(`/api/orders/${order.id}/cancel`, { reason: "Customer is editing checkout" });
      if (!["PENDING","CANCELLED"].includes(fresh.order.orderStatus)) throw new Error("This order is already being processed. Open its order status for help.");
      if (fresh.order.isGuest && !authed) {
        const items = fresh.order.items.map(i => ({ productId: i.productId, variantSku: i.variantSku, qty: i.qty }));
        await request("/api/checkout/guest", { items });
      } else {
        await request("/api/cart/merge", { items: fresh.order.items.map(i => ({ productId: i.productId, variantSku: i.variantSku, qty: i.qty })) });
      }
      sessionStorage.removeItem(PENDING_KEY); setOrder(null); setStep("information"); await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not reopen checkout."); } finally { setBusy(false); }
  };

  if (restoring || (loading && !lines.length && !order)) return <div aria-label="Loading checkout" className="h-60 animate-pulse bg-cream" />;
  if (step === "done" && order) return <OrderConfirmation order={order} delivery={settings.deliveryInformation} />;
  if (!lines.length && !order) return <div className="py-10"><h2 className="section-title text-2xl">Your cart is empty.</h2><p className="mt-3 text-sm text-muted">Add a piece to continue.</p><Link href="/shop" className="btn-primary mt-6">Continue shopping</Link>{error && <p role="alert" className="mt-5 text-sm text-primary">{error}</p>}</div>;
  const address = order?.address || (authed ? addresses.find(a => a.id === addressId) : guest?.address);
  return <div>
    <ol aria-label="Checkout progress" className="mb-8 flex gap-8 border-b border-light-gray pb-5 text-sm"><li aria-current={step === "information" ? "step" : undefined} className={step === "information" ? "font-semibold" : "text-muted"}>1. Information</li><li aria-current={step === "payment" ? "step" : undefined} className={step === "payment" ? "font-semibold" : "text-muted"}>2. Payment</li></ol>
    <a href="#checkout-summary" className="mb-6 flex min-h-12 items-center justify-between gap-3 border-b border-light-gray pb-4 text-sm lg:hidden"><span>Order total · View summary</span><strong>{formatINR(order?.total ?? total)}</strong></a>
    <div className="grid items-start gap-8 lg:grid-cols-[1fr_380px] lg:gap-14"><div>
      {error && <p role="alert" className="mb-5 border-l-2 border-primary bg-cream p-4 text-sm">{error}</p>}
      {step === "information" ? <>
        {!authed && <p className="mb-6 text-sm text-muted">Checkout as a guest. <Link className="ml-1 underline underline-offset-4" href="/login?callbackUrl=%2Fcheckout">Already have an account?</Link></p>}
        {authed && <div className="mb-6"><h2 className="mb-4 text-lg font-medium">Delivery address</h2><fieldset className="space-y-3"><legend className="sr-only">Saved addresses</legend>{addresses.map(a => <label key={a.id} className={`flex gap-3 border p-4 text-sm ${a.id === addressId ? "border-ink" : "border-light-gray"}`}><input type="radio" name="address" value={a.id} checked={a.id === addressId} onChange={() => setAddressId(a.id)} className="mt-1 h-4 w-4 accent-primary" /><span><strong>{a.fullName}</strong><span className="mt-1 block leading-6 text-muted">{a.addressLine1}, {a.city}, {a.state} {a.pincode}</span></span></label>)}</fieldset><div className="mt-5"><AddressForm onCreated={async id => { try { const data = await request<{ addresses: AddressDTO[] }>("/api/addresses"); setAddresses(data.addresses); setAddressId(id); setError(""); } catch { setError("Address saved, but could not refresh addresses. Reload to select it."); } }} /></div></div>}
        <form onSubmit={continueToPayment}>
          {!authed && <><h2 className="mb-5 text-lg font-medium">Contact & delivery</h2><div className="mb-5"><label htmlFor="checkout-email" className="field-label">Email address</label><input id="checkout-email" className="field" name="email" type="email" required maxLength={254} autoComplete="email" defaultValue={guest?.email} aria-invalid={!!fieldErrors.email} aria-describedby="email-help" /><span id="email-help" className={`mt-2 block text-xs ${fieldErrors.email ? "text-primary" : "text-muted"}`}>{fieldErrors.email || "For your order confirmation and payment receipt."}</span></div><AddressFields initial={guest?.address} errors={fieldErrors} /></>}
          <p className="mt-6 text-xs leading-6 text-muted">{settings.dispatchInformation || "See shipping information for dispatch details."} {settings.deliveryInformation}</p><button disabled={busy || (authed && !addressId)} type="submit" className="btn-primary mt-6 w-full sm:w-auto">{busy ? "Checking your cart…" : "Continue to Payment"}</button>
        </form>
      </> : <>
        <h2 className="text-lg font-medium">Review & pay</h2>{address && <div className="mt-5 border-b border-light-gray pb-5 text-sm leading-7"><p className="font-medium">{address.fullName}</p><p className="text-muted">{address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ""}<br />{address.city}, {address.state} {address.pincode}<br />{address.phone}</p>{!order && <button onClick={() => setStep("information")} className="mt-2 min-h-11 text-xs underline">Edit information</button>}</div>}
        <p className="mt-6 text-sm leading-7 text-muted">Pay securely through Razorpay. Available payment methods are shown in the payment window.</p>
        {order?.reservationExpiresAt && order.paymentStatus === "PENDING" && <p className="mt-3 text-xs leading-6 text-muted">Unpaid stock reservation expires at {new Date(order.reservationExpiresAt).toLocaleString("en-IN")}. No payment has been confirmed yet.</p>}
        <button disabled={busy || (!!order && (order.orderStatus !== "PENDING" || order.paymentStatus !== "PENDING"))} className="btn-primary mt-6 w-full" onClick={() => void pay()}>{busy ? "Opening secure payment…" : `${order ? "Retry payment" : "Pay"} ${formatINR(order?.total ?? total)}`}</button>
        <p className="mt-3 text-xs leading-6 text-muted">By placing your order you agree to our <Link className="underline" href="/terms">terms</Link> and <Link className="underline" href="/privacy">privacy policy</Link>.</p>
        {order && <div className="mt-5 flex flex-wrap gap-4 text-sm"><Link href={`/orders/${order.id}`} className="min-h-11 py-3 underline">Check order status</Link><button disabled={busy} className="min-h-11 underline" onClick={() => void startAgain()}>Edit or restart checkout</button></div>}
      </>}
    </div><aside id="checkout-summary" className="bg-cream p-5 sm:p-7"><h2 className="section-title text-2xl">Order summary</h2>{order ? <OrderSummary order={order} /> : <>
      <ul className="mt-4 divide-y divide-light-gray">{lines.map(l => <li key={l.key} className="flex justify-between gap-4 py-3 text-sm"><div className="min-w-0"><p className="clamp-2">{l.name}</p>{l.variantSku && <p className="mt-1 text-xs text-muted">{l.variantLabel || l.variantSku}</p>}<p className="mt-1 text-xs text-muted">Quantity {l.qty}</p></div><p className="shrink-0">{formatINR(l.price * l.qty)}</p></li>)}</ul>
      <dl className="space-y-3 border-t border-light-gray pt-4 text-sm"><div className="flex justify-between"><dt>Subtotal</dt><dd>{formatINR(subtotal)}</dd></div>{discount > 0 && <div className="flex justify-between"><dt>Discount</dt><dd>−{formatINR(discount)}</dd></div>}<div className="flex justify-between"><dt>Delivery</dt><dd>{shipping ? formatINR(shipping) : "Free"}</dd></div><div className="flex justify-between border-t border-light-gray pt-4 text-base font-semibold"><dt>Total payable</dt><dd>{formatINR(total)}</dd></div></dl><p className="mt-2 text-xs text-muted">Taxes included in product prices.</p>
      <details className="mt-6 border-t border-light-gray pt-4"><summary className="min-h-11 cursor-pointer text-sm">Have a coupon?</summary><div className="mt-2 flex gap-2"><label className="min-w-0 flex-1"><span className="sr-only">Coupon code</span><input maxLength={32} className="field" value={coupon} onChange={e => { setCoupon(e.target.value); setDiscount(0); setAppliedCoupon(""); setCouponMessage(""); }} /></label><button type="button" className="btn-ghost !px-3" disabled={busy || !coupon.trim()} onClick={() => void applyCoupon()}>Apply</button></div>{couponMessage && <p className="mt-3 text-xs leading-6" role="status">{couponMessage}</p>}</details>
    </>}<Link href="/shipping" className="mt-5 inline-block min-h-11 text-xs underline underline-offset-4">Shipping information</Link><Link href="/returns" className="ml-4 inline-block min-h-11 text-xs underline underline-offset-4">Returns & refunds</Link></aside></div>
  </div>;
}
