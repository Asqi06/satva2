import type { Metadata } from "next";
import { OrdersTable } from "@/features/admin/OrdersTable";

export const metadata: Metadata = { title: "Orders" };

export default function AdminOrdersPage() {
  return <OrdersTable />;
}
