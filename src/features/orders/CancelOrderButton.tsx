"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Customer cancel (PENDING orders only). */
export function CancelOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancel = async () => {
    if (!window.confirm("Cancel this order? Reserved stock returns to the shelf.")) return;
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
        className="rounded-full border border-clay/50 px-5 py-2 text-sm text-clay hover:bg-clay hover:text-ivory disabled:opacity-50"
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
