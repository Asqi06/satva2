"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useBag } from "@/features/cart/CartProvider";
import { analytics } from "@/lib/analytics";
import { formatINR } from "@/utils/format";

export interface PurchaseVariant {
  sku: string;
  size?: string;
  color?: string;
  style?: string;
  price?: number;
  stock: number;
}

/**
 * Buy box: variant + quantity selection, add-to-bag (server for members,
 * local for guests via CartProvider), wishlist toggle (login required).
 */
export function PurchasePanel({
  product,
}: {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    compareAtPrice?: number;
    image?: { secureUrl: string; alt: string };
    inStock: boolean;
    variants: PurchaseVariant[];
  };
}) {
  const { add } = useBag();
  const router = useRouter();
  const [sku, setSku] = useState<string>(product.variants[0]?.sku ?? "");
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [wished, setWished] = useState(false);
  const [wishBusy, setWishBusy] = useState(false);
  const [added, setAdded] = useState(false);

  const selected = product.variants.find((v) => v.sku === sku);
  const price = selected?.price ?? product.price;
  const stock = selected ? selected.stock : product.inStock ? 99 : 0;

  const addToBag = async () => {
    setBusy(true);
    try {
      await add({
        productId: product.id,
        variantSku: selected?.sku,
        qty,
        name: product.name,
        slug: product.slug,
        price,
        compareAtPrice: product.compareAtPrice,
        image: product.image,
      });
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } finally {
      setBusy(false);
    }
  };

  const toggleWishlist = async () => {
    setWishBusy(true);
    try {
      if (wished) {
        await fetch(`/api/wishlist/${product.id}`, { method: "DELETE" });
        setWished(false);
        return;
      }
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.ok) {
        analytics.addToWishlist({ id: product.id, name: product.name, price });
        setWished(true);
      }
    } finally {
      setWishBusy(false);
    }
  };

  return (
    <div className="mt-8 space-y-6">
      {/* Variant pills */}
      {product.variants.length > 0 && (
        <fieldset>
          <legend className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink/40">
            Variant
          </legend>
          <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Variant">
            {product.variants.map((v) => {
              const label =
                [v.size, v.color, v.style].filter(Boolean).join(" · ") || v.sku;
              const active = v.sku === sku;
              return (
                <button
                  key={v.sku}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={v.stock === 0}
                  onClick={() => {
                    setSku(v.sku);
                    setQty(1);
                  }}
                  className={`border px-5 py-2 text-sm font-medium transition-colors disabled:opacity-35 ${
                    active
                      ? "border-[#c8a96e] bg-[#c8a96e]/10 text-ink"
                      : "border-ink/15 hover:border-ink/40"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {/* Quantity + running total */}
      <div className="flex flex-wrap items-center gap-5">
        <fieldset className="flex items-center gap-3">
          <legend className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink/40">
            Qty
          </legend>
          <div className="flex items-center border border-ink/15">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="px-3.5 py-2.5 text-lg leading-none text-ink/50 hover:text-ink"
            >
              −
            </button>
            <span className="min-w-[2ch] text-center text-sm font-semibold">{qty}</span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() =>
                setQty((q) => Math.min(Math.max(stock, 1), q + 1))
              }
              className="px-3.5 py-2.5 text-lg leading-none text-ink/50 hover:text-ink"
            >
              +
            </button>
          </div>
        </fieldset>

        <p className="font-mono text-base" aria-live="polite">
          <span className="font-semibold">{formatINR(price * qty)}</span>
          {selected && stock > 0 && stock < 10 && (
            <span className="ml-2 text-sm text-[#c8a96e]">
              Only {stock} left
            </span>
          )}
        </p>
      </div>

      {/* CTA buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy || (!selected && !product.inStock) || (selected != null && stock === 0)}
          onClick={() => void addToBag()}
          className="btn-primary flex-1 disabled:opacity-40 sm:flex-initial"
        >
          {busy ? "Adding…" : added ? "✓ Added to bag!" : stock === 0 ? "Out of stock" : "Add to bag"}
        </button>
        <button
          type="button"
          disabled={wishBusy}
          onClick={() => void toggleWishlist()}
          aria-pressed={wished}
          className={`btn-ghost disabled:opacity-40 ${
            wished ? "!border-[#c8a96e] !text-[#c8a96e]" : ""
          }`}
        >
          {wished ? "♥ Saved" : "♡ Wishlist"}
        </button>
      </div>
      <p className="text-xs leading-5 text-ink/45">
        {selected && stock > 0 && stock < 10
          ? `Hurry — only ${stock} left in this variant. `
          : ""}
        Ships in 2–4 days · Free shipping over ₹399 · Gift box included
      </p>
    </div>
  );
}
