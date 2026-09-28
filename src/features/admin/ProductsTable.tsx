"use client";

import Link from "next/link";
import { CloudinaryImage as Image } from "@/components/CloudinaryImage";
import { Icon } from "@/components/Icon";
import { useCallback, useEffect, useState } from "react";
import type { AdminProductRow, Pagination } from "@/services/product-service";
import type { BulkAction } from "@/schemas/product";
import { formatINR } from "@/utils/format";

type ApiEnvelope =
  | { success: true; data: { products: AdminProductRow[]; pagination: Pagination } }
  | { success: false; error: { code: string; message: string } };

/** Admin product table: search, publish toggle, duplicate, delete, bulk. */
export function ProductsTable() {
  const [rows, setRows] = useState<AdminProductRow[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const load = useCallback(async (page: number, term: string) => {
    setLoading(true);
    setNotice(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (term.trim()) params.set("q", term.trim());
      const res = await fetch(`/api/admin/products?${params.toString()}`);
      const body = (await res.json()) as ApiEnvelope;
      if (!body.success) throw new Error(body.error.message);
      setRows(body.data.products);
      setPagination(body.data.pagination);
      setSelected(new Set());
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Mount fetch: the canonical exception to set-state-in-effect (async load, not a render cascade).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(1, "");
  }, [load]);

  const mutate = useCallback(
    async (action: BulkAction["action"], ids: string[], confirmMsg?: string) => {
      if (confirmMsg && !window.confirm(confirmMsg)) return;
      setNotice(null);
      try {
        const res = await fetch("/api/admin/products/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, ids }),
        });
        const body = (await res.json()) as
          | { success: true; data: { modified: number } }
          | { success: false; error: { message: string } };
        if (!body.success) throw new Error(body.error.message);
        setNotice(`${body.data.modified} product(s) updated.`);
        await load(pagination.page, q);
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Action failed");
      }
    },
    [load, pagination.page, q],
  );

  const removeOne = useCallback(
    async (id: string, name: string) => {
      if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
      setNotice(null);
      try {
        const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
        const body = (await res.json()) as { success: boolean; error?: { message: string } };
        if (!body.success) throw new Error(body.error?.message ?? "Delete failed");
        setNotice("Product deleted.");
        await load(pagination.page, q);
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Delete failed");
      }
    },
    [load, pagination.page, q],
  );

  const duplicateOne = useCallback(
    async (id: string) => {
      setNotice(null);
      try {
        const res = await fetch(`/api/admin/products/${id}/duplicate`, { method: "POST" });
        const body = (await res.json()) as
          | { success: true; data: { id: string } }
          | { success: false; error: { message: string } };
        if (!body.success) throw new Error(body.error.message);
        setNotice("Duplicated as an unpublished copy.");
        await load(pagination.page, q);
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Duplicate failed");
      }
    },
    [load, pagination.page, q],
  );

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="admin-eyebrow">
            Catalogue
          </p>
          <h1 className="admin-title">Products</h1>
        </div>
        <Link
          href="/admin/products/new"
          className="btn-primary"
        >
          + New product
        </Link>
      </div>

      <form
        className="admin-card flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          void load(1, q);
        }}
      >
        <input
          type="search"
          aria-label="Search products"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, SKU, slug…"
          className="admin-input w-full px-4 py-2.5 text-base sm:max-w-sm sm:py-2 sm:text-sm"
        />
        <button
          type="submit" disabled={loading}
          className="btn-ghost"
        >
          Search
        </button>
      </form>

      {notice && (
        <p role="status" className="mt-4 border border-primary/30 bg-primary/10 p-3 text-sm text-ink">
          {notice}
        </p>
      )}

      {selected.size > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border border-light-gray bg-slate-50 p-3 text-sm">
          <span className="text-muted">{selected.size} selected:</span>
          {(["publish", "unpublish", "feature", "unfeature", "delete"] as const).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() =>
                void mutate(
                  a,
                  [...selected],
                  a === "delete" ? `Delete ${selected.size} product(s)? This cannot be undone.` : undefined,
                )
              }
              className={`border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${
                a === "delete"
                  ? "border-red-200 text-red-700 hover:bg-red-50"
                  : "border-light-gray text-muted hover:border-primary hover:text-primary"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      )}

      {/* Mobile cards — full actions without horizontal scrolling */}
      <ul className="mt-4 space-y-3 md:hidden">
        {rows.map((r) => (
          <li key={r.id} className="admin-card p-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                aria-label={`Select ${r.name}`}
                checked={selected.has(r.id)}
                onChange={() => toggleSelect(r.id)}
                className="mt-1 h-5 w-5 shrink-0 accent-primary"
              />
              <div className="min-w-0 flex-1">
                <Link href={`/admin/products/${r.id}/edit`} className="clamp-2 font-medium text-ink hover:underline">{r.name}</Link>
                <p className="mt-0.5 font-mono text-xs text-muted">{r.sku}</p>
                <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-mono text-ink">{formatINR(r.price)}</span>
                  <span className="text-xs text-muted">Stock {r.stock}{r.reservedStock > 0 && ` · ${r.reservedStock} reserved`}</span>
                  {r.stock - r.reservedStock <= r.lowStockThreshold && (
                    <span className="bg-primary/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                      low
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                      r.isPublished ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-muted"
                    }`}
                  >
                    {r.isPublished ? "Live" : "Draft"}
                  </span>
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 border-t border-light-gray pt-3 text-sm">
              <Link href={`/admin/products/${r.id}/edit`} className="text-muted underline underline-offset-4">
                Edit
              </Link>
              <button
                type="button"
                onClick={() => void mutate(r.isPublished ? "unpublish" : "publish", [r.id])}
                className="text-muted underline underline-offset-4"
              >
                {r.isPublished ? "Unpublish" : "Publish"}
              </button>
              <button type="button" onClick={() => void duplicateOne(r.id)} className="text-muted underline underline-offset-4">
                Duplicate
              </button>
              <button type="button" onClick={() => void removeOne(r.id, r.name)} className="text-red-700 underline underline-offset-4">
                Delete
              </button>
            </div>
          </li>
        ))}
        {rows.length === 0 && !loading && (
          <li className="border border-light-gray p-10 text-center text-muted">
            No products in this view. Try another search or create a product.
          </li>
        )}
        {loading && (
          <li className="border border-light-gray p-10 text-center text-muted">Loading…</li>
        )}
      </ul>

      <div className="mt-4 hidden overflow-x-auto rounded-lg border border-light-gray md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-light-gray bg-slate-50">
              <th className="p-3 text-xs font-medium text-muted">
                <span className="sr-only">Select</span>
              </th>
              {["Product", "SKU", "Price", "Stock", "Status", "Actions"].map((h) => (
                <th
                  key={h}
                  className="p-3 text-xs font-medium text-muted"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-light-gray last:border-0 hover:bg-slate-50">
                <td className="p-3">
                  <input
                    type="checkbox"
                    aria-label={`Select ${r.name}`}
                    checked={selected.has(r.id)}
                    onChange={() => toggleSelect(r.id)}
                    className="h-4 w-4 accent-primary"
                  />
                </td>
                <td className="p-3"><Link href={`/admin/products/${r.id}/edit`} className="flex min-w-[180px] max-w-[280px] items-center gap-3 font-medium hover:underline"><span className="relative flex h-12 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-slate-50">{r.images[0] ? <Image src={r.images[0].secureUrl} alt="" fill sizes="40px" className="object-cover" /> : <Icon name="box" />}</span><span className="clamp-2">{r.name}</span></Link></td>
                <td className="p-3 font-mono text-xs text-muted">{r.sku}</td>
                <td className="p-3 font-mono text-ink">{formatINR(r.price)}</td>
                <td className="p-3 text-ink">
                  {r.stock}
                  {r.reservedStock > 0 && <span className="mt-1 block text-xs text-muted">{r.reservedStock} reserved</span>}
                  {r.stock - r.reservedStock <= r.lowStockThreshold && (
                    <span className="ml-2 bg-primary/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                      low
                    </span>
                  )}
                </td>
                <td className="p-3">
                  <span
                    className={`px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                      r.isPublished
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-50 text-muted"
                    }`}
                  >
                    {r.isPublished ? "Live" : "Draft"}
                  </span>
                </td>
                <td className="p-3">
                  <span className="flex flex-wrap gap-3 text-xs">
                    <Link
                      href={`/admin/products/${r.id}/edit`}
                      className="text-muted underline underline-offset-4 hover:text-ink"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => void mutate(r.isPublished ? "unpublish" : "publish", [r.id])}
                      className="text-muted underline underline-offset-4 hover:text-ink"
                    >
                      {r.isPublished ? "Unpublish" : "Publish"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void duplicateOne(r.id)}
                      className="text-muted underline underline-offset-4 hover:text-ink"
                    >
                      Duplicate
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeOne(r.id, r.name)}
                      className="text-red-700 underline underline-offset-4 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="p-10 text-center text-muted">
                  No products in this view. Try another search or create a product.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={7} className="p-10 text-center text-muted">
                  Loading…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-3 text-sm">
          <button
            type="button"
            disabled={pagination.page <= 1}
            onClick={() => void load(pagination.page - 1, q)}
            className="border border-light-gray px-5 py-2 text-muted disabled:opacity-40 hover:border-primary hover:text-primary"
          >
            ← Previous
          </button>
          <span className="text-muted">
            {pagination.page} / {pagination.totalPages} ({pagination.total})
          </span>
          <button
            type="button"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => void load(pagination.page + 1, q)}
            className="border border-light-gray px-5 py-2 text-muted disabled:opacity-40 hover:border-primary hover:text-primary"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
