import { connectDb } from "@/lib/db";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { User } from "@/models/User";

/** Admin dashboard KPIs. Sales count PAID orders only (server truth). */

export interface DashboardStats {
  totalSales: number;
  todaySales: number;
  orderCount: number;
  paidOrderCount: number;
  customerCount: number;
  avgOrderValue: number;
  productsSold: number;
  pendingOrders: number;
  lowStock: { id: string; name: string; sku: string; stock: number; threshold: number }[];
  salesByDay: { date: string; sales: number; orders: number }[];
  topProducts: { id: string; name: string; sold: number }[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  await connectDb();
  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const [salesAgg, todayAgg, orderCount, paidCount, customerCount, soldAgg, pendingOrders, lowStock, daily, top] =
    await Promise.all([
      Order.aggregate<{ total: number }>([
        { $match: { paymentStatus: "PAID" } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      Order.aggregate<{ total: number }>([
        { $match: { paymentStatus: "PAID", createdAt: { $gte: startOfToday } } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      Order.countDocuments({}),
      Order.countDocuments({ paymentStatus: "PAID" }),
      User.countDocuments({ role: "CUSTOMER" }),
      Product.aggregate<{ sold: number }>([
        { $group: { _id: null, sold: { $sum: "$soldQuantity" } } },
      ]),
      Order.countDocuments({ orderStatus: "PENDING" }),
      Product.find({ $expr: { $lte: [{ $subtract: ["$stock", "$reservedStock"] }, "$lowStockThreshold"] } })
        .sort({ stock: 1 })
        .limit(10)
        .select("name sku stock reservedStock lowStockThreshold")
        .lean(),
      Order.aggregate<{ date: string; sales: number; orders: number }>([
        { $match: { paymentStatus: "PAID", createdAt: { $gte: twoWeeksAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            sales: { $sum: "$total" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: "$_id", sales: 1, orders: 1 } },
      ]),
      Product.find({})
        .sort({ soldQuantity: -1 })
        .limit(5)
        .select("name soldQuantity")
        .lean(),
    ]);

  const totalSales = salesAgg[0]?.total ?? 0;
  return {
    totalSales,
    todaySales: todayAgg[0]?.total ?? 0,
    orderCount,
    paidOrderCount: paidCount,
    customerCount,
    avgOrderValue: paidCount > 0 ? Math.round(totalSales / paidCount) : 0,
    productsSold: soldAgg[0]?.sold ?? 0,
    pendingOrders,
    lowStock: lowStock.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      sku: p.sku,
      stock: p.stock - p.reservedStock,
      threshold: p.lowStockThreshold,
    })),
    salesByDay: daily,
    topProducts: top.map((p) => ({ id: p._id.toString(), name: p.name, sold: p.soldQuantity })),
  };
}
