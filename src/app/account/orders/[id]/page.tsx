import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOrderForUser } from "@/services/order-service";
import { formatINR } from "@/utils/format";
import { CancelOrderButton } from "@/features/orders/CancelOrderButton";
import { OrderTimeline, StatusPill } from "@/features/orders/OrderTimeline";

export const dynamic = "force-dynamic";

/** Customer order detail + tracking timeline. */
export default async function AccountOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { id } = await params;
  let order;
  try {
    order = await getOrderForUser(session.user.id, id);
  } catch {
    notFound();
  }

  const address = order.address;
  return (
    <main>
      <Link href="/account/orders" className="text-sm underline underline-offset-4">
        ← All orders
      </Link>
      <p className="eyebrow">Tracked · 5–7 day delivery</p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="section-title text-4xl tracking-tight">Order {order.id.slice(-8).toUpperCase()}</h1>
        <span className="flex gap-2">
          <StatusPill status={order.orderStatus} />
          <StatusPill status={order.paymentStatus} />
        </span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section aria-label="Items" className="rounded-3xl border border-ink/10 bg-white/60 p-5">
            <h2 className="font-display text-2xl">Items</h2>
            <ul className="mt-4 space-y-3">
              {order.items.map((item, i) => (
                <li key={`${item.productId}-${item.variantSku ?? ""}-${i}`} className="flex items-center gap-4 text-sm">
                  <span className="relative block h-14 w-12 shrink-0 overflow-hidden rounded-lg bg-ivory">
                    {item.image && <Image src={item.image} alt="" fill sizes="48px" className="object-cover" />}
                  </span>
                  <span className="flex-1">
                    <strong>{item.name}</strong>
                    {item.variantSku && <span className="text-warm-gray"> · {item.variantSku}</span>}
                    <br />
                    <span className="text-warm-gray">Qty {item.qty} × {formatINR(item.unitPrice)}</span>
                  </span>
                  <span className="font-semibold">{formatINR(item.totalPrice)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1 border-t border-ink/10 pt-3 text-sm">
              <div className="flex justify-between"><dt className="text-warm-gray">Subtotal</dt><dd>{formatINR(order.subtotal)}</dd></div>
              {order.discount > 0 && (
                <div className="flex justify-between"><dt className="text-warm-gray">Discount{order.couponCode ? ` (${order.couponCode})` : ""}</dt><dd>−{formatINR(order.discount)}</dd></div>
              )}
              <div className="flex justify-between"><dt className="text-warm-gray">Shipping</dt><dd>{order.shipping === 0 ? "Free" : formatINR(order.shipping)}</dd></div>
              <div className="flex justify-between font-semibold"><dt>Total</dt><dd>{formatINR(order.total)}</dd></div>
            </dl>
          </section>

          <section aria-label="Tracking" className="rounded-3xl border border-ink/10 bg-white/60 p-5">
            <h2 className="font-display text-2xl">Tracking</h2>
            <div className="mt-4">
              <OrderTimeline timeline={order.timeline} />
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section aria-label="Delivery address" className="h-fit rounded-3xl border border-ink/10 bg-white/60 p-5 text-sm">
            <h2 className="font-display text-xl">Delivering to</h2>
            <p className="mt-2 leading-6">
              <strong>{address.fullName}</strong> · {address.phone}
              <br />
              {address.addressLine1}
              {address.addressLine2 ? `, ${address.addressLine2}` : ""}, {address.city},{" "}
              {address.state} — {address.pincode}
            </p>
          </section>
          {order.orderStatus === "PENDING" && order.paymentStatus === "PENDING" && (
            <div className="rounded-3xl border border-ink/10 bg-white/60 p-5">
              <CancelOrderButton orderId={order.id} />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
