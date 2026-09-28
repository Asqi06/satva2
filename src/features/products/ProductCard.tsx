import Link from "next/link";
import type { ProductListItem } from "@/services/product-service";
import { CloudinaryImage as Image } from "@/components/CloudinaryImage";
import { Icon } from "@/components/Icon";
import { formatINR } from "@/utils/format";

export function ProductCard({ product, badge, priority = false, sizes = "(min-width: 1280px) 286px, (min-width: 1024px) calc((100vw - 136px) / 4), (min-width: 640px) calc((100vw - 112px) / 3), calc((100vw - 48px) / 2)" }: { product: ProductListItem; badge?: "bestseller" | "new"; priority?: boolean; sizes?: string }) {
  const cover = product.images[0];
  return <article className="group flex h-full min-w-0 flex-col">
    <Link href={`/products/${product.slug}`} aria-label={product.name} tabIndex={-1} className="relative block aspect-[4/5] overflow-hidden rounded-[3px] bg-cream">
      {cover ? <Image src={cover.secureUrl} alt={cover.alt || product.name} fill sizes={sizes} priority={priority} loading={priority ? undefined : "lazy"} className="object-cover transition-opacity duration-200 group-hover:opacity-95" /> : <span className="flex h-full items-center justify-center px-3 text-center text-xs text-muted">Photo unavailable</span>}
      {(!product.inStock || badge || product.discountPercent > 0) && <span className="badge-new absolute left-2 top-2">{!product.inStock ? "Sold out" : badge === "bestseller" && (product.soldQuantity ?? 0) > 0 ? "Bestseller" : badge === "new" ? "New" : `${product.discountPercent}% off`}</span>}
    </Link>
    <div className="pt-3">
      <h3 className="clamp-2 min-h-[2.8em] text-[13px] font-medium leading-[1.4] sm:text-sm"><Link href={`/products/${product.slug}`} className="hover:underline">{product.name}</Link></h3>
      <p className="mt-2 flex flex-wrap items-baseline gap-2"><span className="text-sm font-semibold sm:text-base">{product.priceFrom ? "From " : ""}{formatINR(product.price)}</span>{product.compareAtPrice !== undefined && product.compareAtPrice > product.price && <s className="text-xs text-muted">{formatINR(product.compareAtPrice)}</s>}</p>
      {product.ratingCount > 0 && <p className="mt-2 flex items-center gap-1 text-xs text-muted" aria-label={`Rated ${product.ratingAverage.toFixed(1)} out of 5, ${product.ratingCount} reviews`}><Icon name="star" width="12" height="12" />{product.ratingAverage.toFixed(1)} <span>({product.ratingCount})</span></p>}
    </div>
  </article>;
}
