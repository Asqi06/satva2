# Catalogue SEO audit and implementation

Audit date: 1 October 2026. Scope: product detail, collection/category/search pages, and the sitemap in this codebase. Live production and local implementation are different evidence sources; code changes require deployment to affect production.

## Detection and validation

| Block | Detection before changes | Validation after changes |
| --- | --- | --- |
| Product / ProductGroup | Server JSON-LD on product page; child Product + Offer for variants | Pass in automated fixture checks: HTTPS context, names, INR price, availability, SKU, absolute URLs; literal material/colour/size, unique variant identifiers, direct variant links; no fabricated ratings. Conditional data depends on real catalogue records. |
| Product BreadcrumbList | Server JSON-LD and visible navigation | Pass: sequential positions and absolute canonical category/product URLs. |
| CollectionPage | Server JSON-LD on shop/category page | Pass: collection name agrees with page heading and pagination; absolute URL; contains ItemList of products actually returned for this page. CollectionPage/ItemList are semantic markup, not a promise of Google shopping rich results for category listings. |
| Collection BreadcrumbList | Previously category-only | Pass: now emitted for the main shop too; category crumb uses resolved canonical slug. |
| Microdata / RDFa | No itemScope/itemProp/typeof/vocab detected in scoped page source | No additions recommended. JSON-LD remains the primary format. |

No deprecated rich-result schema types were found in these scoped files. Existing ProductGroup `variesBy` could be an empty array for style-only options: it is now omitted when no supported size/colour dimension applies. Style is represented literally as PropertyValue; it is not relabelled as pattern. ProductGroup `variesBy` is recommended/conditional rather than a blanket required field in the current Google documentation.

The generated JSON-LD is implemented directly in the server page components and serialized with the existing HTML-safe helper. Ratings still come exclusively from published reviews; zero-review fixtures emit no AggregateRating. Variant prices and availability use the existing public-product service, which deducts reserved inventory and limits variants to the available parent stock.

## Fixed gaps

1. **High: product pages could override preview noindex.** Explicit product metadata always returned `robots.index=true`. Product and Googlebot now honor `isIndexingEnabled()`, including Vercel preview and the site's indexing kill switch.
2. **Low: unnecessary category redirect hops.** Suggestions linked the legacy `/shop/<slug>` route, which returns a permanent redirect. Suggestions now directly use `/shop?category=<slug>`, matching the live implementation and canonical URL. The parent live audit confirmed a 308 alias response; these were redirecting rather than broken links.
3. **Medium: renamed or differently cased category redirects discarded filters/search/sort.** Both metadata and page routing now normalize the category while preserving all remaining query values. Parsed category lookup also honors schema trimming.
4. **Medium: images absent from sitemap.** The product query now fetches image URLs and emits deduplicated image sitemap entries; populated category images are included too. This improves discovery of catalogue photographs without inventing images or alt text.
5. **Medium: incomplete collection entity descriptions.** Collection JSON-LD now links the visible product list, emits main-shop breadcrumbs, and uses the displayed collection/search heading. Product schema now exposes factual simple-product colour/size and stable entity IDs, distinct variant URLs and explicit parent relationships. Product sellers and collection parent websites share the home-page Organization/WebSite IDs.
6. **Low: thin collection fallback.** Where no category description exists, a short visible shopping paragraph points to current product options/material details, shipping and return information. Existing admin-written category descriptions still take precedence.
7. **Info: ignored sitemap hints.** Removed priority/changefreq, which Google ignores. Existing real catalogue updatedAt values are preserved; static pages do not receive fabricated daily dates.
8. **New page discovery:** included `/guides/jewellery-buying-guide`, the substantive guide being implemented by the parent agent. No location doorway pages are created.
9. **High: missing descriptions on legacy products.** Parent's live crawl found three product URLs with no description. Whitespace-only SEO title/descriptions and product copy now trigger a factual fallback made from the stored product name, category and existing specifications. The same fallback is visible in the Description section and emitted in product JSON-LD; it invents no benefits or materials. Verified affected live paths: `/products/gold-paperclip-chain-heart-charm-bracelet-for-womens`, `/products/minimalist-everyday-jewelry-choker`, `/products/dainty-pave-crystal-bowknot-stud-earrings`.
10. **High: malformed legacy variant data.** Parent's live crawl found variants without SKUs and offers ending in `?variant=undefined` on `/products/best-minimalist-everyday-couple-rings` and `/products/pastel-stone-double-drop-earrings-18k-gold-plated-minimalist-korean-aesthetic-jewelry`. JSON-LD now excludes unidentified variants. When all variants are unidentified, it emits factual Product information without invented offers; no fake SKU or option link is generated. For a valid parent group lacking a SKU, its real product ID is the group identifier. The admin must supply actual unique variant SKUs to restore variant offers and purchasing parity; checkout data was not altered.

