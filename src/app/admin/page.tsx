import type { Metadata } from "next";
import Link from "next/link";
import { getDashboardStats } from "@/services/admin-dashboard-service";
import { formatINR } from "@/utils/format";

export const metadata: Metadata = {
  title: "Admin — SatvaStones",
  description: "SatvaStones store management.",
};

export const dynamic = "force-dynamic";

const SECTIONS = [
  { href: "/admin/products", label: "Products", body: "Create, publish, price and stock the catalogue." },
  { href: "/admin/categories", label: "Categories", body: "Organise departments and subcategories." },
  { href: "/admin/orders", label: "Orders", body: "Fulfil, track, cancel and refund customer orders." },
  { href: "/admin/reviews", label: "Reviews", body: "Moderate what shoppers say." },
  { href: "/admin/coupons", label: "Coupons", body: "Create codes, caps and first-order treats." },
  { href: "/admin/banners", label: "Banners", body: "Dress the homepage hero." },
] as const;

export default async function AdminHome() {
  const stats = await getDashboardStats();
  const kpis: { label: string; value: string; accent?: boolean }[] = [
    { label: "Total sales", value: formatINR(stats.totalSales), accent: true },
    { label: "Today", value: formatINR(stats.todaySales) },
    { label: "Paid orders", value: String(stats.paidOrderCount) },
    { label: "All orders", value: String(stats.orderCount) },
    { label: "Avg order value", value: formatINR(stats.avgOrderValue) },
    { label: "Units sold", value: String(stats.productsSold) },
    { label: "Customers", value: String(stats.customerCount) },
    { label: "Pending", value: String(stats.pendingOrders) },
  ];
  const maxDay = Math.max(1, ...stats.salesByDay.map((d) => d.sales));

  return (
    <div>
      {/* Header */}
      <div className="mb-8 border-b border-ivory/[0.06] pb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#c8a96e]">
          Back office · Namaste, admin
        </p>
        <h1 className="mt-1 font-display italic text-4xl text-ivory sm:text-5xl">
          Dashboard
        </h1>
        <p className="mt-2 max-w-xl text-sm text-ivory/45">
          Sales in ₹, stock alerts and fulfilment — everything priced inclusive of taxes,
          just like the storefront.
        </p>
      </div>

      {/* KPI grid */}
      <section aria-label="Sales overview">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-ivory/30">
          At a glance · All amounts in ₹
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {kpis.map((kpi) => (
            <div key={kpi.label} className={kpi.accent ? "admin-kpi-accent" : "admin-kpi"}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ivory/35">
                {kpi.label}
              </p>
              <p
                className={`mt-1.5 font-mono text-2xl font-semibold ${
                  kpi.accent ? "text-[#c8a96e]" : "text-ivory"
                }`}
              >
                {kpi.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Charts */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* 14-day bar chart */}
        <section
          aria-label="Sales last 14 days"
          className="border border-ivory/[0.07] bg-ivory/[0.03] p-5"
        >
          <h2 className="font-display italic text-2xl text-ivory">Last 14 days</h2>
          {stats.salesByDay.length === 0 ? (
            <p className="mt-3 text-sm text-ivory/35">No paid sales yet.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {stats.salesByDay.map((d) => (
                <li key={d.date} className="flex items-center gap-3 text-xs">
                  <span className="w-20 shrink-0 font-mono text-ivory/35">{d.date}</span>
                  <span
                    aria-hidden="true"
                    style={{ width: `${Math.max(4, Math.round((d.sales / maxDay) * 100))}%` }}
                    className="h-2.5 bg-[#c8a96e]/60 transition-all"
                  />
                  <span className="whitespace-nowrap text-ivory/50">
                    {formatINR(d.sales)} · {d.orders} order{d.orders === 1 ? "" : "s"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Top products + low stock */}
        <section
          aria-label="Top products"
          className="border border-ivory/[0.07] bg-ivory/[0.03] p-5"
        >
          <h2 className="font-display italic text-2xl text-ivory">Top products</h2>
          {stats.topProducts.filter((p) => p.sold > 0).length === 0 ? (
            <p className="mt-3 text-sm text-ivory/35">Nothing sold yet.</p>
          ) : (
            <ol className="mt-4 space-y-2">
              {stats.topProducts
                .filter((p) => p.sold > 0)
                .map((p, i) => (
                  <li key={p.id} className="flex justify-between gap-3 text-sm">
                    <span className="text-ivory/60">
                      <span className="mr-2 font-mono text-ivory/30">{i + 1}</span>
                      {p.name}
                    </span>
                    <span className="shrink-0 font-mono font-semibold text-ivory/80">
                      {p.sold} sold
                    </span>
                  </li>
                ))}
            </ol>
          )}

          {/* Low stock */}
          {stats.lowStock.length > 0 && (
            <div className="mt-5 border-t border-ivory/[0.06] pt-4">
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c8a96e]">
                Low stock
              </h3>
              <ul className="mt-2 space-y-1.5">
                {stats.lowStock.slice(0, 5).map((p) => (
                  <li key={p.id} className="flex justify-between gap-3 text-xs">
                    <span className="font-mono text-ivory/40">{p.sku}</span>
                    <span
                      className={`font-semibold ${p.stock <= 0 ? "text-red-400" : "text-[#c8a96e]"}`}
                    >
                      {p.stock} left
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      {/* Quick navigation sections */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((s) => (
          <Link key={s.href} href={s.href} className="admin-card group">
            <h2 className="font-display italic text-xl text-ivory group-hover:text-[#c8a96e]">
              {s.label}
            </h2>
            <p className="mt-1 text-sm text-ivory/40">{s.body}</p>
            <span aria-hidden="true" className="mt-3 block text-[#c8a96e]/40 group-hover:text-[#c8a96e]">
              →
            </span>
          </Link>
        ))}
        {/* Coming soon */}
        {["Inventory", "Customers"].map((label) => (
          <div
            key={label}
            className="border border-ivory/[0.04] p-6 opacity-40"
            aria-disabled="true"
          >
            <h2 className="font-display italic text-xl text-ivory">{label}</h2>
            <p className="mt-1 text-sm text-ivory/40">Coming soon.</p>
          </div>
        ))}
      </div>
    </div>
  );
}
