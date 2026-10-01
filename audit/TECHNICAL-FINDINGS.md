# SatvaStones technical SEO audit — live baseline

Audited 1 October 2026 (India time). Canonical production host verified from current HTTP responses and browser DOM: **https://www.satvastones.in**. Earlier web-tool snapshots showed the opposite redirect direction and were stale; direct HTTP and current browser evidence take precedence.

This report describes the live deployment before this task's local changes. Local implementation fixes require deployment and a follow-up crawl before they can be called production fixes.

## Coverage and evidence

- Bounded crawl: 500-URL maximum, five workers, one-second worker delay, robots respected, internal links plus XML sitemap, parameter expansion restricted to category and pagination.
- Completed the discovered crawl frontier: **111 URL requests**, including redirect aliases, pagination and homepage slash variants. **110 final HTTP 200 responses; one HTTP 404** on Cloudflare's `/cdn-cgi/l/email-protection` fallback. This was not a broken product page.
- Sitemap: **83 URLs**; **66 product pages** inspected. All sitemap URLs ended at HTTP 200 during this crawl.
- Raw HTML includes product/category text, metadata and JSON-LD. All inspected JSON-LD parsed successfully.
- Browser verification: homepage at desktop 1280 px and mobile 390 × 844 px; one product at mobile 390 × 844 px. Screenshots are in `audit/screenshots/`.
- Google PageSpeed API mobile and desktop calls returned **HTTP 429, quota unavailable**. No measured LCP, INP, CLS, CrUX assessment or Lighthouse score is available. Whole-response crawl timings below are not Core Web Vitals.
- Full HTTP/metadata/schema evidence: `live-crawl.json`; redirect checks: `live-redirects.json`; originals: `live-robots.txt`, `live-sitemap.xml`; delivery sample: `IMAGE-SUMMARY.json`.

## Technical score

**74/100 live baseline**, an editorial assessment of inspected technical implementation, not a search-engine score or ranking forecast. Equal weight across the eight assessed categories below, rounded to the nearest integer. Core Web Vitals is excluded because measured data is unavailable. IndexNow is an optional opportunity, not a Google indexing requirement.

| Category | Status | Score | Evidence |
|---|---|---:|---|
| Crawlability | Warning | 75 | robots and sitemap 200; exact private-route exclusions incomplete; category architecture mixed |
| Indexability | Warning | 80 | canonicals/noindex/real 404 working; three product descriptions absent; one duplicate product title pair |
| Security | Pass | 95 | HTTPS, CSP, HSTS, frame restriction, nosniff and referrer policy verified |
| URL structure | Warning | 70 | permanent aliases work; category links redirect; HTTP apex has two hops; 21 URLs exceed 100 characters |
| Mobile | Warning | 65 | no observed horizontal overflow; header controls measure only 24 px tall |
| Core Web Vitals | Unverified | — | PSI quota rejected both calls; source risks and image sizes inspected |
| Structured data | Warning | 65 | Product/Breadcrumb/Organization present; two ProductGroups have `variant=undefined` |
| JavaScript rendering | Pass | 90 | critical content and SEO fields already present in initial HTML |
| IndexNow | Opportunity | 50 | no implementation detected in inspected project source; third-party submissions cannot be ruled out |

## Critical issues

No confirmed live site-wide crawl or indexing block, HTTPS failure or product HTTP 5xx error was found. Search Console coverage and manual actions were not available to this audit.

## High priority

1. **Invalid variant offer URLs.** Both `/products/best-minimalist-everyday-couple-rings` and `/products/pastel-stone-double-drop-earrings-18k-gold-plated-minimalist-korean-aesthetic-jewelry` render distinct variants with the identical `?variant=undefined` offer URL and no variant SKU. Use a stable, existing SKU for each variant's `sku`, `@id`, URL and selectable purchase state; keep the parent canonical. Do not invent a missing identifier. Validate the rendered ProductGroup and actual variant selection after deployment.

2. **Small header touch targets caused by CSS layering.** Mobile menu, search and shopping bag measure **44 × 24 px**. The base-layer mobile `button, a { min-height: 24px; }` overrides the component-layer `.icon-button` min-height. Remove that override or put the intended sizing in the correct CSS layer; use at least 44–48 px for key controls and provide adequate spacing. Check computed boxes after deployment, not just source declarations.

3. **Three missing product meta descriptions.** These pages have no `<meta name="description">`: `/products/gold-paperclip-chain-heart-charm-bracelet-for-womens`, `/products/minimalist-everyday-jewelry-choker`, `/products/dainty-pave-crystal-bowknot-stud-earrings`. Use authored SEO description → short description → stripped full description → truthful name/category fallback. Trim to a sensible snippet length; do not add unsupported waterproof/material claims.

4. **Public-page response latency needs real performance measurement.** One `/shop` response took **23.1 seconds** to download and one product took **8.5 seconds**. These are single crawl request observations, subject to network/cold-start conditions. Product/shop responses are `private, no-cache, no-store`. Root layout reads `headers()` and product reviews call `auth()`, making caching decisions sensitive. Profile MongoDB queries/origin response timing; cache only public catalogue/settings data with invalidation and fresh stock. Do not publicly cache a personalized response. Then measure real mobile LCP/INP/CLS with an authenticated PSI key or Lighthouse plus field monitoring.

## Medium priority

5. **Category paths redirect to query URLs.** Current `/shop/rings`, `/shop/earrings`, `/shop/bracelets` and other clean category paths 308 to `/shop?category=...`; sitemap and breadcrumb canonicals currently use those query URLs, while header/category/footer links use clean paths. This is coherent indexing but wastes internal hops and mixes architecture. Choose a single canonical architecture. For clean paths, serve category content there, redirect equivalent query URLs to them, and align links, schema and sitemap. Preserve search/facet parameters during migration and self-canonicalize pagination.

