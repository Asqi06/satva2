import Link from "next/link";
import { auth } from "@/lib/auth";
import { listUserOrders } from "@/services/order-service";
import { formatINR } from "@/utils/format";
import { StatusPill } from "@/features/orders/OrderTimeline";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Customer order history (owner-scoped). */
export default async function AccountOrdersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { orders, pagination } = await listUserOrders(session.user.id, 1, 10);

  return (
    <main>
      <p className="eyebrow">History · Tracked to your pincode</p>
      <h1 className="section-title mt-2 text-4xl tracking-tight">My orders</h1>
      {orders.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-light-gray bg-white/60 p-8 text-center">
          <p className="font-display text-2xl">No orders yet.</p>
          <Link href="/shop" className="mt-4 inline-block rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-ivory hover:bg-gold">
            Start shopping
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-6 space-y-4">
            {orders.map((o) => (
              <li key={o.id} className="rounded-2xl border border-light-gray bg-white/60 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm">{o.id.slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-warm-gray">
                      {new Date(o.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })} ·{" "}
                      {o.items.reduce((n, i) => n + i.qty, 0)} item(s) · {formatINR(o.total)}
                    </p>
                  </div>
                  <span className="flex gap-2">
                    <StatusPill status={o.orderStatus} />
                    <StatusPill status={o.paymentStatus} />
                  </span>
                </div>
                <Link href={`/account/orders/${o.id}`} className="mt-3 inline-block text-sm underline underline-offset-4">
                  View & track →
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-warm-gray">
            Showing {orders.length} of {pagination.total}
          </p>
        </>
      )}
    </main>
  );
}
