import { notFound, permanentRedirect } from "next/navigation";
import { getPublicProductSlug } from "@/services/product-service";

export default async function LegacyProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const currentSlug = await getPublicProductSlug(slug);
  if (!currentSlug) notFound();
  permanentRedirect(`/products/${encodeURIComponent(currentSlug)}`);
}
