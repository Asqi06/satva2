/** Status badge + order timeline (shared by account + admin views). */

const TONE: Record<string, string> = {
  PENDING: "bg-marigold/30 text-ink",
  CONFIRMED: "bg-ink text-ivory",
  PROCESSING: "bg-ink text-ivory",
  PACKED: "bg-ink text-ivory",
  SHIPPED: "bg-ink text-ivory",
  OUT_FOR_DELIVERY: "bg-ink text-ivory",
  DELIVERED: "bg-green-800 text-ivory",
  CANCELLED: "bg-clay/15 text-clay",
  RETURNED: "bg-clay/15 text-clay",
  REFUNDED: "bg-clay/15 text-clay",
  PAID: "bg-green-800 text-ivory",
  FAILED: "bg-clay/15 text-clay",
  AUTHORIZED: "bg-marigold/30 text-ink",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${TONE[status] ?? "border border-ink/20"}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

export function OrderTimeline({
  timeline,
}: {
  timeline: { status: string; at: string; note?: string }[];
}) {
  if (timeline.length === 0) return null;
  return (
    <ol aria-label="Order timeline" className="relative space-y-4 border-l border-ink/15 pl-5">
      {timeline.map((entry, i) => (
        <li key={`${entry.status}-${entry.at}-${i}`} className="relative">
          <span aria-hidden="true" className="absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full bg-clay" />
          <p className="text-sm font-semibold">{entry.status.replaceAll("_", " ")}</p>
          <p className="text-xs text-ink/60">
            {new Date(entry.at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
            {entry.note ? ` · ${entry.note}` : ""}
          </p>
        </li>
      ))}
    </ol>
  );
}
