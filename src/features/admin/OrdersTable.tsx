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
      <p className="admin-eyebrow">Fulfilment</p>
      <h1 className="admin-title">Orders</h1>

      <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted">
        <label className="flex items-center gap-2">
          Status
          <select value={orderStatus} onChange={(e) => setOrderStatus(e.target.value)} className="admin-input !w-auto">
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>{s === "" ? "All" : s}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          Payment
          <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className="admin-input !w-auto">
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>{s === "" ? "All" : s}</option>
            ))}
          </select>
        </label>
      </div>

      {notice && (
        <p role="status" className="mt-4 border border-primary/30 bg-primary/10 p-3 text-sm text-ink">
          {notice}
        </p>
      )}

      {/* Mobile cards — fulfilment at a glance, no horizontal scroll */}
      <ul className="mt-4 space-y-3 md:hidden">
        {rows.map((r) => (
          <li key={r.id} className="admin-card p-4">
            <div className="flex items-center justify-between gap-2">
              <Link href={`/admin/orders/${r.id}`} className="font-mono text-sm text-ink underline underline-offset-4">
                {r.id.slice(-8).toUpperCase()}
              </Link>
              <span className="font-mono text-sm font-semibold text-ink">{formatINR(r.total)}</span>
            </div>
            <p className="mt-1 truncate text-sm text-muted">
              {r.customer.name ?? r.customer.email} · {r.itemCount} item{r.itemCount === 1 ? "" : "s"} ·{" "}
              {new Date(r.createdAt).toLocaleDateString("en-IN")}
            </p>
            <p className="mt-2 flex flex-wrap gap-1.5">
              {r.legacy ? (
                <span className="inline-block rounded-md bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                  LEGACY · READ-ONLY
                </span>
              ) : (
                <>
                  <span className="inline-flex items-center gap-2 text-xs"><span className="text-muted">Order</span><StatusPill status={r.orderStatus} /></span>
                  <span className="inline-flex items-center gap-2 text-xs"><span className="text-muted">Payment</span><StatusPill status={r.paymentStatus} /></span>
                </>
              )}
            </p>
          </li>
        ))}
        {rows.length === 0 && !loading && (
          <li className="border border-light-gray p-8 text-center text-sm text-muted">
            No orders match.
          </li>
        )}
        {loading && (
          <li className="border border-light-gray p-8 text-center text-sm text-muted">
            Loading…
          </li>
        )}
      </ul>

      <div className="mt-4 hidden overflow-x-auto rounded-lg border border-light-gray md:block">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-light-gray bg-slate-50">
              <th className="p-3 text-xs font-medium text-muted">Order</th>
              <th className="p-3 text-xs font-medium text-muted">Customer</th>
              <th className="p-3 text-xs font-medium text-muted">Items</th>
              <th className="p-3 text-xs font-medium text-muted">Total</th>
              <th className="p-3 text-xs font-medium text-muted">Status</th>
              <th className="p-3 text-xs font-medium text-muted">Payment</th>
              <th className="p-3 text-xs font-medium text-muted">Placed</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-light-gray last:border-0 hover:bg-slate-50">
                <td className="p-3">
                  <Link href={`/admin/orders/${r.id}`} className="font-mono text-ink underline underline-offset-4 hover:text-primary">
                    {r.id.slice(-8).toUpperCase()}
                  </Link>
                </td>
                <td className="max-w-[180px] truncate p-3 text-ink">{r.customer.name ?? r.customer.email}</td>
                <td className="p-3 text-ink">{r.itemCount}</td>
                <td className="p-3 font-mono text-ink">{formatINR(r.total)}</td>
                <td className="p-3">
                  {r.legacy ? (
                    <span className="inline-block rounded-md bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                      LEGACY
                    </span>
                  ) : (
                    <StatusPill status={r.orderStatus} />
                  )}
                </td>
                <td className="p-3">{r.legacy ? <span className="text-muted">—</span> : <StatusPill status={r.paymentStatus} />}</td>
                <td className="p-3 text-muted">{new Date(r.createdAt).toLocaleDateString("en-IN")}</td>
              </tr>
            ))}
            {rows.length === 0 && !loading && (
              <tr><td colSpan={7} className="p-8 text-center text-muted">No orders match.</td></tr>
            )}
            {loading && (
              <tr><td colSpan={7} className="p-8 text-center text-muted">Loading…</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <button type="button" disabled={pagination.page <= 1} onClick={() => void load(pagination.page - 1)} className="border border-light-gray px-5 py-2 text-muted disabled:opacity-40 hover:border-primary hover:text-primary">
            ← Previous
          </button>
          <span className="text-muted">{pagination.page} / {pagination.totalPages} ({pagination.total})</span>
          <button type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => void load(pagination.page + 1)} className="border border-light-gray px-5 py-2 text-muted disabled:opacity-40 hover:border-primary hover:text-primary">
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
