import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connectDb, resetDbCache } from "@/lib/db";
import { Category } from "@/models/Category";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { User } from "@/models/User";
import { getDashboardStats } from "@/services/admin-dashboard-service";

const IMG = {
  publicId: "t/1",
  secureUrl: "https://res.cloudinary.com/x/image/upload/t/1",
  alt: "Piece",
  isThumbnail: true,
};
const ADDRESS = {
  fullName: "Test User",
  phone: "9876543210",
  addressLine1: "1 Main St",
  city: "Vapi",
  state: "Gujarat",
  pincode: "396191",
  isDefault: true,
};

async function paidOrder(userId: string, productId: string, total: number) {
  return Order.create({
    userId,
    items: [{ productId, name: "Ring", qty: 1, unitPrice: total, totalPrice: total }],
    shippingAddress: ADDRESS,
    subtotal: total,
    discount: 0,
    shipping: 0,
    tax: 0,
    total,
    paymentStatus: "PAID",
    orderStatus: "CONFIRMED",
  });
}

describe("admin dashboard", () => {
  let mongod: MongoMemoryServer | undefined;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();
    resetDbCache();
    await connectDb();
    for (const m of [Category, Order, Product, User]) await m.syncIndexes();
  }, 120000);

  afterAll(async () => {
    await mongoose.disconnect();
    resetDbCache();
    if (mongod) await mongod.stop();
  });

  beforeEach(async () => {
    await Category.deleteMany({});
    await Order.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});
  });

  it("reports zeros on an empty store", async () => {
    const stats = await getDashboardStats();
    expect(stats).toMatchObject({
      totalSales: 0,
      todaySales: 0,
      orderCount: 0,
      paidOrderCount: 0,
      customerCount: 0,
      avgOrderValue: 0,
      productsSold: 0,
      pendingOrders: 0,
    });
    expect(stats.lowStock).toEqual([]);
  });

  it("aggregates sales, customers, low stock and top products", async () => {
    const customer = await User.create({ email: "c@x.co", name: "C" });
    await User.create({ email: "admin@x.co", name: "A", role: "ADMIN" });
    const cat = await Category.create({ name: "Rings", slug: "rings" });
    const product = await Product.create({
      name: "Hot Ring",
      slug: "hot-ring",
      description: "d",
      categoryId: cat._id,
      images: [IMG],
      price: 500,
      sku: "HOT-001",
      stock: 2,
      lowStockThreshold: 5,
      soldQuantity: 7,
      isPublished: true,
    });
    await paidOrder(customer._id.toString(), product._id.toString(), 500);
    await paidOrder(customer._id.toString(), product._id.toString(), 700);
    await Order.create({
      userId: customer._id,
      items: [],
      shippingAddress: ADDRESS,
      subtotal: 0,
      discount: 0,
      shipping: 0,
      tax: 0,
      total: 0,
      paymentStatus: "PENDING",
      orderStatus: "PENDING",
    });

    const stats = await getDashboardStats();
    expect(stats.totalSales).toBe(1200);
    expect(stats.todaySales).toBe(1200);
    expect(stats.orderCount).toBe(3);
    expect(stats.paidOrderCount).toBe(2);
    expect(stats.customerCount).toBe(1);
    expect(stats.avgOrderValue).toBe(600);
    expect(stats.pendingOrders).toBe(1);
    expect(stats.lowStock.map((p) => p.sku)).toContain("HOT-001");
    expect(stats.topProducts[0]).toMatchObject({ name: "Hot Ring", sold: 7 });
    expect(stats.salesByDay.length).toBeGreaterThan(0);
  });
});
