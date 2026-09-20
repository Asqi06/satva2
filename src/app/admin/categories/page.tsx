import type { Metadata } from "next";
import { CategoryManager } from "@/features/admin/CategoryManager";

export const metadata: Metadata = { title: "Categories" };

export default function AdminCategoriesPage() {
  return <CategoryManager />;
}
