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
      <p className="admin-eyebrow">Voices</p>
      <h1 className="admin-title">Reviews</h1>

      <label className="mt-4 flex items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          checked={hiddenOnly}
          onChange={(e) => setHiddenOnly(e.target.checked)}
          className="h-4 w-4 accent-primary"
        />
        Hidden only
      </label>

      {notice && (
        <p role="status" className="mt-4 border border-primary/30 bg-primary/10 p-3 text-sm text-ink">
          {notice}
        </p>
      )}

      <ul className="mt-4 space-y-3">
        {rows.map((r) => (
          <li key={r.id} className="admin-card p-4 text-sm">
            <p className="flex flex-wrap items-center gap-2">
              <strong className="text-ink">{r.productName}</strong>
              <span className="text-primary">{"★".repeat(r.rating)}</span>
              {r.isVerifiedPurchase && (
                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                  Verified
                </span>
              )}
              {!r.isPublished && (
                <span className="rounded-md bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                  Hidden
                </span>
              )}
            </p>
            <p className="mt-1 text-ink">
              {r.comment ?? <span className="text-muted">(no comment)</span>}
            </p>
            <p className="mt-1 text-xs text-muted">
              {r.authorName} · {new Date(r.createdAt).toLocaleDateString("en-IN")}
            </p>
            <span className="mt-2 flex gap-3 text-muted">
              <button
                type="button"
                onClick={() => void moderate(r.id, !r.isPublished)}
                className="underline underline-offset-4 hover:text-ink"
              >
                {r.isPublished ? "Hide" : "Publish"}
              </button>
              <button
                type="button"
                onClick={() => void removeOne(r.id)}
                className="underline underline-offset-4 hover:text-red-700"
              >
                Delete
              </button>
            </span>
          </li>
        ))}
        {rows.length === 0 && !loading && (
          <li className="border border-light-gray p-8 text-center text-sm text-muted">
            Nothing in this view.
          </li>
        )}
        {loading && <li className="p-8 text-center text-sm text-muted">Loading…</li>}
      </ul>
      {pagination.totalPages > 1 && (
        <nav aria-label="Review pages" className="mt-4 flex items-center justify-center gap-3 text-sm">
          <button type="button" disabled={loading || pagination.page <= 1} onClick={() => void load(pagination.page - 1)} className="border border-light-gray px-4 py-2 text-muted disabled:opacity-40">Previous</button>
          <span className="text-muted">{pagination.page} / {pagination.totalPages} ({pagination.total})</span>
          <button type="button" disabled={loading || pagination.page >= pagination.totalPages} onClick={() => void load(pagination.page + 1)} className="border border-light-gray px-4 py-2 text-muted disabled:opacity-40">Next</button>
        </nav>
      )}
    </div>
  );
}
