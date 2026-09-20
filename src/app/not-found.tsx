import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center overflow-hidden bg-ivory px-6 py-32 text-center text-ink">
      {/* Giant 404 */}
      <p
        aria-hidden="true"
        className="select-none font-display italic text-[clamp(6rem,20vw,16rem)] leading-none tracking-tighter text-ink/[0.06]"
      >
        404
      </p>

      {/* Overlay text */}
      <div className="-mt-8 sm:-mt-16 lg:-mt-24">
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#c8a96e] animate-fade-up">
          Lost in transit
        </p>
        <h1 className="mt-3 font-display italic text-5xl tracking-tight sm:text-6xl animate-fade-up delay-100">
          This page doesn&apos;t exist.
        </h1>
        <p className="mt-4 text-sm text-ink/50 animate-fade-up delay-200">
          The link may be broken, or the page may have moved.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4 animate-fade-up delay-300">
          <Link
            href="/"
            className="bg-[#0a0a0a] px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-ivory transition-colors hover:bg-[#c8a96e] hover:text-[#0a0a0a]"
          >
            Go home
          </Link>
          <Link
            href="/shop"
            className="border border-ink/20 px-8 py-4 text-sm font-medium text-ink/60 transition-colors hover:border-ink hover:text-ink"
          >
            Browse the shop
          </Link>
        </div>
      </div>
    </div>
  );
}
