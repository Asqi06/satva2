import Image from "next/image";
import Link from "next/link";
import type { ProductListItem } from "@/services/product-service";
import { cloudinaryResize } from "@/utils/cloudinary-url";
import { formatINR } from "@/utils/format";

/** Storefront product card — desi-editorial: rupee-first pricing, festive badges. Server-safe. */
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
  return (
    <article className="card-lift group relative overflow-hidden bg-white/70">
      {/* Image */}
      <Link href={`/products/${product.slug}`} aria-label={product.name} tabIndex={-1}>
        <span className="relative block aspect-[3/4] overflow-hidden bg-[#f0ebe3]">
          {cover ? (
            <Image
              src={cloudinaryResize(cover.secureUrl, 600)}
              alt={cover.alt}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              loading={eager ? "eager" : "lazy"}
              decoding="async"
              className="object-cover transition-transform duration-500 will-change-transform group-hover:scale-[1.06]"
            />
          ) : (
            <span className="flex h-full items-center justify-center font-display italic text-5xl text-ink/20">
              S
            </span>
          )}

          {/* Badges */}
          <span className="absolute left-0 top-4 flex flex-col items-start gap-1.5">
            {product.discountPercent > 0 && (
              <span className="badge-off">−{product.discountPercent}%</span>
            )}
            {badge === "bestseller" && <span className="badge-bestseller">★ Bestseller</span>}
            {badge === "new" && <span className="badge-new">New drop</span>}
          </span>

          {/* Out of stock overlay */}
          {!product.inStock && (
            <span className="absolute inset-0 flex items-center justify-center bg-ivory/70">
              <span className="border border-ink/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/60">
                Out of stock
              </span>
            </span>
          )}
        </span>
      </Link>

      {/* Info */}
      <div className="p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink/35">
          {product.category.name}
        </p>
        <h3 className="mt-1.5 font-display italic text-xl leading-snug">
          <Link
            href={`/products/${product.slug}`}
            className="transition-colors hover:text-[#c8a96e]"
          >
            {product.name}
          </Link>
        </h3>

        {/* Rating */}
        {product.ratingCount > 0 && (
          <p className="mt-1 text-[11px] text-[#c8a96e]">
            {"★".repeat(Math.round(product.ratingAverage))}
            <span className="ml-1 font-sans text-ink/35">
              {product.ratingAverage.toFixed(1)} ({product.ratingCount} review{product.ratingCount === 1 ? "" : "s"})
            </span>
          </p>
        )}

        {/* Price — rupee-first, taxes included */}
        <p className="mt-2 flex items-baseline gap-2 font-mono">
          <span className="text-base font-semibold">{formatINR(product.price)}</span>
          {product.compareAtPrice !== undefined && product.compareAtPrice > product.price && (
            <s className="text-sm text-ink/35">{formatINR(product.compareAtPrice)}</s>
          )}
        </p>
        <p className="price-note mt-0.5">Inclusive of all taxes</p>
      </div>
    </article>
  );
}
