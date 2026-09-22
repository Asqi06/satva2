"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Admin order actions: advance status, cancel (unpaid path), refund (paid).
 * Every action confirms first and surfaces server errors inline.
 */
export function AdminOrderActions({
  orderId,
  orderStatus,
  paymentStatus,
}: {
  orderId: string;
  orderStatus: string;
  paymentStatus: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (fn: () => Promise<Response>, confirmMsg: string) => {
    if (!window.confirm(confirmMsg)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fn();
      const body = (await res.json()) as { success: boolean; error?: { message: string } };
      if (!body.success) throw new Error(body.error?.message ?? "Action failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  const advance = (next: string) =>
    run(
      () =>
        fetch(`/api/admin/orders/${orderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderStatus: next }),
        }),
      `Move order to ${next}?`,
    );

  const NEXT: Record<string, string[]> = {
    PENDING: ["CONFIRMED"],
    CONFIRMED: ["PROCESSING"],
    PROCESSING: ["PACKED"],
    PACKED: ["SHIPPED"],
    SHIPPED: ["OUT_FOR_DELIVERY"],
    OUT_FOR_DELIVERY: ["DELIVERED"],
    DELIVERED: ["RETURNED"],
  };
  const options = NEXT[orderStatus] ?? [];
  const cancellable = ["PENDING", "CONFIRMED", "PROCESSING", "PACKED"].includes(orderStatus);
  const refundable = paymentStatus === "PAID";

  return (
    <div className="h-fit border border-ivory/[0.07] bg-ivory/[0.03] p-5">
      <h2 className="font-display italic text-xl text-ivory">Actions</h2>
      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        {options.map((next) => (
          <button
            key={next}
            type="button"
            disabled={busy}
            onClick={() => void advance(next)}
            className="border border-gold bg-gold/10 px-4 py-2 text-gold hover:bg-gold hover:text-ink disabled:opacity-50"
          >
            → {(next ?? "").replaceAll("_", " ")}
          </button>
        ))}
        {cancellable && paymentStatus !== "PAID" && (
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void run(
                () =>
                  fetch(`/api/admin/orders/${orderId}/cancel`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ reason: "Cancelled by admin" }),
                  }),
                "Cancel this order and release its stock?",
              )
            }
            className="border border-red-400/40 px-4 py-2 text-red-400 hover:bg-red-400/10 disabled:opacity-50"
          >
            Cancel order
          </button>
        )}
        {refundable && (
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void run(
                () =>
                  fetch(`/api/admin/orders/${orderId}/refund`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ reason: "Refunded by admin" }),
                  }),
                "Refund this order in full via Razorpay? Stock returns to the shelf.",
              )
            }
            className="border border-red-400/40 px-4 py-2 text-red-400 hover:bg-red-400/10 disabled:opacity-50"
          >
            Refund in full
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
