import mongoose from "mongoose";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connectDb, resetDbCache } from "@/lib/db";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";
import { productQuerySchema, type ProductInput } from "@/schemas/product";
import {
  createCategory,
  deleteCategory,
  listPublicCategories,
  updateCategory,
} from "@/services/category-service";
import {
  bulkProductAction,
  createProduct,
  deleteProduct,
  duplicateProduct,
  getPublicProductBySlug,
  listPublicProducts,
  updateProduct,
} from "@/services/product-service";

const IMG = {
  publicId: "p/1",
  secureUrl: "https://res.cloudinary.com/x/image/upload/p/1",
  alt: "Ring",
  isThumbnail: true,
};

async function makeCategory(name = "Rings") {
  return createCategory({ name, isPublished: true, sortOrder: 0 });
}

function productInput(categoryId: string, overrides: Partial<ProductInput> = {}): ProductInput {
  return {
    name: "Ivory Ember Ring",
    description: "A minimal everyday ring.",
    categoryId,
    images: [IMG],
    videos: [],
    price: 499,
    sku: "RING-001",
    variants: [],
    tags: [],
    stock: 10,
    lowStockThreshold: 5,
    isPublished: true,
    isFeatured: false,
    ...overrides,
  };
}

describe("catalog services", () => {
  let mongod: MongoMemoryServer | undefined;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();
    process.env.CLOUDINARY_CLOUD_NAME = "test";
    process.env.CLOUDINARY_API_KEY = "test";
    process.env.CLOUDINARY_API_SECRET = "test";
    resetDbCache();
    await connectDb();
    await Category.syncIndexes();
    await Product.syncIndexes();
  }, 120000);

  afterAll(async () => {
    await mongoose.disconnect();
    resetDbCache();
    if (mongod) await mongod.stop();
  });

  afterEach(async () => {
    await Product.deleteMany({});
    await Category.deleteMany({});
  });

  it("auto-slugs categories and suffixes collisions", async () => {
    const a = await makeCategory("Rings");
    const b = await makeCategory("Rings");
    expect(a.slug).toBe("rings");
    expect(b.slug).toBe("rings-2");
    const publicCats = await listPublicCategories();
    expect(publicCats.map((c) => c.slug)).toEqual(["rings", "rings-2"]);
  });

  it("hides unpublished products from the storefront", async () => {
    const cat = await makeCategory();
    await createProduct(productInput(cat.id));
    await createProduct(
      productInput(cat.id, { name: "Hidden", sku: "RING-002", slug: "hidden", isPublished: false }),
    );
    const { products, pagination } = await listPublicProducts(
      productQuerySchema.parse({}),
    );
    expect(pagination.total).toBe(1);
    expect(products[0]?.slug).toBe("ivory-ember-ring");
    expect(await getPublicProductBySlug("hidden")).toBeNull();
    expect(await getPublicProductBySlug("nope")).toBeNull();
  });

  it("uses the selected thumbnail as the first storefront image", async () => {
    const cat = await makeCategory();
    const product = await createProduct(productInput(cat.id, {
      images: [
        { ...IMG, isThumbnail: false },
        { ...IMG, publicId: "p/2", secureUrl: "https://res.cloudinary.com/x/image/upload/p/2", isThumbnail: true },
      ],
    }));
    const detail = await getPublicProductBySlug(product.slug);
    expect(detail?.images[0]?.publicId).toBe("p/2");
  });

  it("rejects duplicate product SKUs and variant clashes", async () => {
    const cat = await makeCategory();
    await createProduct(productInput(cat.id));
    await expect(createProduct(productInput(cat.id, { name: "Other", slug: "other" }))).rejects.toMatchObject({
      code: "CONFLICT",
    });
    await expect(
      createProduct(
        productInput(cat.id, {
          name: "Variant clash",
          slug: "variant-clash",
          sku: "RING-003",
          variants: [{ sku: "ring-001", stock: 2 }],
        }),
      ),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("refuses to delete a category with products", async () => {
    const cat = await makeCategory();
    await createProduct(productInput(cat.id));
    await expect(deleteCategory(cat.id)).rejects.toMatchObject({ code: "CONFLICT" });
    const empty = await makeCategory("Empty");
    await deleteCategory(empty.id);
  });

  it("keeps subcategories attached to valid parents", async () => {
    const parent = await makeCategory("Jewellery");
    const child = await createCategory({ name: "Rings", parentId: parent.id, isPublished: true, sortOrder: 0 });
    await expect(deleteCategory(parent.id)).rejects.toMatchObject({ code: "CONFLICT" });
    await expect(updateCategory(parent.id, { parentId: child.id })).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    await updateCategory(child.id, { parentId: null });
    await deleteCategory(parent.id);
  });

  it("saves and clears editable category image, aliases and SEO copy", async () => {
    const created = await createCategory({ name: "Earrings", isPublished: true, sortOrder: 0,
      image: { publicId: "c/1", secureUrl: IMG.secureUrl, alt: "Gold jhumka earrings" },
      searchTerms: ["jhumka"], seoTitle: "Buy Jhumkas Online", seoDescription: "Shop jhumka earrings." });
    expect(created.image?.alt).toBe("Gold jhumka earrings");
    expect(created.seo.title).toBe("Buy Jhumkas Online");
    const updated = await updateCategory(created.id, { image: null, searchTerms: ["bali"], seoTitle: "Bali Earrings" });
    expect(updated.image).toBeUndefined();
    expect(updated.searchTerms).toEqual(["bali"]);
    expect(updated.seo.title).toBe("Bali Earrings");
  });

  it("duplicates as an unpublished copy and bulk-publishes", async () => {
    const cat = await makeCategory();
    const original = await createProduct(productInput(cat.id));
    const copy = await duplicateProduct(original.id);
    expect(copy.isPublished).toBe(false);
    expect(copy.sku).not.toBe(original.sku);
    expect(copy.slug).not.toBe(original.slug);
    const result = await bulkProductAction({ action: "unpublish", ids: [original.id, copy.id] });
    expect(result.modified).toBe(2);
    const relisted = await listPublicProducts(productQuerySchema.parse({}));
    expect(relisted.pagination.total).toBe(0);
  });

  it("filters by stock, discount and category", async () => {
    const cat = await makeCategory();
    const other = await makeCategory("Necklaces");
    await createProduct(productInput(cat.id, { price: 500, compareAtPrice: 1000 }));
    await createProduct(
      productInput(cat.id, { name: "Sold out", slug: "sold-out", sku: "RING-009", stock: 0 }),
    );
    await createProduct(productInput(other.id, { name: "Chain", slug: "chain", sku: "NECK-001" }));

    const inStock = await listPublicProducts(productQuerySchema.parse({ inStock: "true" }));
    expect(inStock.pagination.total).toBe(2);

    const discounted = await listPublicProducts(productQuerySchema.parse({ minDiscount: "40" }));
    expect(discounted.products.map((p) => p.slug)).toEqual(["ivory-ember-ring"]);

    const byCategory = await listPublicProducts(productQuerySchema.parse({ category: "necklaces" }));
    expect(byCategory.products.map((p) => p.slug)).toEqual(["chain"]);

    const unknown = await listPublicProducts(productQuerySchema.parse({ category: "nope" }));
    expect(unknown.pagination.total).toBe(0);
  });

  it("update preserves sales counters and deletes cleanly", async () => {
    const cat = await makeCategory();
    const created = await createProduct(productInput(cat.id));
    await Product.updateOne({ _id: created.id }, { $set: { soldQuantity: 7, ratingAverage: 4.5, ratingCount: 2 } });
    const updated = await updateProduct(created.id, {
      ...productInput(cat.id, { price: 599 }),
      slug: created.slug,
    });
    expect(updated.price).toBe(599);
    const stored = await Product.findById(created.id).lean<{
      soldQuantity?: number;
      ratingAverage?: number;
    } | null>();
    expect(stored?.soldQuantity).toBe(7);
    expect(stored?.ratingAverage).toBe(4.5);
    await deleteProduct(created.id);
    expect(await getPublicProductBySlug(created.slug)).toBeNull();
  });

  it("caps page size at 50", () => {
    expect(productQuerySchema.parse({ limit: "100" }).limit).toBe(50);
    expect(productQuerySchema.parse({}).limit).toBe(12);
  });
});
