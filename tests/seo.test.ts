import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connectDb, resetDbCache } from "@/lib/db";
import { Banner } from "@/models/Banner";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";

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
    for (const m of [Banner, Category, Product]) await m.syncIndexes();
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
