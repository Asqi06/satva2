"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminReviewRow } from "@/services/review-service";

/** Review moderation queue: hide/unhide + delete. */
export function ReviewsTable() {
  const [rows, setRows] = useState<AdminReviewRow[]>([]);
  const [hiddenOnly, setHiddenOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "20" });
      if (hiddenOnly) params.set("hidden", "true");
      const res = await fetch(`/api/admin/reviews?${params.toString()}`);
      const body = (await res.json()) as {
        success: boolean;
        data?: { reviews: AdminReviewRow[] };
        error?: { message: string };
      };
      if (!body.success || !body.data) throw new Error(body.error?.message ?? "Load failed");
      setRows(body.data.reviews);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [hiddenOnly]);

  // Mount fetch of the moderation queue (async load, not a render cascade).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
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
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Moderation failed");
    }
  };

  const removeOne = async (id: string) => {
    if (!window.confirm("Delete this review permanently?")) return;
    setNotice(null);
    try {
      const res = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
      const body = (await res.json()) as { success: boolean; error?: { message: string } };
      if (!body.success) throw new Error(body.error?.message ?? "Delete failed");
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Delete failed");
    }
  };

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-clay">Voices</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">Reviews</h1>

      <label className="mt-4 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={hiddenOnly}
          onChange={(e) => setHiddenOnly(e.target.checked)}
          className="h-4 w-4 accent-[#b34a2b]"
        />
        Hidden only
      </label>

      {notice && (
        <p role="status" className="mt-4 rounded-2xl border border-ink/10 bg-white/60 p-3 text-sm">
          {notice}
        </p>
      )}

      <ul className="mt-4 space-y-3">
        {rows.map((r) => (
          <li key={r.id} className="rounded-2xl border border-ink/10 bg-white/60 p-4 text-sm">
            <p className="flex flex-wrap items-center gap-2">
              <strong>{r.productName}</strong>
              <span className="text-clay">{"★".repeat(r.rating)}</span>
              {r.isVerifiedPurchase && (
                <span className="rounded-full bg-green-800/10 px-2 py-0.5 text-xs font-semibold text-green-800">
                  Verified
                </span>
              )}
              {!r.isPublished && (
                <span className="rounded-full bg-clay/15 px-2 py-0.5 text-xs font-semibold text-clay">
                  Hidden
                </span>
              )}
            </p>
            <p className="mt-1 text-ink/80">
              {r.comment ?? <span className="text-ink/50">(no comment)</span>}
            </p>
            <p className="mt-1 text-xs text-ink/60">
              {r.authorName} · {new Date(r.createdAt).toLocaleDateString("en-IN")}
            </p>
            <span className="mt-2 flex gap-3">
              <button
                type="button"
                onClick={() => void moderate(r.id, !r.isPublished)}
                className="underline underline-offset-4"
              >
                {r.isPublished ? "Hide" : "Publish"}
              </button>
              <button
                type="button"
                onClick={() => void removeOne(r.id)}
                className="underline underline-offset-4 hover:text-clay"
              >
                Delete
              </button>
            </span>
          </li>
        ))}
        {rows.length === 0 && !loading && (
          <li className="rounded-2xl border border-ink/10 bg-white/30 p-8 text-center text-sm text-ink/60">
            Nothing in this view.
          </li>
        )}
        {loading && <li className="p-8 text-center text-sm text-ink/60">Loading…</li>}
      </ul>
    </div>
  );
}
