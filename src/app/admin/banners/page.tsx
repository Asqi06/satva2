import type { Metadata } from "next";
import { BannerManager } from "@/features/admin/BannerManager";

export const metadata: Metadata = { title: "Banners" };

export default function AdminBannersPage() {
  return <BannerManager />;
}
