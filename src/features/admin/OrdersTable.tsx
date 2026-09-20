"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { AdminOrderRow, Pagination } from "@/services/admin-order-service";
import { formatINR } from "@/utils/format";
import { StatusPill } from "@/features/orders/OrderTimeline";

type ApiEnvelope =
  | { success: true; data: { orders: AdminOrderRow[]; pagination: Pagination } }
  | { success: false; error: { code: string; message: string } };

const ORDER_STATUSES = ["", "PENDING", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "REFUNDED", "RETURNED"];
const PAYMENT_STATUSES = ["", "PENDING", "PAID", "FAILED", "REFUNDED"];

/** Admin order queue: filters + status pills + detail links. */
export function OrdersTable() {
  const [rows, setRows] = useState<AdminOrderRow[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [orderStatus, setOrderStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (orderStatus) params.set("orderStatus", orderStatus);
      if (paymentStatus) params.set("paymentStatus", paymentStatus);
      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      const body = (await res.json()) as ApiEnvelope;
      if (!body.success) throw new Error(body.error.message);
      setRows(body.data.orders);
      setPagination(body.data.pagination);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [orderStatus, paymentStatus]);

  // Mount fetch of the order queue (async load, not a render cascade).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(1);
  }, [load]);

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-clay">Fulfilment</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">Orders</h1>

      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <label className="flex items-center gap-2">
          Status
          <select value={orderStatus} onChange={(e) => setOrderStatus(e.target.value)} className="rounded-full border border-ink/15 bg-white/70 px-3 py-1.5">
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>{s === "" ? "All" : s}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          Payment
          <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className="rounded-full border border-ink/15 bg-white/70 px-3 py-1.5">
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>{s === "" ? "All" : s}</option>
            ))}
          </select>
        </label>
      </div>

      {notice && (
        <p role="status" className="mt-4 rounded-2xl border border-ink/10 bg-white/60 p-3 text-sm">
          {notice}
        </p>
      )}

      {/* Mobile cards — fulfilment at a glance, no horizontal scroll */}
      <ul className="mt-4 space-y-3 md:hidden">
        {rows.map((r) => (
          <li key={r.id} className="rounded-2xl border border-ink/10 bg-white/60 p-4">
            <div className="flex items-center justify-between gap-2">
              <Link href={`/admin/orders/${r.id}`} className="font-mono text-sm underline underline-offset-4">
                {r.id.slice(-8).toUpperCase()}
              </Link>
              <span className="font-mono text-sm font-semibold">{formatINR(r.total)}</span>
            </div>
            <p className="mt-1 truncate text-sm text-ink/60">
              {r.customer.name ?? r.customer.email} · {r.itemCount} item{r.itemCount === 1 ? "" : "s"} ·{" "}
              {new Date(r.createdAt).toLocaleDateString("en-IN")}
            </p>
            <p className="mt-2 flex flex-wrap gap-1.5">
              <StatusPill status={r.orderStatus} />
              <StatusPill status={r.paymentStatus} />
            </p>
          </li>
        ))}
        {rows.length === 0 && !loading && (
          <li className="rounded-2xl border border-ink/10 bg-white/60 p-8 text-center text-sm text-ink/60">
            No orders match.
          </li>
        )}
        {loading && (
          <li className="rounded-2xl border border-ink/10 bg-white/60 p-8 text-center text-sm text-ink/60">
            Loading…
          </li>
        )}
      </ul>

      <div className="mt-4 hidden overflow-x-auto rounded-2xl border border-ink/10 bg-white/60 md:block">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-ink/60">
              <th className="p-3">Order</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Items</th>
              <th className="p-3">Total</th>
              <th className="p-3">Status</th>
              <th className="p-3">Payment</th>
              <th className="p-3">Placed</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-ink/5 last:border-0">
                <td className="p-3">
                  <Link href={`/admin/orders/${r.id}`} className="font-mono underline underline-offset-4">
                    {r.id.slice(-8).toUpperCase()}
                  </Link>
                </td>
                <td className="p-3">{r.customer.name ?? r.customer.email}</td>
                <td className="p-3">{r.itemCount}</td>
                <td className="p-3">{formatINR(r.total)}</td>
                <td className="p-3"><StatusPill status={r.orderStatus} /></td>
                <td className="p-3"><StatusPill status={r.paymentStatus} /></td>
                <td className="p-3 text-ink/60">{new Date(r.createdAt).toLocaleDateString("en-IN")}</td>
              </tr>
            ))}
            {rows.length === 0 && !loading && (
              <tr><td colSpan={7} className="p-8 text-center text-ink/60">No orders match.</td></tr>
            )}
            {loading && (
              <tr><td colSpan={7} className="p-8 text-center text-ink/60">Loading…</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <button type="button" disabled={pagination.page <= 1} onClick={() => void load(pagination.page - 1)} className="rounded-full border border-ink/20 px-5 py-2 disabled:opacity-40">
            ← Previous
          </button>
          <span className="text-ink/60">{pagination.page} / {pagination.totalPages} ({pagination.total})</span>
          <button type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => void load(pagination.page + 1)} className="rounded-full border border-ink/20 px-5 py-2 disabled:opacity-40">
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
