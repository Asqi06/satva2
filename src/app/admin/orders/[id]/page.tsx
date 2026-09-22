import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminOrder } from "@/services/admin-order-service";
import { formatINR } from "@/utils/format";
import { AdminOrderActions } from "@/features/admin/AdminOrderActions";
import { OrderTimeline, StatusPill } from "@/features/orders/OrderTimeline";

export const dynamic = "force-dynamic";

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let order;
  try {
    order = await getAdminOrder(id);
  } catch {
    notFound();
  }

  return (
    <main>
      <Link href="/admin/orders" className="text-sm text-ivory/50 underline underline-offset-4 hover:text-ivory">
        ← All orders
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display italic text-3xl tracking-tight text-ivory sm:text-4xl">Order {order.id.slice(-8).toUpperCase()}</h1>
        <span className="flex flex-wrap gap-2">
          <StatusPill dark status={order.orderStatus} />
          <StatusPill dark status={order.paymentStatus} />
        </span>
      </div>

      {order.legacy && (
        <p role="note" className="mt-4 border border-marigold/30 bg-marigold/10 p-3 text-sm text-ivory">
          Legacy COD-era import (no account, no payment trail) — read-only. Status, cancel and refund actions are disabled for this order.
        </p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <section aria-label="Items" className="border border-ivory/[0.07] bg-ivory/[0.03] p-5">
            <h2 className="font-display italic text-2xl text-ivory">Items · {formatINR(order.total)}</h2>
            <ul className="mt-4 space-y-2 text-sm text-ivory/75">
              {order.items.map((item, i) => (
                <li key={`${item.productId}-${item.variantSku ?? ""}-${i}`} className="flex justify-between gap-4">
                  <span className="min-w-0">
                    <strong className="text-ivory">{item.name}</strong>
                    {item.variantSku && <span className="text-ivory/50"> · {item.variantSku}</span>}
                    <span className="text-ivory/50"> × {item.qty}</span>
                  </span>
                  <span className="shrink-0 font-mono font-semibold text-ivory">{formatINR(item.totalPrice)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 border-t border-ivory/[0.07] pt-3 text-sm text-ivory/80">
              <div className="flex justify-between"><dt className="text-ivory/50">Subtotal</dt><dd className="font-mono">{formatINR(order.subtotal)}</dd></div>
              {order.discount > 0 && (
                <div className="flex justify-between"><dt className="text-ivory/50">Discount{order.couponCode ? ` (${order.couponCode})` : ""}</dt><dd className="font-mono">−{formatINR(order.discount)}</dd></div>
              )}
              <div className="flex justify-between"><dt className="text-ivory/50">Shipping</dt><dd className="font-mono">{order.shipping === 0 ? "Free" : formatINR(order.shipping)}</dd></div>
              <div className="flex justify-between font-semibold text-ivory"><dt>Total</dt><dd className="font-mono">{formatINR(order.total)}</dd></div>
            </dl>
            <p className="mt-3 text-xs leading-5 text-ivory/50">
              {order.address.fullName} · {order.address.phone} · {order.address.addressLine1},{" "}
              {order.address.city} {order.address.pincode}
            </p>
          </section>

          <section aria-label="Timeline" className="border border-ivory/[0.07] bg-ivory/[0.03] p-5">
            <h2 className="font-display italic text-2xl text-ivory">Timeline</h2>
            <div className="mt-4">
              <OrderTimeline dark timeline={order.timeline} />
            </div>
          </section>
        </div>

        {!order.legacy && (
          <AdminOrderActions orderId={order.id} orderStatus={order.orderStatus} paymentStatus={order.paymentStatus} />
        )}
      </div>
    </main>
  );
}
