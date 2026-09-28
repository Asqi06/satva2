import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { getDashboardStats } from "@/services/admin-dashboard-service";
import { formatINR } from "@/utils/format";

export const metadata: Metadata = {
  title: { absolute: "Dashboard — SatvaStones Admin" },
  description: "SatvaStones store management.",
};
export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const stats = await getDashboardStats();
  const metrics = [
    {
      label: "Total sales",
      value: formatINR(stats.totalSales),
      detail: "All paid orders",
      icon: "dashboard",
      accent: true,
    },
    {
      label: "Today’s sales",
      value: formatINR(stats.todaySales),
      detail: "Paid orders today",
      icon: "ticket",
    },
    {
      label: "Paid orders",
      value: String(stats.paidOrderCount),
      detail: "Confirmed payments",
      icon: "bag",
    },
    {
      label: "Pending orders",
      value: String(stats.pendingOrders),
      detail: "Review in Orders",
      icon: "truck",
    },
  ] as const;
  const top = stats.topProducts.filter((product) => product.sold > 0);
  const maxDay = Math.max(1, ...stats.salesByDay.map((day) => day.sales));

  return (
    <div>
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="admin-eyebrow">Store overview</p>
          <h1 className="admin-title">Dashboard</h1>
          <p className="mt-2 text-sm text-muted">
            Paid sales, stock and fulfilment at a glance.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/orders" className="btn-ghost">
            View orders
          </Link>
          <Link href="/admin/products/new" className="btn-primary">
            <Icon name="box" width="18" height="18" />
            New product
          </Link>
        </div>
      </div>
      <section
        aria-label="Sales overview"
        className="grid grid-cols-2 gap-3 xl:grid-cols-4"
      >
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className={"accent" in metric ? "admin-kpi-accent" : "admin-kpi"}
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xs font-medium text-muted">{metric.label}</h2>
              <Icon
                name={metric.icon}
                width="18"
                height="18"
                className="text-muted"
              />
            </div>
            <p className="mt-4 break-words text-2xl font-semibold tracking-tight sm:text-3xl">
              {metric.value}
            </p>
            <p className="mt-2 text-xs text-muted">{metric.detail}</p>
          </div>
        ))}
      </section>
      <dl className="admin-card mt-4 grid grid-cols-2 gap-x-6 gap-y-5 xl:grid-cols-4">
        {[
          ["Average order", formatINR(stats.avgOrderValue)],
          ["Units sold", stats.productsSold],
          ["Customers", stats.customerCount],
          ["All orders", stats.orderCount],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="mt-1 text-lg font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-6 grid items-start gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <section aria-label="Sales last 14 days" className="admin-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Sales activity</h2>
              <p className="mt-1 text-xs text-muted">
                Last 14 days · paid orders
              </p>
            </div>
            <span className="rounded-md bg-slate-50 px-2.5 py-1 text-xs text-muted">
              INR
            </span>
          </div>
          {stats.salesByDay.length ? (
            <ul className="mt-6 space-y-4">
              {stats.salesByDay.map((day) => (
                <li
                  key={day.date}
                  className="grid grid-cols-[76px_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[76px_minmax(0,1fr)_auto]"
                >
                  <span className="text-xs text-muted">{day.date}</span>
                  <meter
                    min={0}
                    max={maxDay}
                    value={day.sales}
                    className="admin-meter"
                    aria-label={`Sales on ${day.date}: ${formatINR(day.sales)}`}
                  />
                  <span className="col-start-2 text-xs sm:col-start-auto">
                    {formatINR(day.sales)}{" "}
                    <span className="text-muted">
                      · {day.orders} order{day.orders === 1 ? "" : "s"}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-14 text-center">
              <Icon
                name="dashboard"
                width="28"
                height="28"
                className="mx-auto text-muted"
              />
              <p className="mt-4 text-sm font-medium">No paid sales yet</p>
              <p className="mt-2 text-xs text-muted">
                Sales activity will appear here as orders are paid.
              </p>
            </div>
          )}
          <p className="mt-5 border-t border-light-gray pt-4 text-xs text-muted">
            Sales dates use UTC. Amounts include only paid orders.
          </p>
        </section>
        <div className="space-y-5">
          <section aria-label="Stock alerts" className="admin-card">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold">Stock alerts</h2>
              <Link
                href="/admin/products"
                className="min-h-11 py-3 text-xs underline underline-offset-4"
              >
                Manage stock
              </Link>
            </div>
            {stats.lowStock.length ? (
              <ul className="mt-2 divide-y divide-light-gray">
                {stats.lowStock.slice(0, 5).map((product) => (
                  <li
                    key={product.id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="min-w-0 py-1"
                    >
                      <span className="clamp-2 text-sm font-medium hover:underline">
                        {product.name}
                      </span>
                      <span className="mt-1 block break-all font-mono text-xs text-muted">
                        {product.sku}
                      </span>
                    </Link>
                    <span
                      className={`shrink-0 rounded-md px-2 py-1 text-xs font-medium ${product.stock <= 0 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}`}
                    >
                      {product.stock <= 0
                        ? "Out of stock"
                        : `${product.stock} available`}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-sm text-muted">
                No products are below their stock alert threshold.
              </p>
            )}
          </section>
          <section aria-label="Top products" className="admin-card">
            <h2 className="text-base font-semibold">Top products</h2>
            <p className="mt-1 text-xs text-muted">Ranked by units sold</p>
            {top.length ? (
              <ol className="mt-4 divide-y divide-light-gray">
                {top.map((product, index) => (
                  <li key={product.id} className="flex items-center gap-3 py-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-50 text-xs text-muted">
                      {index + 1}
                    </span>
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="min-w-0 flex-1 text-sm hover:underline"
                    >
                      {product.name}
                    </Link>
                    <span className="shrink-0 text-xs font-medium">
                      {product.sold} sold
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="py-6 text-sm text-muted">
                Products will appear here after their first sale.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
