import type { Metadata } from "next";
import { ProductsTable } from "@/features/admin/ProductsTable";

export const metadata: Metadata = { title: "Products" };

export default function AdminProductsPage() {
  return <ProductsTable />;
}
