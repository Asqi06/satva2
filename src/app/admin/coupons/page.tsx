import type { Metadata } from "next";
import { CouponManager } from "@/features/admin/CouponManager";

export const metadata: Metadata = { title: "Coupons" };

export default function AdminCouponsPage() {
  return <CouponManager />;
}
