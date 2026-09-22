/** Gold ring spinner loading state. Uses CSS animation from globals.css. */
export default function Loading() {
  return (
    <div
      className="flex min-h-[50vh] flex-col items-center justify-center gap-5 bg-ivory"
      role="status"
      aria-label="Loading"
    >
      {/* Spinning gold ring */}
      <span
        aria-hidden="true"
        className="animate-spin-ring block h-10 w-10 rounded-full border-2 border-gold/20 border-t-gold"
      />
      <p className="font-display italic text-xl text-muted">Loading…</p>
    </div>
  );
}
