import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connectDb, resetDbCache } from "@/lib/db";
import { Banner } from "@/models/Banner";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";
import { Settings } from "@/models/Settings";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import { generateMetadata as homeMetadata } from "@/app/page";
import { generateMetadata as shopMetadata } from "@/app/shop/page";
import { listPublicProducts } from "@/services/product-service";

delete process.env.NEXT_PUBLIC_APP_URL;

const IMG = {
  publicId: "t/1",
  secureUrl: "https://res.cloudinary.com/x/image/upload/t/1",
  alt: "Piece",
  isThumbnail: true,
};

describe("seo routes", () => {
  let mongod: MongoMemoryServer | undefined;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();
    resetDbCache();
    await connectDb();
    for (const m of [Banner, Category, Product, Settings]) await m.syncIndexes();
  }, 120000);

  afterAll(async () => {
    await mongoose.disconnect();
    resetDbCache();
    if (mongod) await mongod.stop();
  });

  beforeEach(async () => {
    await Banner.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Settings.deleteMany({});
  });

  it("sitemap covers static, category and product URLs", async () => {
    const cat = await Category.create({ name: "Rings", slug: "rings" });
    await Product.create({
      name: "Seo Ring",
      slug: "seo-ring",
      description: "d",
      categoryId: cat._id,
      images: [IMG],
      price: 500,
      sku: "SEO-001",
      stock: 5,
      isPublished: true,
    });
    const urls = (await sitemap()).map((e) => ("url" in e ? e.url : ""));
    expect(urls).toContain("http://localhost:3000");
    expect(urls).toContain("http://localhost:3000/faq");
    expect(urls).toContain("http://localhost:3000/shop?category=rings");
    expect(urls).toContain("http://localhost:3000/products/seo-ring");
  });

  it("includes the full published catalogue with real modification dates", async () => {
    const cat = await Category.create({ name: "Rings", slug: "rings" });
    await Product.insertMany(Array.from({ length: 501 }, (_, i) => ({
      name: `Ring ${i}`, slug: `ring-${i}`, description: "Ring", categoryId: cat._id,
      images: [IMG], price: 500, sku: `R-${i}`, stock: 1, isPublished: true,
    })));
    const entries = await sitemap();
    expect(entries.filter((entry) => entry.url.includes("/products/"))).toHaveLength(501);
    expect(entries.find((entry) => entry.url.endsWith("/products/ring-500"))?.lastModified).toBeInstanceOf(Date);
    expect(entries.find((entry) => entry.url.endsWith("/shop?category=rings"))?.lastModified).toBeInstanceOf(Date);
    expect(entries.find((entry) => entry.url === "http://localhost:3000")?.lastModified).toBeUndefined();
  });

  it("finds a published category through Hinglish and editable aliases", async () => {
    const cat = await Category.create({ name: "Earrings", slug: "earrings", searchTerms: ["kaan ki bali"] });
    await Product.create({ name: "Gold Hoops", slug: "gold-hoops", description: "Gold hoops", categoryId: cat._id, images: [IMG], price: 500, sku: "GOLD-HOOPS", stock: 1, isPublished: true });
    for (const q of ["jhumka", "kaan ki bali"]) {
      const result = await listPublicProducts({ q, sort: "featured", page: 1, limit: 12 });
      expect(result.products.map((product) => product.slug)).toContain("gold-hoops");
    }
  });

  it("uses admin SEO copy and category images in page metadata", async () => {
    await Settings.create({ key: "site", homeSeoTitle: "Jewellery for Everyday India", homeSeoDescription: "Handpicked jewellery online.", shopSeoTitle: "Shop Satva Jewellery" });
    const cat = await Category.create({ name: "Rings", slug: "rings", image: { publicId: "c/1", secureUrl: IMG.secureUrl, alt: "Gold rings" }, seo: { title: "Buy Rings Online", description: "Shop rings in India." } });
    await Product.create({ name: "Ring", slug: "ring", description: "A ring", categoryId: cat._id, images: [IMG], price: 500, sku: "RING-SEO", stock: 1, isPublished: true });
    expect((await homeMetadata()).title).toEqual({ absolute: "Jewellery for Everyday India" });
    expect((await shopMetadata({ searchParams: Promise.resolve({}) })).title).toEqual({ absolute: "Shop Satva Jewellery" });
    const category = await shopMetadata({ searchParams: Promise.resolve({ category: "rings" }) });
    expect(category.title).toEqual({ absolute: "Buy Rings Online" });
    expect(category.description).toBe("Shop rings in India.");
    expect(category.openGraph?.images).toEqual([{ url: IMG.secureUrl, alt: "Gold rings" }]);
  });

  it("robots keeps private areas out with a sitemap pointer", async () => {
    const rules = await robots();
    expect(rules.sitemap).toBe("http://localhost:3000/sitemap.xml");
    const rule = Array.isArray(rules.rules) ? rules.rules[0] : rules.rules;
    const disallow = (rule as { disallow: string | string[] }).disallow;
    for (const path of ["/api/", "/admin/", "/account/", "/checkout/"]) {
      expect(disallow).toContain(path);
    }
  });
});
