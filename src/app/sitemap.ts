import type { MetadataRoute } from "next";
import { getClientEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * Sitemap: static pages + published categories/products.
 * Database errors return a server failure instead of silently publishing an incomplete catalogue.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if ((process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") || process.env.SITE_INDEXING_ENABLED === "false") return [];
  const base = getClientEnv().NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const staticPages: MetadataRoute.Sitemap = [
    "", "/shop", "/about", "/contact", "/faq", "/shipping", "/returns", "/privacy", "/terms", "/guides/jewellery-buying-guide",
  ].map((path) => ({
    url: `${base}${path}`,
  }));

  try {
    const [{ connectDb }, { Product }, { listPublicCategories }] = await Promise.all([
      import("@/lib/db"),
      import("@/models/Product"),
      import("@/services/category-service"),
    ]);
    await connectDb();
    // ponytail: one sitemap covers this catalogue; split with generateSitemaps before 50,000 URLs.
    const [products, categories] = await Promise.all([
      Product.find({ isPublished: true }).select("slug updatedAt images.secureUrl").lean<{ slug: string; updatedAt?: Date; images?: { secureUrl: string }[] }[]>(),
      listPublicCategories(),
    ]);
    return [
      ...staticPages,
      ...categories.filter((c) => (c.productCount ?? 0) > 0).map((c) => ({
        url: `${base}/shop?category=${encodeURIComponent(c.slug)}`,
        ...(c.updatedAt ? { lastModified: new Date(c.updatedAt) } : {}),
        ...(c.image ? { images: [c.image.secureUrl] } : {}),
      })),
      ...products.map((p) => ({
        url: `${base}/products/${encodeURIComponent(p.slug)}`,
        ...(p.updatedAt ? { lastModified: new Date(p.updatedAt) } : {}),
        ...(p.images?.length ? { images: [...new Set(p.images.map((image) => image.secureUrl))] } : {}),
      })),
    ];
  } catch (error) {
    logger.warn("sitemap catalogue query failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    throw error;
  }
}
