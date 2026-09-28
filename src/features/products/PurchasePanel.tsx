"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import type { ShippingSettings } from "@/services/settings-service";
import { useEffect, useRef, useState } from "react";
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

/** Product options and purchase actions. */
export function PurchasePanel({
  product,
  initialVariantSku,
  settings,
}: {
  initialVariantSku?: string;
  settings: ShippingSettings;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    compareAtPrice?: number;
    image?: { secureUrl: string; alt: string };
    inStock: boolean;
    stock: number;
    variants: PurchaseVariant[];
  };
}) {
  const cta = useRef<HTMLButtonElement>(null);
  const [sticky, setSticky] = useState(false);
  const [wishError, setWishError] = useState("");
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setSticky(!entry.isIntersecting && entry.boundingClientRect.top < 0), { rootMargin: "-72px 0px 0px" });
    if (cta.current) observer.observe(cta.current);
    return () => observer.disconnect();
  }, []);
  const { add } = useBag();
  const router = useRouter();
  const [sku, setSku] = useState<string>(initialVariantSku ?? (product.variants.find((variant) => variant.stock > 0) ?? product.variants[0])?.sku ?? "");
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [wished, setWished] = useState(false);
  const [wishBusy, setWishBusy] = useState(false);
  const [added, setAdded] = useState(false);

  const selected = product.variants.find((v) => v.sku === sku);
  const price = selected?.price ?? product.price;
  const stock = selected ? selected.stock : product.inStock ? product.stock : 0;

  const addToBag = async () => {
    setBusy(true);
    try {
      const ok = await add({
        productId: product.id,
        variantSku: selected?.sku,
        variantLabel: selected ? [selected.size, selected.color, selected.style].filter(Boolean).join(" · ") || selected.sku : undefined,
        qty,
        name: product.name,
        slug: product.slug,
        price,
        compareAtPrice: product.compareAtPrice,
        image: product.image,
      });
      if (!ok) return;
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } finally {
      setBusy(false);
    }
  };

  const toggleWishlist = async () => {
    setWishBusy(true); setWishError("");
    try {
      if (wished) {
        const res = await fetch(`/api/wishlist/${product.id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Could not update your wishlist. Try again.");
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
      if (!res.ok) throw new Error("Could not update your wishlist. Try again.");
      if (res.ok) {
        analytics.addToWishlist({ id: product.id, name: product.name, price });
        setWished(true);
      }
    } catch { setWishError("Could not update your wishlist. Try again."); } finally {
      setWishBusy(false);
    }
  };

  return (
    <div className="mt-6 space-y-5">
      <div><p aria-label="Price" className="flex flex-wrap items-baseline gap-3"><span className="text-2xl font-semibold">{formatINR(price)}</span>{product.compareAtPrice !== undefined && product.compareAtPrice > price && <><s className="text-sm text-muted">{formatINR(product.compareAtPrice)}</s><span className="text-xs text-primary">Save {formatINR(product.compareAtPrice - price)}</span></>}</p><p className="mt-2 text-xs text-muted">Inclusive of taxes</p></div>
      {product.variants.length > 0 && (
        <fieldset>
          <legend className="text-sm font-medium">
            Choose your option
          </legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {product.variants.map((v) => {
              const label =
                [v.size, v.color, v.style].filter(Boolean).join(" · ") || v.sku;
              const active = v.sku === sku;
              return (
                <label key={v.sku} className={`min-h-11 rounded-[3px] border px-4 py-3 text-sm font-medium transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary ${
                  v.stock === 0 ? "text-muted" : "cursor-pointer"
                } ${active ? "border-ink bg-ink text-white" : "border-light-gray bg-white hover:border-primary hover:text-primary"}`}>
                  <input type="radio" name="product-variant" value={v.sku} checked={active}
                    disabled={v.stock === 0} className="sr-only"
                    onChange={() => {
                      setSku(v.sku); setQty(1);
                      const url = new URL(window.location.href);
                      url.searchParams.set("variant", v.sku);
                      window.history.replaceState(null, "", url);
                    }} />
                  {label}{v.stock === 0 ? " — Sold out" : ""}
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      <div className="flex flex-wrap items-center gap-5">
        <fieldset className="flex items-center gap-3">
          <legend className="text-sm font-medium">
            Quantity
          </legend>
          <div className="flex items-center rounded-[3px] border border-light-gray bg-white">
            <button
              type="button"
              aria-label="Decrease quantity"
              disabled={qty <= 1}
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="min-h-11 min-w-11 px-3 py-2.5 text-lg leading-none font-bold text-muted hover:text-primary transition-colors"
            >
              −
            </button>
            <span className="min-w-[2ch] text-center text-sm font-extrabold">{qty}</span>
            <button
              type="button"
              aria-label="Increase quantity"
              disabled={qty >= Math.min(stock, 99)}
              onClick={() =>
                setQty((q) => Math.min(Math.max(Math.min(stock, 99), 1), q + 1))
              }
              className="min-h-11 min-w-11 px-3 py-2.5 text-lg leading-none font-bold text-muted hover:text-primary transition-colors"
            >
              +
            </button>
          </div>
        </fieldset>

        <p className="text-sm text-muted" aria-live="polite">
          Total <span className="ml-1 text-lg font-semibold text-ink">{formatINR(price * qty)}</span>
          {selected && stock > 0 && stock < 10 && (
            <span className="ml-2 text-xs font-semibold text-maroon">
              {stock} available
            </span>
          )}
        </p>
      </div>

      <p className="text-sm text-muted">{stock > 0 ? "In stock" : "Sold out"}</p>
      <div className="flex items-center gap-3">
        <button
          ref={cta}
          type="button"
          disabled={busy || (!selected && !product.inStock) || (selected != null && stock === 0)}
          onClick={() => void addToBag()}
          className="btn-primary flex-1"
        >
          {busy ? "Adding…" : added ? "Added to cart" : stock === 0 ? "Sold out" : "Add to Cart"}
        </button>
        <button
          type="button"
          disabled={wishBusy}
          onClick={() => void toggleWishlist()}
          aria-pressed={wished}
          aria-label={wished ? "Saved to wishlist" : "Save to wishlist"}
          className={`icon-button disabled:opacity-40 ${
            wished ? "!border-primary !text-primary !bg-primary/5" : ""
          }`}
        >
          <Icon name="heart" fill={wished ? "currentColor" : "none"} />
        </button>
      </div>
      {wishError && <p role="alert" className="text-sm text-primary">{wishError}</p>}
      <div className="space-y-2 border-t border-light-gray pt-4 text-xs leading-6 text-muted">
        <p className="flex items-start gap-2"><Icon name="truck" className="mt-1 shrink-0" />{price * qty >= settings.freeShippingThreshold ? "Qualifies for free delivery before discounts." : `Delivery ₹${settings.shippingFlatFee}; free from ₹${settings.freeShippingThreshold} after discounts.`}</p>
        {settings.deliveryInformation && <p>{settings.deliveryInformation}</p>}
        <p className="flex items-center gap-2"><Icon name="shield" />Secure payment through Razorpay</p>
        <Link href="/returns" className="inline-block py-1 underline underline-offset-4">Return & refund eligibility</Link>
      </div>
      {sticky && <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-light-gray bg-white px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))] lg:hidden"><div><p className="text-sm font-semibold">{formatINR(price * qty)}</p>{selected && <p className="text-xs text-muted">{[selected.size, selected.color, selected.style].filter(Boolean).join(" · ")}</p>}</div><button type="button" disabled={busy || stock <= 0} onClick={() => void addToBag()} className="btn-primary">{busy ? "Adding…" : stock <= 0 ? "Sold out" : "Add to Cart"}</button></div>}
    </div>
  );
}
