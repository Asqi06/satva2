import Image from "next/image";
import Link from "next/link";
import type { ProductListItem } from "@/services/product-service";
import { cloudinaryResize } from "@/utils/cloudinary-url";
import { formatINR } from "@/utils/format";

/** Storefront product card — editorial minimal, hover lift with image zoom. Server-safe. */
export function ProductCard({
  product,
  eager = false,
}: {
  product: ProductListItem;
  eager?: boolean;
}) {
  const cover = product.images[0];
  return (
    <article className="group relative overflow-hidden bg-white/70 border border-ink/[0.07] transition-shadow hover:shadow-[0_8px_40px_rgba(10,10,10,0.10)]">
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

          {/* Discount badge */}
          {product.discountPercent > 0 && (
            <span className="absolute left-0 top-4 bg-[#c8a96e] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#0a0a0a]">
              −{product.discountPercent}%
            </span>
          )}

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
              ({product.ratingCount})
            </span>
          </p>
        )}

        {/* Price */}
        <p className="mt-2 flex items-baseline gap-2 font-mono">
          <span className="text-base font-semibold">{formatINR(product.price)}</span>
          {product.compareAtPrice !== undefined && product.compareAtPrice > product.price && (
            <s className="text-sm text-ink/35">{formatINR(product.compareAtPrice)}</s>
          )}
        </p>
      </div>
    </article>
  );
}
