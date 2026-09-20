"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useBag } from "./CartProvider";
import { cloudinaryResize } from "@/utils/cloudinary-url";
import { formatINR } from "@/utils/format";

/** Slide-over bag. Works for guests (local) and members (server). */
export function CartDrawer() {
  const { lines, count, subtotal, loading, drawerOpen, setDrawerOpen, setQty, remove, notice } =
    useBag();
  const closeRef = useRef<HTMLButtonElement>(null);

  // Escape closes; focus lands on the close button when opened.
  // Background scroll stays locked while open (body + Lenis).
  useEffect(() => {
    if (!drawerOpen) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const lenis = (window as unknown as { __lenis?: { stop: () => void; start: () => void } }).__lenis;
    lenis?.stop();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      lenis?.start();
    };
  }, [drawerOpen, setDrawerOpen]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Shopping bag"
      aria-hidden={!drawerOpen}
      className={`fixed inset-0 z-50 transition-all duration-300 ${drawerOpen ? "pointer-events-auto" : "pointer-events-none"}`}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close bag"
        tabIndex={drawerOpen ? 0 : -1}
        onClick={() => setDrawerOpen(false)}
        className={`absolute inset-0 bg-[#0a0a0a]/50 backdrop-blur-sm transition-opacity duration-300 ${drawerOpen ? "opacity-100" : "opacity-0"}`}
      />

      {/* Panel */}
      <aside
        className={`absolute right-0 top-0 flex h-full w-full max-w-[420px] flex-col bg-ivory text-ink shadow-2xl transition-transform duration-300 ease-out ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink/[0.08] bg-[#0a0a0a] px-6 py-4 text-ivory">
          <h2 className="font-display italic text-2xl">
            Your bag{" "}
            {count > 0 && (
              <span className="font-sans text-sm text-ivory/50">({count})</span>
            )}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close bag"
            className="flex h-9 w-9 items-center justify-center border border-ivory/20 text-ivory/60 transition-colors hover:border-ivory hover:text-ivory"
          >
            ✕
          </button>
        </div>

        {/* Stock / adjustment notice */}
        {notice && (
          <p role="status" className="border-b border-[#c8a96e]/30 bg-[#c8a96e]/10 px-6 py-3 text-sm text-ink">
            {notice}
          </p>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-5" data-lenis-prevent>
          {loading ? (
            <p className="text-sm text-ink/50">Loading your bag…</p>
          ) : lines.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <p className="font-display italic text-3xl">Empty.</p>
              <p className="mt-2 text-sm text-ink/50">
                Pretty things await in the shop.
              </p>
              <Link
                href="/shop"
                onClick={() => setDrawerOpen(false)}
                className="mt-6 inline-flex items-center gap-2 bg-[#0a0a0a] px-7 py-3 text-sm font-medium text-ivory transition-colors hover:bg-[#c8a96e] hover:text-[#0a0a0a]"
              >
                Browse the shop
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {lines.map((line) => (
                <li
                  key={line.key}
                  className="flex gap-4 border border-ink/[0.07] bg-white/60 p-3"
                >
                  {/* Thumbnail */}
                  <Link
                    href={`/products/${line.slug}`}
                    onClick={() => setDrawerOpen(false)}
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    <span className="relative block h-20 w-16 shrink-0 overflow-hidden bg-[#f0ebe3]">
                      {line.image ? (
                        <Image
                          src={cloudinaryResize(line.image.secureUrl, 200)}
                          alt=""
                          fill
                          sizes="64px"
                          loading="lazy"
                          decoding="async"
                          className="object-cover"
                        />
                      ) : (
                        <span className="flex h-full items-center justify-center font-display italic text-2xl text-ink/20">
                          S
                        </span>
                      )}
                    </span>
                  </Link>

                  {/* Details */}
                  <div className="flex w-full min-w-0 flex-col">
                    <Link
                      href={`/products/${line.slug}`}
                      onClick={() => setDrawerOpen(false)}
                      className="truncate text-sm font-medium hover:text-[#c8a96e]"
                    >
                      {line.name}
                    </Link>
                    {line.variantSku && (
                      <p className="text-xs text-ink/40">{line.variantSku}</p>
                    )}
                    <p className="mt-0.5 font-mono text-sm font-semibold">
                      {formatINR(line.price)}
                    </p>

                    {line.available === false && (
                      <p className="text-xs text-red-700">Unavailable — remove to continue</p>
                    )}
                    {line.adjusted && (
                      <p className="text-xs text-[#c8a96e]">Adjusted to available stock</p>
                    )}

                    {/* Qty stepper + remove */}
                    <div className="mt-2 flex items-center gap-3">
                      <label>
                        <span className="sr-only">Quantity for {line.name}</span>
                        <span className="flex items-center border border-ink/[0.1]">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            onClick={() => void setQty(line.key, line.qty - 1)}
                            className="px-2.5 py-1 text-sm text-ink/50 hover:text-ink"
                          >
                            −
                          </button>
                          <span aria-live="polite" className="w-6 text-center text-sm">
                            {line.qty}
                          </span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            onClick={() => void setQty(line.key, line.qty + 1)}
                            className="px-2.5 py-1 text-sm text-ink/50 hover:text-ink"
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
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer CTA */}
        {lines.length > 0 && (
          <div className="border-t border-ink/[0.08] px-6 py-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink/50">Subtotal</span>
              <span className="font-mono text-2xl font-semibold">{formatINR(subtotal)}</span>
            </div>
            <p className="mt-1 text-xs text-ink/35">Shipping & taxes at checkout.</p>
            <Link
              href="/cart"
              onClick={() => setDrawerOpen(false)}
              className="mt-4 block border border-[#0a0a0a] bg-[#0a0a0a] px-6 py-4 text-center text-sm font-semibold uppercase tracking-[0.15em] text-ivory transition-colors hover:bg-[#c8a96e] hover:border-[#c8a96e] hover:text-[#0a0a0a]"
            >
              Review bag
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}
