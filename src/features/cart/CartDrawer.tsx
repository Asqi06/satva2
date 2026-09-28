"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { Icon } from "@/components/Icon";
import { CartItems } from "./CartItems";
import { useBag } from "./CartProvider";
import type { ShippingSettings } from "@/services/settings-service";
import { formatINR } from "@/utils/format";

export function CartDrawer({ settings }: { settings: ShippingSettings }) {
  const { lines, count, subtotal, loading, drawerOpen, setDrawerOpen, notice } = useBag();
  const dialog = useRef<HTMLDialogElement>(null);
  const close = () => setDrawerOpen(false);
  useEffect(() => {
    if (!drawerOpen) { dialog.current?.close(); return; }
    dialog.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [drawerOpen]);
  const shipping = subtotal >= settings.freeShippingThreshold ? 0 : settings.shippingFlatFee;
  return <dialog ref={dialog} onCancel={close} onClick={e => { if (e.target === e.currentTarget) close(); }} aria-label="Shopping bag" className="m-0 ml-auto flex-none h-dvh max-h-dvh w-full max-w-[440px] bg-white">
    <div className="flex h-full flex-col"><div className="flex items-center justify-between border-b border-light-gray px-5 py-4"><h2 className="section-title text-2xl">Your cart <span className="text-sm text-muted">({count})</span></h2><button type="button" autoFocus className="icon-button" aria-label="Close bag" onClick={close}><Icon name="close" /></button></div>
      {notice && <p role="status" className="border-b border-light-gray bg-cream px-5 py-3 text-sm">{notice}</p>}
      <div className="flex-1 overflow-y-auto px-5">{loading ? <p className="py-6 text-sm text-muted">Loading your cart…</p> : lines.length ? <CartItems onNavigate={close} /> : <div className="py-16 text-center"><p className="section-title text-2xl">Your cart is empty.</p><Link href="/shop" onClick={close} className="btn-primary mt-6">Continue shopping</Link></div>}</div>
      {lines.length > 0 && <div className="border-t border-light-gray bg-white px-5 py-5"><dl className="space-y-2 text-sm"><div className="flex justify-between"><dt>Subtotal</dt><dd className="font-semibold">{formatINR(subtotal)}</dd></div><div className="flex justify-between text-xs text-muted"><dt>Delivery before discounts</dt><dd>{shipping ? formatINR(shipping) : "Free"}</dd></div></dl><Link href={lines.some(l => l.available === false) ? "/cart" : "/checkout"} onClick={close} className="btn-primary mt-5 w-full">{lines.some(l => l.available === false) ? "Review unavailable items" : "Checkout"}</Link><Link href="/cart" onClick={close} className="mt-2 flex min-h-11 items-center justify-center text-sm underline underline-offset-4">View cart</Link></div>}
    </div>
  </dialog>;
}
