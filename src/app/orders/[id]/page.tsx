import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCheckoutOrderOwner } from "@/lib/checkout-identity";
import { AppError } from "@/lib/errors";
import { getOrderForUser } from "@/services/order-service";
import { getSettings } from "@/services/settings-service";
import { OrderSummary } from "@/features/checkout/OrderSummary";
import { OrderTimeline, StatusPill } from "@/features/orders/OrderTimeline";
import { CancelOrderButton } from "@/features/orders/CancelOrderButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Order status", robots: { index: false, follow: false } };

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let order;
  try { order = await getOrderForUser(await getCheckoutOrderOwner(id), id); }
  catch (error) {
    if (error instanceof AppError && error.status === 401) return <div className="mx-auto max-w-xl px-4 py-16"><h1 className="section-title text-3xl">Open your order securely</h1><p className="mt-4 text-sm leading-7 text-muted">For a guest order, use the browser you checked out with. For an account order, sign in. If you changed devices, contact support with your order number.</p><Link href={`/login?callbackUrl=${encodeURIComponent(`/orders/${id}`)}`} className="btn-primary mt-6">Sign in</Link><Link href="/contact" className="ml-5 inline-block py-3 text-sm underline">Contact support</Link></div>;
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  }
  const settings = await getSettings();
  return <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-8"><p className="eyebrow">Order status</p><div className="mt-3 flex flex-wrap items-center justify-between gap-4"><h1 className="section-title text-3xl">Order {order.id.slice(-8).toUpperCase()}</h1><div className="flex gap-2"><StatusPill status={order.orderStatus} /><StatusPill status={order.paymentStatus} /></div></div><div className="mt-8 grid gap-8 md:grid-cols-2"><section className="bg-cream p-6" aria-label="Order items and total"><OrderSummary order={order} /></section><div><section aria-label="Delivery address"><h2 className="text-sm font-semibold">Delivery address</h2><address className="mt-3 text-sm not-italic leading-7">{order.address.fullName}<br />{order.address.addressLine1}{order.address.addressLine2 && <><br />{order.address.addressLine2}</>}<br />{order.address.city}, {order.address.state} {order.address.pincode}<br />{order.address.phone}</address>{settings.deliveryInformation && <p className="mt-4 text-sm text-muted">{settings.deliveryInformation}</p>}</section><section className="mt-7 border-t border-light-gray pt-6" aria-label="Tracking"><h2 className="mb-5 text-sm font-semibold">Order updates</h2><OrderTimeline timeline={order.timeline} /></section>{order.orderStatus === "PENDING" && order.paymentStatus === "PENDING" && <div className="mt-6"><Link href={`/checkout?order=${order.id}`} className="btn-primary">Continue payment</Link><div className="mt-4"><CancelOrderButton orderId={order.id} /></div></div>}<Link href="/contact" className="mt-5 inline-block min-h-11 py-3 text-sm underline">Contact order support</Link>{order.isGuest && <p className="mt-3 text-xs leading-6 text-muted">Guest tracking is available in this browser for 30 days. Keep your order number for support.</p>}</div></div></div>;
}
