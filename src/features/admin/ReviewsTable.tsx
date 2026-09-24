"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminReviewRow } from "@/services/review-service";

/** Review moderation queue: hide/unhide + delete. */
export function ReviewsTable() {
  const [rows, setRows] = useState<AdminReviewRow[]>([]);
  const [hiddenOnly, setHiddenOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });

  const load = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (hiddenOnly) params.set("hidden", "true");
      const res = await fetch(`/api/admin/reviews?${params.toString()}`);
      const body = (await res.json()) as {
        success: boolean;
        data?: { reviews: AdminReviewRow[]; pagination: { page: number; total: number; totalPages: number } };
        error?: { message: string };
      };
      if (!body.success || !body.data) throw new Error(body.error?.message ?? "Load failed");
      setRows(body.data.reviews);
      setPagination(body.data.pagination);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [hiddenOnly]);

  // Mount fetch of the moderation queue (async load, not a render cascade).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(1);
  }, [load]);

  const moderate = async (id: string, isPublished: boolean) => {
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished }),
      });
      const body = (await res.json()) as { success: boolean; error?: { message: string } };
      if (!body.success) throw new Error(body.error?.message ?? "Moderation failed");
      await load(hiddenOnly && isPublished && rows.length === 1 && pagination.page > 1 ? pagination.page - 1 : pagination.page);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Moderation failed");
    }
  };

  const removeOne = async (id: string) => {
    if (!window.confirm("Delete this review permanently?")) return;
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
      const body = (await res.json()) as { success: boolean; error?: { message: string } };
      if (!body.success) throw new Error(body.error?.message ?? "Delete failed");
      await load(rows.length === 1 && pagination.page > 1 ? pagination.page - 1 : pagination.page);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Delete failed");
    }
  };

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold">Voices</p>
      <h1 className="mt-1 font-display italic text-4xl tracking-tight text-ivory">Reviews</h1>

      <label className="mt-4 flex items-center gap-2 text-sm text-ivory/60">
        <input
          type="checkbox"
          checked={hiddenOnly}
          onChange={(e) => setHiddenOnly(e.target.checked)}
          className="h-4 w-4 accent-gold"
        />
        Hidden only
      </label>

      {notice && (
        <p role="status" className="mt-4 border border-gold/30 bg-gold/10 p-3 text-sm text-ivory">
          {notice}
        </p>
      )}

      <ul className="mt-4 space-y-3">
        {rows.map((r) => (
          <li key={r.id} className="border border-ivory/[0.07] bg-ivory/[0.03] p-4 text-sm">
            <p className="flex flex-wrap items-center gap-2">
              <strong className="text-ivory">{r.productName}</strong>
              <span className="text-gold">{"★".repeat(r.rating)}</span>
              {r.isVerifiedPurchase && (
                <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                  Verified
                </span>
              )}
              {!r.isPublished && (
                <span className="rounded-full bg-red-400/15 px-2 py-0.5 text-xs font-semibold text-red-400">
                  Hidden
                </span>
              )}
            </p>
            <p className="mt-1 text-ivory/75">
              {r.comment ?? <span className="text-ivory/40">(no comment)</span>}
            </p>
            <p className="mt-1 text-xs text-ivory/50">
              {r.authorName} · {new Date(r.createdAt).toLocaleDateString("en-IN")}
            </p>
            <span className="mt-2 flex gap-3 text-ivory/60">
              <button
                type="button"
                onClick={() => void moderate(r.id, !r.isPublished)}
                className="underline underline-offset-4 hover:text-ivory"
              >
                {r.isPublished ? "Hide" : "Publish"}
              </button>
              <button
                type="button"
                onClick={() => void removeOne(r.id)}
                className="underline underline-offset-4 hover:text-red-400"
              >
                Delete
              </button>
            </span>
          </li>
        ))}
        {rows.length === 0 && !loading && (
          <li className="border border-ivory/[0.07] p-8 text-center text-sm text-ivory/35">
            Nothing in this view.
          </li>
        )}
        {loading && <li className="p-8 text-center text-sm text-ivory/35">Loading…</li>}
      </ul>
      {pagination.totalPages > 1 && (
        <nav aria-label="Review pages" className="mt-4 flex items-center justify-center gap-3 text-sm">
          <button type="button" disabled={loading || pagination.page <= 1} onClick={() => void load(pagination.page - 1)} className="border border-ivory/20 px-4 py-2 text-ivory/60 disabled:opacity-40">Previous</button>
          <span className="text-ivory/50">{pagination.page} / {pagination.totalPages} ({pagination.total})</span>
          <button type="button" disabled={loading || pagination.page >= pagination.totalPages} onClick={() => void load(pagination.page + 1)} className="border border-ivory/20 px-4 py-2 text-ivory/60 disabled:opacity-40">Next</button>
        </nav>
      )}
    </div>
  );
}