6. **Robots exclusions miss exact private roots.** `/cart/` does not match `/cart`, and similarly for `/admin`, `/account`, `/checkout`, `/wishlist`. The login route is correctly noindex. Use exact-root rules plus descendant rules for intentionally private areas. Keep page-level noindex on private responses; robots blocking alone does not guarantee deindexing. [Google robots documentation](https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec).

7. **Homepage identity depends on banner text.** Live H1 is simply `Rings`, while the title describes the whole jewellery brand. Keep a stable brand/product-purpose H1 with natural India/local context; move campaign titles into an appropriate subordinate heading. Existing hero image and CTA are visible above the mobile fold.

8. **Entity identity is sparse.** Organization has a free-text Vapi address and empty `sameAs`; no stable entity `@id` or logo is present. Add only verified business identity, structured postal components, public social profiles and service geography. The visible address supports Vapi, Gujarat context; it does not establish a customer-facing shop. Do not mark `JewelryStore`, opening hours, map pins or walk-in availability without confirmation of real operations. [Google Organization documentation](https://developers.google.com/search/docs/appearance/structured-data/organization).

9. **One exact product-title duplicate pair.** `/products/anti-tarnish-gold-plated-minimal-bracelet-women` and `/products/anti-tarnish-gold-plated-minimal-bracelet-for-women` both have `Anti Tarnish Gold Plated Minimal Bracelet for Women`. Review the actual SKUs/images. Distinct products need accurate distinguishing copy; equivalent records should be consolidated with a permanent redirect after business review. Do not automatically merge them from names alone.

10. **Product shipping/return entity links are limited.** Existing Product offers include real price/currency/availability and seller. Organization policy identity and policy links can be strengthened using actual visible policies. Add detailed delivery times, return windows or costs only when confirmed, and ensure structured data mirrors the visible merchant policies.

## Low priority

11. **Two-hop HTTP apex redirect.** `http://satvastones.in/` → `https://satvastones.in/` (308) → `https://www.satvastones.in/` (308). Consolidate HTTP apex directly to HTTPS www at the Cloudflare/Vercel domain layer where possible. HTTPS apex and HTTP www each have one hop. `/qanda` and `/product/...` aliases each have a correct one-hop permanent redirect.

12. **Long descriptive slugs.** 21 crawled URLs exceed 100 characters. Prefer concise new slugs. Existing indexed product URLs should not be changed solely to shorten them; preserve redirects and product references if a real rename is necessary.

13. **IndexNow optional integration.** Add verified key-hosting and server-side batch submissions for published product/category additions, changes and removals if Bing visibility is part of the plan. Exclude private and unpublished URLs; record submission results. Google does not use this submission protocol. [IndexNow documentation](https://www.indexnow.org/documentation).

14. **Cloudflare email-obfuscation fallback.** Raw source exposes `/cdn-cgi/l/email-protection`, which returns 404 to this audit while the rendered browser resolves the contact email. Review the Cloudflare setting if reliable no-JavaScript contact access matters. This is not evidence that the contact page or products are broken.

## Performance and images

Positive source controls: Cloudinary `f_auto,q_auto,w_...` responsive delivery; hero preload and high fetch priority; `sizes`/`srcset`; lazy below-fold images; aspect-ratio image containers; font `display: swap` and fallback adjustment; GA4 loaded lazily; no Lenis provider mounted in the inspected root layout.

All **664 image-tag observations** had an `alt` attribute. This includes repeated images across pages and valid decorative/thumbnail empty alt values; it is not a count of unique assets. Missing explicit image width/height is not automatically a CLS defect here because `next/image` fill containers reserve space using CSS aspect ratio.

| Actual delivery sample | Bytes | Format |
|---|---:|---|
| Homepage hero, 640 px | 50,980 | WebP |
| Product image, 384 px | 35,500 | WebP |
| Product image, 640 px | 86,848 | WebP |
| Category thumbnail, 256 px | 10,112 | WebP |

All four sampled variants returned 200 and immutable delivery caching. Original JSON-LD images sometimes point at untransformed uploads, so keep rendered image delivery and social/schema image delivery quality under review.

Measured Core Web Vitals remain **unknown**. Assess LCP around 2.5 seconds, INP around 200 ms and CLS around 0.1 using the 75th percentile of real-user data; lab data must be labelled separately. [Web Vitals reference](https://web.dev/articles/vitals).

## JavaScript and visual conclusions

Initial HTML carries titles, descriptions where available, canonicals, robots directives, product text, offer data and navigation; core crawlability does not require JavaScript execution. Interactive gallery, cart, search and authenticated review controls do require it. The mobile homepage and sampled product had no horizontal overflow. Product mobile H1 begins around y=694 and the purchase controls are below the fold; consider a concise summary or a purchase CTA that remains reachable, after user-experience testing.

No detailed hreflang graph was needed: the inspected site is an English-language India storefront and no alternate-language implementation was detected. No multilingual/local-country templates should be invented merely to expand index coverage.

## Verification after deploying the local fixes

- Fetch robots, sitemap, homepage, one populated category, empty category, three formerly missing-description products, both variant products, page 2 and a missing URL.
- Confirm canonical destination 200, direct internal category links, retained canonical query-category sitemap entries, no duplicate or undefined variant URLs, correct noindex for private/filter pages and real 404s. The implemented revision keeps the existing query-category architecture rather than migrating it.
- Check Google Rich Results Test on a simple Product and a ProductGroup, then inspect representative URLs in Search Console.
- Recheck computed mobile touch boxes and screenshots; obtain field CWV/Lighthouse evidence rather than assigning speculative performance scores.
