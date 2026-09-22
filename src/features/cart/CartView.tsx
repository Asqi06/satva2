"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useBag } from "@/features/cart/CartProvider";
import { cloudinaryResize } from "@/utils/cloudinary-url";
import { formatINR } from "@/utils/format";

/** Full-page bag. Shares live state with the drawer via CartProvider. */
export function CartView() {
  const { lines, count, subtotal, loading, setQty, remove, notice } = useBag();
  const [shipThreshold, setShipThreshold] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/settings");
        const body = (await res.json()) as { success: boolean; data?: { freeShippingThreshold: number } };
        if (body.success && body.data) setShipThreshold(body.data.freeShippingThreshold);
      } catch {
        // Static reassurance copy below covers the fallback.
      }
    })();
  }, []);

  const missing = shipThreshold !== null ? Math.max(0, shipThreshold - subtotal) : null;
  const progress = shipThreshold !== null && shipThreshold > 0 ? Math.min(100, (subtotal / shipThreshold) * 100) : 0;

  return (
    <div className="min-h-full flex-1 bg-ivory text-ink">
      {/* Page header */}
      <div className="border-b border-light-gray">
        <div className="mx-auto w-full max-w-7xl px-6 pb-10 pt-12 sm:px-10">
          <p className="eyebrow">
            Your bag · Prices in ₹, taxes included
          </p>
          <h1 className="section-title mt-2 text-6xl tracking-tight sm:text-7xl">
            {count > 0
              ? `${count} piece${count === 1 ? "" : "s"}`
              : "Empty bag"}
          </h1>
          {missing !== null && missing > 0 && lines.length > 0 && (
            <div className="mt-5 max-w-md">
              <p className="text-sm text-warm-gray">
                Add <strong className="text-ink">{formatINR(missing)}</strong> more for <strong className="text-ink">free shipping</strong>
              </p>
              <div className="ship-progress mt-2" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Progress to free shipping">
                <span style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
          {missing === 0 && lines.length > 0 && (
            <p className="mt-5 inline-block bg-mehendi px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-ivory">
              ✓ You unlocked free shipping
            </p>
          )}
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-6 py-10 sm:px-10">
        {/* Notice */}
        {notice && (
          <p
            role="status"
            className="mb-6 border border-gold/40 bg-gold/10 px-5 py-3 text-sm"
          >
            {notice}
          </p>
        )}

        {loading ? (
          <p className="text-sm text-muted">Loading your bag…</p>
        ) : lines.length === 0 ? (
          <div className="mt-4 border border-light-gray bg-white/50 px-6 py-20 text-center">
            <p className="eyebrow">Empty bag</p>
            <p className="mt-2 font-display italic text-4xl">Nothing here yet.</p>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted">
              Pretty things are waiting in the shop — starting under ₹499, gift-ready always.
            </p>
            <Link href="/shop" className="btn-primary mt-7">
              Browse the shop →
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            {/* Line items */}
            <ul className="space-y-3">
              {lines.map((line) => (
                <li
                  key={line.key}
                  className="flex gap-3 border border-light-gray bg-white/60 p-3 sm:gap-5 sm:p-4"
                >
                  {/* Thumbnail */}
                  <Link href={`/products/${line.slug}`} tabIndex={-1} aria-hidden="true" className="shrink-0">
                    <span className="relative block h-24 w-20 overflow-hidden bg-cream sm:h-28 sm:w-24">
                      {line.image ? (
                        <Image
                          src={cloudinaryResize(line.image.secureUrl, 200)}
                          alt=""
                          fill
                          sizes="96px"
                          loading="lazy"
                          decoding="async"
                          className="object-cover"
                        />
                      ) : (
                        <span className="flex h-full items-center justify-center font-display italic text-3xl text-ink/20">
                          S
                        </span>
                      )}
                    </span>
                  </Link>

                  {/* Info */}
                  <div className="flex w-full min-w-0 flex-col">
                    <Link
                      href={`/products/${line.slug}`}
                      className="font-display italic text-xl leading-snug hover:text-gold"
                    >
                      {line.name}
                    </Link>
                    {line.variantSku && (
                      <p className="text-xs text-muted">{line.variantSku}</p>
                    )}
                    <p className="mt-1 font-mono text-base font-semibold">
                      {formatINR(line.price)}
                    </p>

                    {line.available === false && (
                      <p className="text-xs text-red-700">Unavailable — remove to continue</p>
                    )}
                    {line.adjusted && (
                      <p className="text-xs text-gold">Adjusted to available stock</p>
                    )}

                    {/* Qty stepper + remove */}
                    <div className="mt-3 flex items-center gap-4">
                      <label>
                        <span className="sr-only">Quantity for {line.name}</span>
                        <span className="flex items-center border border-light-gray">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            onClick={() => void setQty(line.key, line.qty - 1)}
                            className="px-3 py-1.5 text-sm text-muted transition-colors hover:text-ink"
                          >
                            −
                          </button>
                          <span aria-live="polite" className="w-8 text-center text-sm font-medium">
                            {line.qty}
                          </span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            onClick={() => void setQty(line.key, line.qty + 1)}
                            className="px-3 py-1.5 text-sm text-muted transition-colors hover:text-ink"
                          >
                            +
                          </button>
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => void remove(line.key)}
                        className="text-xs text-muted underline underline-offset-4 hover:text-ink"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Line total (desktop) */}
                  <p className="hidden shrink-0 font-mono text-base font-semibold sm:block">
                    {formatINR(line.price * line.qty)}
                  </p>
                </li>
              ))}
            </ul>

            {/* Order summary sidebar */}
            <aside className="h-fit border border-light-gray bg-white/60 p-6">
              <h2 className="font-display italic text-2xl">Summary</h2>
              <div className="mt-4 space-y-2 border-t border-light-gray pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Subtotal</span>
                  <span className="font-mono font-semibold">{formatINR(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Shipping</span>
                  <span className="text-muted">Calculated at checkout</span>
                </div>
              </div>
              <div className="mt-4 flex justify-between border-t border-light-gray pt-4">
                <span className="font-medium">Estimated total</span>
                <span className="font-mono text-xl font-semibold">{formatINR(subtotal)}</span>
              </div>
              <p className="mt-1 text-xs text-muted">Taxes included. Shipping calculated at checkout.</p>
              <Link
                href="/checkout"
                className="btn-primary mt-6 block text-center"
              >
                Proceed to checkout
              </Link>
              <p className="mt-3 text-center text-xs leading-5 text-muted">
                UPI • Cards • Netbanking · 🎁 gift box free · 7-day easy cover
              </p>
              <Link
                href="/shop"
                className="mt-3 block text-center text-xs text-muted underline underline-offset-4 hover:text-ink"
              >
                Continue shopping
              </Link>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
