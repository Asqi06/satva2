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
    priority,
    changeFrequency,
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
      Product.find({ isPublished: true }).select("slug updatedAt").lean<{ slug: string; updatedAt?: Date }[]>(),
      listPublicCategories(),
    ]);
    return [
      ...staticPages,
      ...categories.filter((c) => (c.productCount ?? 0) > 0).map((c) => ({
        url: `${base}/shop?category=${c.slug}`,
        ...(c.updatedAt ? { lastModified: new Date(c.updatedAt) } : {}),
        priority: 0.7,
        changeFrequency: "weekly" as const,
      })),
      ...products.map((p) => ({
        url: `${base}/products/${p.slug}`,
        ...(p.updatedAt ? { lastModified: new Date(p.updatedAt) } : {}),
        priority: 0.8,
        changeFrequency: "weekly" as const,
      })),
    ];
  } catch (error) {
    logger.warn("sitemap catalogue query failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    throw error;
  }
}
