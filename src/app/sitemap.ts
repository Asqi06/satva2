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
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    { path: "", priority: 1, changeFrequency: "daily" as const },
    { path: "/shop", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/about", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/contact", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/faq", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/shipping", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/returns", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly" as const },
  ].map(({ path, priority, changeFrequency }) => ({
    url: `${base}${path}`,
    lastModified: now,
    priority,
    changeFrequency,
  }));

  try {
    const [{ listPublicProducts }, { listPublicCategories }] = await Promise.all([
      import("@/services/product-service"),
      import("@/services/category-service"),
    ]);
    const [{ products }, categories] = await Promise.all([
      listPublicProducts({ sort: "newest", page: 1, limit: 500 }),
      listPublicCategories(),
    ]);
    return [
      ...staticPages,
      ...categories.map((c) => ({
        url: `${base}/shop?category=${c.slug}`,
        lastModified: now,
        priority: 0.7,
        changeFrequency: "weekly" as const,
      })),
      ...products.map((p) => ({
        url: `${base}/products/${p.slug}`,
        lastModified: p.createdAt ? new Date(p.createdAt) : now,
        priority: 0.8,
        changeFrequency: "weekly" as const,
      })),
    ];
  } catch (error) {
    logger.warn("sitemap fell back to static entries", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return staticPages;
  }
}
