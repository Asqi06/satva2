"use client";

import Image from "next/image";
import Link from "next/link";
import { useBag } from "@/features/cart/CartProvider";
import { formatINR } from "@/utils/format";

/** Full-page bag. Shares live state with the drawer via CartProvider. */
export function CartView() {
  const { lines, count, subtotal, loading, setQty, remove, notice } = useBag();

  return (
    <div className="min-h-full flex-1 bg-ivory text-ink">
      {/* Page header */}
      <div className="border-b border-ink/[0.07]">
        <div className="mx-auto w-full max-w-7xl px-6 pb-10 pt-12 sm:px-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#c8a96e]">
            Your bag
          </p>
          <h1 className="mt-2 font-display italic text-6xl tracking-tight sm:text-7xl">
            {count > 0
              ? `${count} piece${count === 1 ? "" : "s"}`
              : "Empty bag"}
          </h1>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-6 py-10 sm:px-10">
        {/* Notice */}
        {notice && (
          <p
            role="status"
            className="mb-6 border border-[#c8a96e]/40 bg-[#c8a96e]/10 px-5 py-3 text-sm"
          >
            {notice}
          </p>
        )}

        {loading ? (
          <p className="text-sm text-ink/50">Loading your bag…</p>
        ) : lines.length === 0 ? (
          <div className="mt-4 border border-ink/[0.08] bg-white/50 py-20 text-center">
            <p className="font-display italic text-4xl">Nothing here yet.</p>
            <p className="mt-3 text-sm text-ink/50">
              Pretty things are waiting in the shop.
            </p>
            <Link
              href="/shop"
              className="mt-7 inline-flex items-center gap-2 bg-[#0a0a0a] px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-ivory transition-colors hover:bg-[#c8a96e] hover:text-[#0a0a0a]"
            >
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
                  className="flex gap-5 border border-ink/[0.07] bg-white/60 p-4"
                >
                  {/* Thumbnail */}
                  <Link href={`/products/${line.slug}`} tabIndex={-1} aria-hidden="true">
                    <span className="relative block h-28 w-24 shrink-0 overflow-hidden bg-[#f0ebe3]">
                      {line.image ? (
                        <Image
                          src={line.image.secureUrl}
                          alt=""
                          fill
                          sizes="96px"
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
                      className="font-display italic text-xl leading-snug hover:text-[#c8a96e]"
                    >
                      {line.name}
                    </Link>
                    {line.variantSku && (
                      <p className="text-xs text-ink/40">{line.variantSku}</p>
                    )}
                    <p className="mt-1 font-mono text-base font-semibold">
                      {formatINR(line.price)}
                    </p>

                    {line.available === false && (
                      <p className="text-xs text-red-700">Unavailable — remove to continue</p>
                    )}
                    {line.adjusted && (
                      <p className="text-xs text-[#c8a96e]">Adjusted to available stock</p>
                    )}

                    {/* Qty stepper + remove */}
                    <div className="mt-3 flex items-center gap-4">
                      <label>
                        <span className="sr-only">Quantity for {line.name}</span>
                        <span className="flex items-center border border-ink/[0.1]">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            onClick={() => void setQty(line.key, line.qty - 1)}
                            className="px-3 py-1.5 text-sm text-ink/50 transition-colors hover:text-ink"
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
                            className="px-3 py-1.5 text-sm text-ink/50 transition-colors hover:text-ink"
                          >
                            +
                          </button>
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => void remove(line.key)}
                        className="text-xs text-ink/40 underline underline-offset-4 hover:text-ink"
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
            <aside className="h-fit border border-ink/[0.08] bg-white/60 p-6">
              <h2 className="font-display italic text-2xl">Summary</h2>
              <div className="mt-4 space-y-2 border-t border-ink/[0.06] pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink/50">Subtotal</span>
                  <span className="font-mono font-semibold">{formatINR(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink/50">Shipping</span>
                  <span className="text-ink/50">Calculated at checkout</span>
                </div>
              </div>
              <div className="mt-4 flex justify-between border-t border-ink/[0.06] pt-4">
                <span className="font-medium">Estimated total</span>
                <span className="font-mono text-xl font-semibold">{formatINR(subtotal)}</span>
              </div>
              <p className="mt-1 text-xs text-ink/35">Taxes calculated at checkout.</p>
              <Link
                href="/checkout"
                className="mt-6 block border border-[#0a0a0a] bg-[#0a0a0a] px-6 py-4 text-center text-sm font-semibold uppercase tracking-[0.15em] text-ivory transition-colors hover:bg-[#c8a96e] hover:border-[#c8a96e] hover:text-[#0a0a0a]"
              >
                Proceed to checkout
              </Link>
              <Link
                href="/shop"
                className="mt-3 block text-center text-xs text-ink/40 underline underline-offset-4 hover:text-ink"
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