## Preserved controls

- Only published products are queried for sitemap entries. Only published, populated categories enter the sitemap; empty categories remain noindexed.
- Public product slug aliases redirect permanently to the current slug; missing products/categories and pagination past the last results return notFound.
- Search, price, material, sort and other facet combinations remain noindexed. Main category pages and valid unfiltered pagination retain distinct canonical URLs.
- Sitemap catalogue errors continue to fail instead of quietly publishing an incomplete product list.
- Product and breadcrumb JSON-LD remain in server-rendered HTML and retain the safe serialization helper.

## Remaining data and launch work

- Publish unique product descriptions, accurate materials, dimensions, care instructions and descriptive image alt text through the existing admin interface. Generic or repeated catalogue copy cannot be repaired truthfully by manufacturing product attributes.
- For each real category, provide useful category copy describing its actual assortment and selection considerations; the fallback paragraph is only a baseline. Avoid repeated city-name pages for a single online seller in Vapi.
- Add manufacturer brand or GTIN only when they are known for the actual product. Do not label the seller as the manufacturer automatically.
- Structured shipping/delivery and return-policy markup require verified policy data. Free shipping applies to discounted basket subtotal, so a flat per-product shipping offer would misrepresent multi-item orders. No estimated delivery times or blanket return rights were invented.
- Submit the deployed sitemap in Search Console and monitor Product snippets/Merchant listings reports. Verify Cloudinary image-domain ownership in Search Console for image sitemap diagnostics when applicable.
- Split the sitemap before reaching 50,000 URLs or 50 MB uncompressed; current implementation and existing 501-product regression coverage suit a small catalogue.

## Evidence and limitations

The live shop was readable using the web tool, but the live `/sitemap.xml` fetch returned a tool internal error; this is not sufficient evidence that production's sitemap is broken. Full raw production HTML/schema and HTTP coverage belong to the parent audit crawl. This scoped report validates local source and controlled fixtures; it does not claim a Google Rich Results Test or production ranking pass.

Read installed Next.js 16.3.5 documentation for metadata, JSON-LD, and sitemap image support before edits. Current Google documentation was checked on the audit date:

- [Product variants: canonical/preselection rules, supported variesBy dimensions and nested Product requirements](https://developers.google.com/search/docs/appearance/structured-data/product-variants)
- [Product snippet required and recommended properties](https://developers.google.com/search/docs/appearance/structured-data/product-snippet)
- [Image sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/image-sitemaps)

Verification: all 10 dedicated `tests/catalogue-seo.test.ts` tests passed, and scoped ESLint passed. Coverage includes preview robots, blank legacy copy fallbacks, factual product attributes/ratings, malformed SKU suppression, direct variant selection and price/stock parity, style-only schema, redirect parity/filter preservation, collection links/breadcrumbs, direct canonical category suggestions, and image sitemap/published query/empty-category/date controls. Full build and app-wide checks are handled by the parent agent.
