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
      <Link href="/admin/orders" className="text-sm underline underline-offset-4">
        ← All orders
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl tracking-tight">Order {order.id.slice(-8).toUpperCase()}</h1>
        <span className="flex gap-2">
          <StatusPill status={order.orderStatus} />
          <StatusPill status={order.paymentStatus} />
        </span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section aria-label="Items" className="rounded-3xl border border-ink/10 bg-white/60 p-5">
            <h2 className="font-display text-2xl">Items · {formatINR(order.total)}</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {order.items.map((item, i) => (
                <li key={`${item.productId}-${item.variantSku ?? ""}-${i}`} className="flex justify-between gap-4">
                  <span>
                    <strong>{item.name}</strong>
                    {item.variantSku && <span className="text-ink/60"> · {item.variantSku}</span>}
                    <span className="text-ink/60"> × {item.qty}</span>
                  </span>
                  <span className="font-semibold">{formatINR(item.totalPrice)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 border-t border-ink/10 pt-3 text-sm">
              <div className="flex justify-between"><dt className="text-ink/60">Subtotal</dt><dd>{formatINR(order.subtotal)}</dd></div>
              {order.discount > 0 && (
                <div className="flex justify-between"><dt className="text-ink/60">Discount{order.couponCode ? ` (${order.couponCode})` : ""}</dt><dd>−{formatINR(order.discount)}</dd></div>
              )}
              <div className="flex justify-between"><dt className="text-ink/60">Shipping</dt><dd>{order.shipping === 0 ? "Free" : formatINR(order.shipping)}</dd></div>
              <div className="flex justify-between font-semibold"><dt>Total</dt><dd>{formatINR(order.total)}</dd></div>
            </dl>
            <p className="mt-3 text-xs text-ink/60">
              {order.address.fullName} · {order.address.phone} · {order.address.addressLine1},{" "}
              {order.address.city} {order.address.pincode}
            </p>
          </section>

          <section aria-label="Timeline" className="rounded-3xl border border-ink/10 bg-white/60 p-5">
            <h2 className="font-display text-2xl">Timeline</h2>
            <div className="mt-4">
              <OrderTimeline timeline={order.timeline} />
            </div>
          </section>
        </div>

        <AdminOrderActions orderId={order.id} orderStatus={order.orderStatus} paymentStatus={order.paymentStatus} />
      </div>
    </main>
  );
}
