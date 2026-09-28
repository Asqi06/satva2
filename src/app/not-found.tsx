import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center overflow-hidden bg-ivory px-6 py-32 text-center text-ink">
      <p className="eyebrow">404 · Page not found</p>

      {/* Overlay text */}
      <div className="mt-3">
        <h1 className="section-title mt-3 text-3xl sm:text-4xl">
          This page doesn&apos;t exist.
        </h1>
        <p className="mt-4 text-sm text-muted animate-fade-up delay-200">
          The link may be broken, or the page may have moved.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4 animate-fade-up delay-300">
          <Link
            href="/"
            className="btn-ghost"
          >
            Go home
          </Link>
          <Link
            href="/shop"
            className="btn-primary"
          >
            Browse the shop
          </Link>
        </div>
      </div>
    </div>
  );
}
