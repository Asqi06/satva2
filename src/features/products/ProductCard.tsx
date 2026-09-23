import Image from "next/image";
import Link from "next/link";
import type { ProductListItem } from "@/services/product-service";
import { cloudinaryResize } from "@/utils/cloudinary-url";
import { formatINR } from "@/utils/format";

/** Shared product card for the home, shop, and related-product grids. */
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
  const showHotTag = badge === "bestseller";
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-light-gray bg-white transition-shadow hover:shadow-[0_12px_30px_rgba(0,0,0,0.1)]">
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
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <h3 className="clamp-2 min-h-[2.6em] text-[13px] font-semibold leading-[1.3] text-ink sm:text-sm">
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
          <p className="mt-1 text-[11px] text-muted">No reviews yet</p>
        )}

        <p className="mt-2 flex flex-wrap items-baseline gap-1.5">
          <span className="text-base font-extrabold">{formatINR(product.price)}</span>
          {product.compareAtPrice !== undefined && product.compareAtPrice > product.price && (
            <s className="text-[11px] text-muted">{formatINR(product.compareAtPrice)}</s>
          )}
        </p>

        <Link
          href={`/products/${product.slug}`}
          className="mt-auto flex min-h-11 items-center justify-center rounded-full bg-blush px-3 py-2 text-center text-[11px] font-extrabold uppercase tracking-[0.12em] text-primary transition-colors hover:bg-primary hover:text-white"
        >
          {product.inStock ? "View details" : "View item"}
        </Link>
      </div>
    </article>
  );
}
