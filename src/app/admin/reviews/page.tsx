import type { Metadata } from "next";
import { ReviewsTable } from "@/features/admin/ReviewsTable";

export const metadata: Metadata = { title: "Reviews" };

export default function AdminReviewsPage() {
  return <ReviewsTable />;
}
