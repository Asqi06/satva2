import { connectDb } from "@/lib/db";
import { getClientEnv } from "@/lib/env";
import { merchantFeed, type FeedProduct } from "@/lib/merchant-feed";
import { Product } from "@/models/Product";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const headers = { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };
  if ((process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") || process.env.SITE_INDEXING_ENABLED === "false") {
    return new Response("", { status: 404, headers });
  }
  try {
    await connectDb();
    const products = await Product.find({ isPublished: true })
      .select("name slug sku description price stock reservedStock images variants material size color")
      .sort({ _id: 1 }).lean<FeedProduct[]>();
    return new Response(merchantFeed(products, getClientEnv().NEXT_PUBLIC_APP_URL), { headers });
  } catch {
    logger.warn("Merchant feed catalogue unavailable");
    return new Response("", { status: 503, headers: { ...headers, "Retry-After": "60" } });
  }
}
