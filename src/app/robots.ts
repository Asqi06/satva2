import type { MetadataRoute } from "next";
import { getClientEnv, isIndexingEnabled } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const base = getClientEnv().NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  if (!isIndexingEnabled()) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin$", "/admin/", "/account$", "/account/", "/checkout$", "/checkout/", "/cart$", "/cart/", "/wishlist$", "/wishlist/", "/orders/", "/garba-ghumar/demo"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
