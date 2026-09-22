"use client";

import Link from "next/link";
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
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold">
            Catalogue
          </p>
          <h1 className="mt-1 font-display italic text-4xl text-ivory">Products</h1>
        </div>
        <Link
          href="/admin/products/new"
          className="border border-gold bg-gold/10 px-6 py-2.5 text-sm font-medium text-gold hover:bg-gold hover:text-ink"
        >
          + New product
        </Link>
      </div>

      <form
        className="flex flex-col gap-2 sm:flex-row"
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
          type="submit"
          className="shrink-0 border border-ivory/20 px-5 py-2.5 text-sm text-ivory/60 hover:border-gold hover:text-gold sm:py-2"
        >
          Search
        </button>
      </form>

      {notice && (
        <p role="status" className="mt-4 border border-gold/30 bg-gold/10 p-3 text-sm text-ivory">
          {notice}
        </p>
      )}

      {selected.size > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border border-ivory/[0.08] bg-ivory/[0.04] p-3 text-sm">
          <span className="text-ivory/50">{selected.size} selected:</span>
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
                  ? "border-red-400/30 text-red-400 hover:bg-red-400/10"
                  : "border-ivory/20 text-ivory/50 hover:border-gold hover:text-gold"
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
          <li key={r.id} className="border border-ivory/[0.07] bg-ivory/[0.03] p-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                aria-label={`Select ${r.name}`}
                checked={selected.has(r.id)}
                onChange={() => toggleSelect(r.id)}
                className="mt-1 h-5 w-5 shrink-0 accent-gold"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ivory">{r.name}</p>
                <p className="mt-0.5 font-mono text-xs text-ivory/50">{r.sku}</p>
                <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-mono text-ivory/80">{formatINR(r.price)}</span>
                  <span className="text-xs text-ivory/50">Stock {r.stock}</span>
                  {r.stock - r.reservedStock <= r.lowStockThreshold && (
                    <span className="bg-gold/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-gold">
                      low
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                      r.isPublished ? "bg-emerald-400/15 text-emerald-400" : "bg-ivory/[0.07] text-ivory/35"
                    }`}
                  >
                    {r.isPublished ? "Live" : "Draft"}
                  </span>
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 border-t border-ivory/[0.06] pt-3 text-sm">
              <Link href={`/admin/products/${r.id}/edit`} className="text-ivory/60 underline underline-offset-4">
                Edit
              </Link>
              <button
                type="button"
                onClick={() => void mutate(r.isPublished ? "unpublish" : "publish", [r.id])}
                className="text-ivory/60 underline underline-offset-4"
              >
                {r.isPublished ? "Unpublish" : "Publish"}
              </button>
              <button type="button" onClick={() => void duplicateOne(r.id)} className="text-ivory/60 underline underline-offset-4">
                Duplicate
              </button>
              <button type="button" onClick={() => void removeOne(r.id, r.name)} className="text-red-400/70 underline underline-offset-4">
                Delete
              </button>
            </div>
          </li>
        ))}
        {rows.length === 0 && !loading && (
          <li className="border border-ivory/[0.07] p-10 text-center text-ivory/30">
            No products yet. Create the first one.
          </li>
        )}
        {loading && (
          <li className="border border-ivory/[0.07] p-10 text-center text-ivory/30">Loading…</li>
        )}
      </ul>

      <div className="mt-4 hidden overflow-x-auto border border-ivory/[0.07] md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-ivory/[0.07] bg-ivory/[0.04]">
              <th className="p-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-ivory/30">
                <span className="sr-only">Select</span>
              </th>
              {["Product", "SKU", "Price", "Stock", "Status", "Actions"].map((h) => (
                <th
                  key={h}
                  className="p-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-ivory/30"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-ivory/[0.04] last:border-0 hover:bg-ivory/[0.02]">
                <td className="p-3">
                  <input
                    type="checkbox"
                    aria-label={`Select ${r.name}`}
                    checked={selected.has(r.id)}
                    onChange={() => toggleSelect(r.id)}
                    className="h-4 w-4 accent-gold"
                  />
                </td>
                <td className="p-3 font-medium text-ivory">{r.name}</td>
                <td className="p-3 font-mono text-xs text-ivory/50">{r.sku}</td>
                <td className="p-3 font-mono text-ivory/70">{formatINR(r.price)}</td>
                <td className="p-3 text-ivory/70">
                  {r.stock}
                  {r.stock - r.reservedStock <= r.lowStockThreshold && (
                    <span className="ml-2 bg-gold/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-gold">
                      low
                    </span>
                  )}
                </td>
                <td className="p-3">
                  <span
                    className={`px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                      r.isPublished
                        ? "bg-emerald-400/15 text-emerald-400"
                        : "bg-ivory/[0.07] text-ivory/35"
                    }`}
                  >
                    {r.isPublished ? "Live" : "Draft"}
                  </span>
                </td>
                <td className="p-3">
                  <span className="flex flex-wrap gap-3 text-xs">
                    <Link
                      href={`/admin/products/${r.id}/edit`}
                      className="text-ivory/50 underline underline-offset-4 hover:text-ivory"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => void mutate(r.isPublished ? "unpublish" : "publish", [r.id])}
                      className="text-ivory/50 underline underline-offset-4 hover:text-ivory"
                    >
                      {r.isPublished ? "Unpublish" : "Publish"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void duplicateOne(r.id)}
                      className="text-ivory/50 underline underline-offset-4 hover:text-ivory"
                    >
                      Duplicate
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeOne(r.id, r.name)}
                      className="text-red-400/60 underline underline-offset-4 hover:text-red-400"
                    >
                      Delete
                    </button>
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="p-10 text-center text-ivory/30">
                  No products yet. Create the first one.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={7} className="p-10 text-center text-ivory/30">
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
            className="border border-ivory/20 px-5 py-2 text-ivory/50 disabled:opacity-40 hover:border-gold hover:text-gold"
          >
            ← Previous
          </button>
          <span className="text-ivory/35">
            {pagination.page} / {pagination.totalPages} ({pagination.total})
          </span>
          <button
            type="button"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => void load(pagination.page + 1, q)}
            className="border border-ivory/20 px-5 py-2 text-ivory/50 disabled:opacity-40 hover:border-gold hover:text-gold"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
