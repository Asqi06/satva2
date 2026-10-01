import { createHash } from "node:crypto";
import type { IProductImage, IProductVariant } from "@/models/Product";

export interface FeedProduct {
  name: string;
  slug: string;
  sku: string;
  description: string;
  price: number;
  stock: number;
  reservedStock?: number;
  images: IProductImage[];
  variants: IProductVariant[];
  material?: string;
  size?: string;
  color?: string;
}

function xml(value: string | number): string {
  return String(value).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function id(sku: string): string {
  return sku.length <= 50 ? sku : createHash("sha256").update(sku).digest("hex").slice(0, 50);
}

/** One row per SKU; use the same parent/variant reservation limits as the storefront. */
export function merchantFeed(products: FeedProduct[], baseUrl: string): string {
  const base = baseUrl.replace(/\/$/, "");
  const items = products.flatMap((product) => {
    const images = product.images.filter((image) => /^https:\/\//i.test(image.secureUrl))
      .sort((a, b) => Number(b.isThumbnail) - Number(a.isThumbnail));
    if (!images.length || !product.slug || typeof product.description !== "string" || !product.description.trim()) return [];
    const variants = product.variants ?? [];
    // Merchant Center groups require real supported distinguishing attributes.
    const canGroup = typeof product.sku === "string" && Boolean(product.sku.trim()) && variants.length > 1 && (
      (variants.every((v) => Boolean(v.size)) && new Set(variants.map((v) => v.size)).size > 1) ||
      (variants.every((v) => Boolean(v.color)) && new Set(variants.map((v) => v.color)).size > 1)
    );
    const options: Array<IProductVariant | undefined> = variants.length ? variants : [undefined];
    return options.flatMap((variant) => {
      if (variant && (typeof variant.sku !== "string" || !variant.sku.trim())) return [];
      const price = variant?.price ?? product.price;
      const sku = variant ? variant.sku : product.sku;
      if (typeof sku !== "string" || !sku.trim() || !Number.isFinite(price) || price <= 0) return [];
      const parentStock = Math.max(0, product.stock - (product.reservedStock ?? 0));
      const stock = variant ? Math.min(parentStock, Math.max(0, variant.stock - (variant.reservedStock ?? 0))) : parentStock;
      const link = new URL(`/products/${encodeURIComponent(product.slug)}`, base);
      if (variant) link.searchParams.set("variant", variant.sku);
      const label = variant ? [variant.size, variant.color, variant.style].filter(Boolean).join(" · ") : "";
      const fields: Record<string, string | number | undefined> = {
        id: id(sku), title: `${product.name}${label ? ` — ${label}` : ""}`.slice(0, 150),
        description: product.description.slice(0, 5000), link: link.toString(),
        image_link: images[0].secureUrl, availability: stock > 0 ? "in_stock" : "out_of_stock",
        price: `${price.toFixed(2)} INR`,
        item_group_id: canGroup ? id(product.sku) : undefined,
        material: product.material, size: variant?.size || product.size, color: variant?.color || product.color,
      };
      return [`<item>${Object.entries(fields).filter(([, value]) => value !== undefined && value !== "")
        .map(([key, value]) => `<g:${key}>${xml(value!)}</g:${key}>`).join("")}${images.slice(1, 11)
        .map((image) => `<g:additional_image_link>${xml(image.secureUrl)}</g:additional_image_link>`).join("")}</item>`];
    });
  });
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel><title>SatvaStones catalogue</title><link>${xml(base)}</link><description>Current published jewellery prices and availability in INR.</description>${items.join("")}</channel></rss>`;
}
