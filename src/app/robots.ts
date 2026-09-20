import type { MetadataRoute } from "next";
import { getClientEnv } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const base = getClientEnv().NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/account/", "/checkout/", "/cart/", "/wishlist/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
