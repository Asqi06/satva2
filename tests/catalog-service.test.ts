import { Types } from "mongoose";
import { Review } from "@/models/Review";
import mongoose from "mongoose";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { MongoMemoryReplSet } from "mongodb-memory-server";
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
  getAdminProductById,
  listPublicProducts,
  getCatalogueFilters,
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
  let mongod: MongoMemoryReplSet | undefined;

  beforeAll(async () => {
    mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
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
    await Review.deleteMany({});
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

  it("saves migrated products using their existing Cloudinary images without re-uploading", async () => {
    const cat = await makeCategory();
    const image = { ...IMG, publicId: "legacy/ring", secureUrl: "https://res.cloudinary.com/x/image/upload/v1777711970/legacy/ring.jpg" };
    const created = await createProduct(productInput(cat.id, { images: [image] }));
    // The migration wrote empty upload IDs directly to MongoDB.
    await Product.collection.updateOne({ _id: new Types.ObjectId(created.id) }, { $set: { "images.0.publicId": "" } });
    const edit = await getAdminProductById(created.id);
    expect(edit?.images[0]?.publicId).toBe("legacy/ring");
    const saved = await updateProduct(created.id, productInput(cat.id, { images: edit!.images, price: 599 }));
    expect(saved.price).toBe(599);
    expect(saved.images[0]).toMatchObject(image);
    const stored = await Product.findById(created.id).lean();
    expect(stored?.images[0]?.publicId).toBe("legacy/ring");
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

  it("finds partial names, common category misspellings and SKUs, with real multiselect variant facets", async () => {
    const category = await makeCategory("Bracelets");
    const product = await createProduct(productInput(category.id, { name: "Everyday Chain", sku: "BR-104", color: "Gold", variants: [{ sku: "BR-104-S", size: "S", color: "Silver", stock: 3 }, { sku: "BR-104-M", size: "M", color: "Gold", stock: 2 }] }));
    for (const q of ["brace", "braclet", "kangan", "chain", "BR-104-S"]) {
      const found = await listPublicProducts(productQuerySchema.parse({ q }));
      expect(found.products.map(p => p.id), q).toContain(product.id);
    }
    expect((await listPublicProducts(productQuerySchema.parse({ q: "[" }))).pagination.total).toBe(0);
    expect((await listPublicProducts(productQuerySchema.parse({ color: "Silver|Gold", size: "S" }))).pagination.total).toBe(1);
    expect((await listPublicProducts(productQuerySchema.parse({ color: "Gold", size: "S" }))).pagination.total).toBe(0);
    expect((await listPublicProducts(productQuerySchema.parse({ color: "Gold", size: "M" }))).pagination.total).toBe(1);
    const facets = await getCatalogueFilters(category.slug);
    expect(facets.color).toEqual([{ value: "Gold", count: 1 }, { value: "Silver", count: 1 }]);
    expect(facets.size).toEqual([{ value: "M", count: 1 }, { value: "S", count: 1 }]);
  });

  it("gives duplicated variants fresh SKUs and no copied reservations", async () => {
    const cat = await makeCategory();
    const source = await createProduct(productInput(cat.id, { variants: [{ sku: "OPTION", size: "S", stock: 3 }] }));
    await Product.updateOne({ _id: source.id }, { $set: { reservedStock: 1, "variants.0.reservedStock": 1 } });
    const copy = await duplicateProduct(source.id);
    const second = await duplicateProduct(source.id);
    expect(copy.variants[0]?.sku).not.toBe("OPTION");
    expect(second.variants[0]?.sku).not.toBe(copy.variants[0]?.sku);
    const stored = await Product.findById(copy.id).lean();
    expect(stored?.variants[0]).toMatchObject({ size: "S", stock: 3, reservedStock: 0 });
    expect(stored?.reservedStock).toBe(0);
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
  it("preserves product and category aliases when slugs are edited", async () => {
    const cat = await makeCategory();
    const product = await createProduct(productInput(cat.id));
    await updateProduct(product.id, productInput(cat.id, { slug: "renamed-ring" }));
    expect((await getPublicProductBySlug(product.slug))?.slug).toBe("renamed-ring");
    const renamed = await updateCategory(cat.id, { slug: "everyday-rings" });
    expect(renamed.previousSlugs).toContain("rings");
    expect((await listPublicProducts(productQuerySchema.parse({ category: "rings" }))).pagination.total).toBe(1);
    await expect(createProduct(productInput(cat.id, { slug: product.slug, sku: "NEW-SKU" }))).resolves.toMatchObject({ slug: `${product.slug}-2` });
  });

  it("filters and sorts by displayed variant prices and published review ratings", async () => {
    const cat = await makeCategory();
    const variant = await createProduct(productInput(cat.id, { price: 999, variants: [{ sku: "SMALL", size: "S", price: 299, stock: 1 }] }));
    expect(variant.price).toBe(999); // The editor must retain the base price, not the listing minimum.
    expect((await getPublicProductBySlug(variant.slug))?.price).toBe(299);
    const fake = await createProduct(productInput(cat.id, { slug: "other-ring", sku: "OTHER" }));
    await Product.updateOne({ _id: fake.id }, { $set: { ratingAverage: 5, ratingCount: 999 } });
    await Review.create({ productId: variant.id, userId: new Types.ObjectId(), authorName: "Buyer", rating: 4, isPublished: true });
    await Review.create({ productId: fake.id, userId: new Types.ObjectId(), authorName: "Hidden", rating: 5, isPublished: false });
    expect((await listPublicProducts(productQuerySchema.parse({ maxPrice: 300 }))).products.map((product) => product.id)).toEqual([variant.id]);
    expect((await listPublicProducts(productQuerySchema.parse({ minRating: 4 }))).products.map((product) => product.id)).toEqual([variant.id]);
    const sorted = await listPublicProducts(productQuerySchema.parse({ sort: "rating" }));
    expect(sorted.products.map((product) => product.ratingCount)).toEqual([1, 0]);
    expect((await listPublicProducts(productQuerySchema.parse({ q: "minimal" }))).pagination.total).toBe(2);
  });

  it("rejects removal or reduction of reserved variants and preserves active holds", async () => {
    const cat = await makeCategory();
    const input = productInput(cat.id, { variants: [{ sku: "HELD", stock: 2 }] });
    const product = await createProduct(input);
    await Product.updateOne({ _id: product.id }, { $set: { reservedStock: 1, "variants.0.reservedStock": 1 } });
    await expect(updateProduct(product.id, { ...input, variants: [] })).rejects.toMatchObject({ code: "CONFLICT" });
    await expect(deleteProduct(product.id)).rejects.toMatchObject({ code: "CONFLICT" });
    await updateProduct(product.id, { ...input, price: 599 });
    expect((await Product.findById(product.id).lean())?.variants[0]?.reservedStock).toBe(1);
  });

});
