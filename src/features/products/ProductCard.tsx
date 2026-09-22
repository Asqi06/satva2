import Image from "next/image";
import Link from "next/link";
import type { ProductListItem } from "@/services/product-service";
import { cloudinaryResize } from "@/utils/cloudinary-url";
import { formatINR } from "@/utils/format";

/** Reference-style product card: maroon sale tag, wishlist heart,
 *  2-line name, star rating, price + strike, pink ADD bar. Server-safe. */
export function ProductCard({
  product,
  eager = false,
  badge,
}: {
  product: ProductListItem;
  eager?: boolean;
  badge?: "bestseller" | "new";
}) {
  const cover = product.images[0];
  const showHotTag = badge === "bestseller" || product.discountPercent >= 20;
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-black/[0.06] bg-white transition-shadow hover:shadow-[0_12px_30px_rgba(0,0,0,0.1)]">
      {/* Image */}
      <div className="relative">
        <Link href={`/products/${product.slug}`} aria-label={product.name} tabIndex={-1}>
          <span className="relative block aspect-[4/5] overflow-hidden bg-cream">
            {cover ? (
              <Image
                src={cloudinaryResize(cover.secureUrl, 600)}
                alt={cover.alt}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                loading={eager ? "eager" : "lazy"}
                decoding="async"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
              />
            ) : (
              <span className="flex h-full items-center justify-center bg-blush font-display text-5xl font-black text-primary">
                S
              </span>
            )}
            {!product.inStock && (
              <span className="absolute inset-0 flex items-center justify-center bg-white/70">
                <span className="rounded-full bg-ink px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                  Out of stock
                </span>
              </span>
            )}
          </span>
        </Link>

        {/* Top-left tag */}
        <span className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {showHotTag ? (
            <span className="badge-bestseller">Hot Selling</span>
          ) : badge === "new" ? (
            <span className="badge-new">New Arrival</span>
          ) : product.discountPercent > 0 ? (
            <span className="badge-off">{product.discountPercent}% off</span>
          ) : null}
        </span>

        {/* Top-right wishlist */}
        <Link
          href="/wishlist"
          aria-label={`Save ${product.name} to wishlist`}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-sm transition-transform hover:scale-110"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </Link>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-2.5 sm:p-3">
        <h3 className="clamp-2 min-h-[2.4em] text-[12px] font-medium leading-[1.2] text-ink sm:text-[13px]">
          <Link href={`/products/${product.slug}`} className="transition-colors hover:text-primary">
            {product.name}
          </Link>
        </h3>

        {product.ratingCount > 0 ? (
          <p className="mt-1 text-[11px] font-bold text-amber-500" aria-label={`Rated ${product.ratingAverage.toFixed(1)} out of 5`}>
            {"★".repeat(Math.min(5, Math.round(product.ratingAverage)))}
            <span className="ml-1 font-medium text-muted">({product.ratingCount})</span>
          </p>
        ) : (
          <p className="mt-1 text-[11px] text-muted">New</p>
        )}

        <p className="mt-1 flex items-baseline gap-1.5">
          <span className="text-[14px] font-extrabold sm:text-[15px]">{formatINR(product.price)}</span>
          {product.compareAtPrice !== undefined && product.compareAtPrice > product.price && (
            <s className="text-[11px] text-muted">{formatINR(product.compareAtPrice)}</s>
          )}
        </p>

        <Link
          href={`/products/${product.slug}`}
          className="mt-2 rounded-lg bg-blush py-2 text-center text-[11px] font-extrabold uppercase tracking-[0.12em] text-primary transition-colors hover:bg-primary hover:text-white"
        >
          {product.inStock ? "Add to cart" : "View"}
        </Link>
      </div>
    </article>
  );
}
