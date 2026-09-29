"use client";
import Link from "next/link";
import { useBag } from "./CartProvider";
import { CartItems } from "./CartItems";
import type { ShippingSettings } from "@/services/settings-service";
import { formatINR } from "@/utils/format";
import { GarbaShoppingGuide } from "@/features/garba/GarbaShoppingGuide";

export function CartView({ settings }: { settings: ShippingSettings }) {
  const { lines, count, subtotal, loading, notice } = useBag();
  const shipping = subtotal >= settings.freeShippingThreshold ? 0 : settings.shippingFlatFee;
  const missing = Math.max(0, settings.freeShippingThreshold - subtotal);
  return <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8 sm:py-12">
    <GarbaShoppingGuide />
    <Link href="/shop" className="inline-block min-h-11 text-xs text-muted">Home / Shop / Cart</Link><h1 className="section-title text-3xl sm:text-4xl">Your cart{count > 0 && <span className="ml-3 text-xl text-muted">({count})</span>}</h1>
    {notice && <p role="status" className="mt-5 border border-light-gray bg-cream px-4 py-3 text-sm">{notice}</p>}
    {loading ? <div aria-label="Loading cart" className="mt-8 h-40 animate-pulse bg-cream" /> : lines.length === 0 ? <div className="py-16 text-center"><h2 className="section-title text-2xl">Your cart is empty.</h2><p className="mt-3 text-sm text-muted">Explore the collection and find your next favourite.</p><Link href="/shop" className="btn-primary mt-6">Continue shopping</Link></div> : <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_360px]"><CartItems /><aside className="h-fit bg-cream p-6"><h2 className="section-title text-2xl">Order summary</h2><dl className="mt-5 space-y-3 text-sm"><div className="flex justify-between"><dt>Subtotal</dt><dd>{formatINR(subtotal)}</dd></div><div className="flex justify-between"><dt>Delivery</dt><dd>{shipping ? formatINR(shipping) : "Free"}</dd></div><div className="flex justify-between border-t border-light-gray pt-4 font-semibold"><dt>Total before discounts</dt><dd>{formatINR(subtotal + shipping)}</dd></div></dl><p className="mt-3 text-xs leading-5 text-muted">{missing > 0 ? `${formatINR(missing)} more for free delivery before discounts.` : "Your cart qualifies for free delivery before discounts."} Taxes included. Coupons can be applied at checkout.</p><Link href={lines.some(l => l.available === false) ? "/cart" : "/checkout"} aria-disabled={lines.some(l => l.available === false)} className={`btn-primary mt-6 w-full ${lines.some(l => l.available === false) ? "pointer-events-none opacity-50" : ""}`}>Checkout</Link><p className="mt-3 text-center text-xs text-muted">Guest checkout · Secure payment</p><Link href="/shop" className="mt-4 block min-h-11 text-center text-sm underline underline-offset-4">Continue shopping</Link></aside></div>}
  </div>;
}
