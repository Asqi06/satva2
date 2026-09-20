import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";

/**
 * TEST-ONLY seed endpoint. Ships inert:
 * - 404 in production builds.
 * - Otherwise requires header `x-e2e-seed-secret` matching E2E_SEED_SECRET.
 * Enables deterministic E2E for cart/checkout/orders without fixtures in prod code.
 */
export async function POST(req: Request): Promise<Response> {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Not found" } },
      { status: 404 },
    );
  }
  const secret = process.env.E2E_SEED_SECRET;
  if (!secret || req.headers.get("x-e2e-seed-secret") !== secret) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Not found" } },
      { status: 404 },
    );
  }

  await connectDb();
  await Product.deleteMany({});
  await Category.deleteMany({});

  const category = await Category.create({
    name: "E2E Rings",
    slug: "e2e-rings",
    description: "Seeded for end-to-end tests.",
    isPublished: true,
    sortOrder: 0,
  });

  const img = (id: string) => ({
    publicId: `e2e/${id}`,
    secureUrl: `https://res.cloudinary.com/e2e/image/upload/${id}`,
    alt: `Seeded piece ${id}`,
    isThumbnail: true,
  });

  const products = await Product.create([
    {
      name: "E2E Dainty Ring",
      slug: "e2e-dainty-ring",
      description: "Seeded ring with variants.",
      categoryId: category._id,
      images: [img("ring")],
      price: 499,
      compareAtPrice: 999,
      sku: "E2E-RING-001",
      variants: [
        { sku: "E2E-RING-001-S6", size: "6", stock: 5 },
        { sku: "E2E-RING-001-S8", size: "8", stock: 0 },
      ],
      tags: ["e2e"],
      stock: 10,
      isPublished: true,
      isFeatured: true,
    },
    {
      name: "E2E Sold Out Band",
      slug: "e2e-sold-out-band",
      description: "Seeded out-of-stock piece.",
      categoryId: category._id,
      images: [img("band")],
      price: 299,
      sku: "E2E-BAND-002",
      variants: [],
      tags: ["e2e"],
      stock: 0,
      isPublished: true,
    },
  ]);

  return NextResponse.json({
    success: true,
    data: {
      category: category.slug,
      products: products.map((p) => ({ slug: p.slug, sku: p.sku })),
    },
  });
}
