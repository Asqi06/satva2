/**
 * Jev-powered SEO readiness report for one product page.
 *
 * Usage:
 *   npm run seo:readiness -- <product-slug>
 *
 * Reads the live product via product-service, scores it with
 * assessProductSeo (Jev Scores + deterministic checks), prints the
 * composite. Requires MONGODB_URI + TYPESAFE_API_KEY in .env.local.
 * Without the key it prints deterministic checks only.
 */
import mongoose from "mongoose";
import { getClientEnv } from "@/lib/env";
import { getPublicProductBySlug } from "@/services/product-service";
import { assessProductSeo } from "@/services/seo-readiness-service";

function bar(score01: number): string {
  const filled = Math.round(score01 * 10);
  return `${"█".repeat(filled)}${"░".repeat(10 - filled)}`;
}

async function main(): Promise<void> {
  const slug = process.argv[2]?.trim();
  if (!slug) {
    console.error("Usage: npm run seo:readiness -- <product-slug>");
    process.exit(1);
  }
  const product = await getPublicProductBySlug(slug);
  if (!product) {
    console.error(`No published product found for slug "${slug}".`);
    await mongoose.disconnect();
    process.exit(1);
  }

  const appUrl = getClientEnv().NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const title = product.seo.title || `${product.name} | SatvaStones`;
  const description =
    product.seo.description || product.shortDescription || product.description.slice(0, 155);

  const report = await assessProductSeo({
    url: `${appUrl}/products/${product.slug}`,
    title,
    metaDescription: description,
    h1: product.name,
    bodyText: `${product.shortDescription ?? ""}\n${product.description}`,
    imageAlts: product.images.map((i) => i.alt),
    jsonLdTypes: ["Product", "BreadcrumbList"],
    canonical: `${appUrl}/products/${product.slug}`,
    reviewCount: product.ratingCount,
    ratingAverage: product.ratingAverage,
    categoryName: product.category.name,
  });

  console.log(`\nSEO readiness — ${product.name} (${product.slug})`);
  console.log(`URL: ${appUrl}/products/${product.slug}`);
  console.log(`Model: ${report.model}`);
  if (!report.available) {
    console.log("Jev unavailable: TYPESAFE_API_KEY not set.");
  }
  console.log(`\nScore: ${report.score}/100 — ${report.verdict}`);
  for (const d of report.dimensions) {
    console.log(
      `  ${bar(d.score01)} ${d.label}: ${Math.round(d.score01 * 100)} (confidence ${d.confidence}${d.uncertain ? ", UNCERTAIN" : ""})`,
    );
  }
  console.log("  Checks:");
  for (const c of report.checks) {
    console.log(`    ${c.pass ? "✓" : "✗"} ${c.label} — ${c.detail}`);
  }
  console.log(`\nNote: ${report.note}`);
  console.log("Readiness ≠ ranking probability: Jev sees the page, not competitors or backlinks.\n");

  await mongoose.disconnect();
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
