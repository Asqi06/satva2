"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Customer cancel (PENDING orders only). */
export function CancelOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancel = async () => {
    if (!window.confirm("Cancel this unpaid order?")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const body = (await res.json()) as { success: boolean; error?: { message: string } };
      if (!body.success) throw new Error(body.error?.message ?? "Cancel failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cancel failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <span>
      <button
        type="button"
        disabled={busy}
        onClick={() => void cancel()}
        className="btn-ghost"
      >
        {busy ? "Cancelling…" : "Cancel order"}
      </button>
      {error && (
        <span role="alert" className="ml-3 text-sm text-clay">
          {error}
        </span>
      )}
    </span>
  );
}
