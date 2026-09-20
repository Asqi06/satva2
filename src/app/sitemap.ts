import type { MetadataRoute } from "next";
import { getClientEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * Sitemap: static pages + published categories/products.
 * Fail-soft: without DB access it still serves the static entries.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getClientEnv().NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const staticPages: MetadataRoute.Sitemap = [
    "",
    "/shop",
    "/about",
    "/contact",
    "/faq",
    "/shipping",
    "/returns",
    "/privacy",
    "/terms",
  ].map((path) => ({ url: `${base}${path}`, lastModified: new Date() }));

  try {
    const [{ listPublicProducts }, { listPublicCategories }] = await Promise.all([
      import("@/services/product-service"),
      import("@/services/category-service"),
    ]);
    const [{ products }, categories] = await Promise.all([
      listPublicProducts({ sort: "newest", page: 1, limit: 50 }),
      listPublicCategories(),
    ]);
    // Sitemap caps at 50 newest — full sitemap pagination is Phase 9+.
    return [
      ...staticPages,
      ...categories.map((c) => ({ url: `${base}/shop?category=${c.slug}`, lastModified: new Date() })),
      ...products.map((p) => ({ url: `${base}/products/${p.slug}`, lastModified: new Date() })),
    ];
  } catch (error) {
    logger.warn("sitemap fell back to static entries", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return staticPages;
  }
}
