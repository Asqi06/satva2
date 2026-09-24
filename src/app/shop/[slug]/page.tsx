import { notFound, permanentRedirect } from "next/navigation";
import { getCategoryBySlug } from "@/services/category-service";

export default async function LegacyCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();
  permanentRedirect(`/shop?category=${encodeURIComponent(category.slug)}`);
}
