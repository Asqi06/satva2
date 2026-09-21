/** Status badge + order timeline (shared by account light + admin dark views). */

const TONE_LIGHT: Record<string, string> = {
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

const TONE_DARK: Record<string, string> = {
  PENDING: "bg-[#d9a441]/20 text-[#d9a441]",
  CONFIRMED: "bg-[#c8a96e]/15 text-[#c8a96e]",
  PROCESSING: "bg-[#c8a96e]/15 text-[#c8a96e]",
  PACKED: "bg-[#c8a96e]/15 text-[#c8a96e]",
  SHIPPED: "bg-[#c8a96e]/15 text-[#c8a96e]",
  OUT_FOR_DELIVERY: "bg-[#c8a96e]/15 text-[#c8a96e]",
  DELIVERED: "bg-emerald-400/15 text-emerald-400",
  CANCELLED: "bg-red-400/15 text-red-400",
  RETURNED: "bg-red-400/15 text-red-400",
  REFUNDED: "bg-red-400/15 text-red-400",
  PAID: "bg-emerald-400/15 text-emerald-400",
  FAILED: "bg-red-400/15 text-red-400",
  AUTHORIZED: "bg-[#d9a441]/20 text-[#d9a441]",
};

export function StatusPill({ status, dark = false }: { status: string | null | undefined; dark?: boolean }) {
  const label = status ?? "UNKNOWN";
  const tones = dark ? TONE_DARK : TONE_LIGHT;
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${tones[label] ?? (dark ? "border border-ivory/25 text-ivory/70" : "border border-ink/20")}`}
    >
      {label.replaceAll("_", " ")}
    </span>
  );
}

export function OrderTimeline({
  timeline,
  dark = false,
}: {
  timeline: { status: string; at: string; note?: string }[] | null | undefined;
  dark?: boolean;
}) {
  if (!timeline || timeline.length === 0) return null;
  return (
    <ol aria-label="Order timeline" className={`relative space-y-4 border-l pl-5 ${dark ? "border-ivory/15" : "border-ink/15"}`}>
      {timeline.map((entry, i) => {
        const status = entry?.status ?? "UNKNOWN";
        const at = entry?.at ?? "";
        return (
          <li key={`${status}-${at}-${i}`} className="relative">
            <span aria-hidden="true" className="absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full bg-clay" />
            <p className={`text-sm font-semibold ${dark ? "text-ivory" : ""}`}>{status.replaceAll("_", " ")}</p>
            <p className={`text-xs ${dark ? "text-ivory/60" : "text-ink/60"}`}>
              {at ? new Date(at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—"}
              {entry?.note ? ` · ${entry.note}` : ""}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
