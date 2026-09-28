# SatvaStones technical SEO and commerce audit

Date: 28 September 2026. Repository: `D:\newsatva`.

## Scope and evidence

Reviewed the App Router pages, metadata, sitemap/robots, public/admin APIs, catalogue models and services, authentication, cart, coupons, inventory, Razorpay settlement/refunds, uploads, notification templates, analytics, policies, deployment configuration and existing checks. Changes preserve the existing typography, palette and page layouts. No dependencies or framework migrations were introduced.

This report describes the local revision. It has not been committed, pushed or deployed. The successful sitemap status and PageSpeed score of 90 previously reported by the owner are existing production results; this audit does not claim a new score or improved rankings.

Public HTTP observations on the deployed domain: HTTP apex → HTTPS apex (308), HTTPS apex → HTTPS www (308), HTTPS www homepage/robots/sitemap → 200. Hosting already prefers `https://www.satvastones.in`. Local browser checks exercise the changed routes; deployment still needs verification.

## Architecture

- Next.js 16.3.5, React 19.2.8, TypeScript, Tailwind 4 and App Router server components.
- Hybrid rendering: homepage, about/contact/FAQ/policies are prerendered with 60-second ISR; product and shop pages are rendered on the server on demand. Important content is in initial HTML, rather than an empty client root.
- MongoDB/Mongoose supply products, categories, settings, reviews, users, carts, orders, payments and inventory records. Checkout now needs MongoDB transactions, supported by Atlas/replica sets.
- Auth.js Google login with JWT sessions and database role checks; admin APIs require server authorization.
- Razorpay handles payment collection; the server calculates prices, discounts, shipping and totals and confirms capture with Razorpay.
- Cloudinary stores media; existing responsive image delivery uses automatic format/quality transformations. Resend sends operational email. Optional GA4 loads after the page load; Razorpay loads for checkout; existing Lenis loading/reduced-motion behaviour is retained.
- Public product identity uses slugs. Legacy `/product/[slug-or-id]` routes and category routes remain compatible with permanent redirects. There is no working blog, location-page system or Merchant Center feed in this repository.

## Critical problems

| Problem | Why it matters | Action/status |
| --- | --- | --- |
| A database credential was present in tracked `.env.example` | Anyone with repository history may obtain database access | Replaced with a safe placeholder. **Owner must rotate the exposed MongoDB password and update hosting secrets immediately. Removing it from the file does not remove it from Git history.** |
| Razorpay webhook expected a top-level payload ID that actual events do not provide | Genuine payment events could be acknowledged without settling orders | Use `x-razorpay-event-id`, with a raw-body hash fallback; retain signature validation and return 503 on processing failure so retries can occur. |
| Checkout/order/inventory/coupon writes were not one atomic operation | Concurrent requests or a failed later line could leave partial holds, inconsistent orders or duplicate checkout | Transactions now include fresh cart validation, order creation, coupon use, all inventory holds and cart clearing. Added failure/parallel-request checks. |
| Payment settlement trusted a signature without confirming capture and amount | Authorization or a mismatched payment could be treated as a completed purchase | Both verification and capture webhooks verify gateway capture, order identity, INR currency and exact paise amount before atomic settlement. |

Webhook handling follows [Razorpay event-header and retry guidance](https://razorpay.com/docs/webhooks/best-practices/) and [raw-body signature validation](https://razorpay.com/docs/webhooks/validate-test/). Capture validation follows the [server integration steps](https://razorpay.com/docs/payments/server-integration/nodejs/integration-steps/).

## High priority problems and fixes

| Issue | Fix | Principal files |
| --- | --- | --- |
| Missing products/categories and invalid/out-of-range pagination could stream 200 before rendering “not found” | Remove the root loading boundary and validate shop metadata before rendering. Local HTTP checks now receive actual 404 responses. | `src/app/loading.tsx` deleted; `src/app/shop/page.tsx` |
| Preview deployments could inherit production indexing rules | Add environment indexing guard, preview robots disallow and `X-Robots-Tag: noindex, nofollow`; preview sitemap is empty. | `src/lib/env.ts`, `next.config.ts`, `src/app/layout.tsx`, `robots.ts`, `sitemap.ts` |
| Database failure silently produced a shortened successful sitemap | Throw/log the failure instead of serving a misleading partial catalogue. Keep real modification dates and canonical public entries. | `src/app/sitemap.ts` |
| Pagination canonicalized distinct pages to the first page | Each category/page combination now has its own canonical and page-number title. Search, price/rating/stock facets and nondefault sorts are noindex/follow. | `src/app/shop/page.tsx` |
| Admin slug changes broke existing product/category links | Preserve previous slugs and redirect aliases permanently; reserve aliases against future reuse. | Product/Category models and catalogue services; product/shop pages |
| Product list price/availability, variant selections, filters and schema could disagree with checkout | Display effective variant prices and held-adjusted stock; sort/filter on displayed values; require an actual SKU for products with variants. Retain the original base price in the admin editor. | `product-service.ts`, `cart-service.ts`, `PurchasePanel.tsx`, `ProductCard.tsx`, product page |
| Variant schema did not represent selectable options accurately | ProductGroup contains actual SKU offers, option URLs and size/color attributes; `?variant=SKU` preselects that option, including sold-out options. Canonical remains the base product URL. | `src/app/products/[slug]/page.tsx`, `PurchasePanel.tsx` |
| Imported/default ratings could appear without supporting reviews | Use published review records for storefront totals, filters and sorting; migrations default to zero; homepage testimonials require a verified purchase. | `product-service.ts`, `src/app/page.tsx`, migration script, review section |
| Embedded JSON-LD and email HTML did not escape all stored/user text | Shared JSON-LD serialization escapes `<`; notification HTML escapes interpolated customer/product/coupon values. | `src/utils/jsonld.ts`, schema-emitting pages, notification templates |
| Failed payment attempts ended retryable orders; late failures could downgrade successful payment | Keep an unpaid order retryable until expiry; protect PAID/REFUNDED states and handle legacy failed reservations in expiry cleanup. | `order-service.ts`, `inventory-service.ts` |
| Refund request was treated as completion; duplicate requests and shipping races could affect inventory | Claim refund requests, wait for gateway confirmation, block fulfilment while pending, settle once transactionally, refuse partial-refund restocking and use current fulfilment status. Shipped goods are not restocked before a recorded return. | `admin-order-service.ts`, `order-service.ts`, `AdminOrderActions.tsx`, Razorpay helper |
| Admin stock edits/deletions could discard active reservations; duplicate products copied variant SKUs/holds | Preserve held quantities, reject destructive edits to held options/products, generate fresh copy SKUs and clear copy reservations. Keep shared media when deleting a product. | `product-service.ts`, Product model |
| Shipping statements contradicted checkout; return claims overpromised | Derive threshold/fee from settings in header/footer/FAQ/PDP/shipping copy; link to returns policy; remove unconditional free-return claims and fixed dispatch promises from affected copy. | Header/Footer, public policy pages, product page, templates |
| Required merchant/business facts lacked editable storage | Add blank optional seller identity/address/support/grievance/GSTIN fields and editable dispatch, delivery, about and policy text; publish supplied facts on contact/organization data. | Settings model/service/API/form; contact/about/policy pages |
| Rejected connection promises could poison later database/auth requests | Reset failed connection attempts and use lazy Auth adapter connection. Remove Mongoose from import optimization, which caused buffered operations in real browser requests. | `src/lib/db.ts`, `auth.ts`, `next.config.ts` |
| Media/banner URL validation permitted unsafe schemes or untrusted hosts | Validate HTTPS Cloudinary media URLs and internal/HTTPS banner destinations; restrict upload formats and cap application uploads at 4 MB. | Cloudinary helper and product/category/content/review schemas |

Next.js documents the distinction between [streamed 200 and nonstreamed 404 responses](https://nextjs.org/docs/app/api-reference/file-conventions/not-found). Pagination uses Google's [page-specific canonical guidance](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading). Variant URLs and attributes follow the [ProductGroup guidance](https://developers.google.com/search/docs/appearance/structured-data/product-variants).

## Medium and low priority findings

| Severity | Finding and change |
| --- | --- |
| MEDIUM | Gallery loaded full-size hidden slides. Render only the active full-size image and lazy thumbnails; tighten card `sizes` to actual grid dimensions and prioritize the first shop card. |
| MEDIUM | Header fetched settings in the browser after server rendering. Pass server settings to header/footer and memoize settings within a server render to remove duplicate work. |
| MEDIUM | Bag lacked a reliable focus trap. Use native modal `<dialog>` for focus containment, background inertness and Escape behaviour. Native radio inputs make variants keyboard-selectable. |
| MEDIUM | Multiple nested `main` landmarks reduced semantic clarity. Keep one root `main`, an operable skip target and one primary H1 on sampled pages; add visible category breadcrumbs matching schema. |
| MEDIUM | Add-to-cart feedback could imply success after a failed request. Return success/failure from the shared cart action and show errors; fire commerce events only after success. |
| MEDIUM | Resend can return an error without throwing. Check that response, retry once and record failure; notification preparation failure cannot turn a committed payment into an API failure. |
| LOW | Static titles duplicated the brand through the root template. Use absolute titles where the brand is already included; make page-specific social metadata consistent and add a native generated fallback social image. |
| LOW | Organization referenced a missing logo; schema assumed the seller was every product's manufacturer. Remove unsupported logo/brand assertions rather than invent replacements. |
| LOW | Browser output entered general lint/type checks and could race with cleanup/generation. Ignore test artifacts and exclude the isolated E2E build output from production checks. |

## Review of all requested areas

“Verified” here means source/local-check evidence, not a Google or payment-provider approval.

| # | Area | Result / remaining requirement |
| --- | --- | --- |
| 1 | Rendering/crawlability | Hybrid SSR/ISR; seeded product name, description and offers appear in HTML without client execution. |
| 2 | HTTP status | Missing product/category/invalid page tests return 404. Legacy redirects preserved; live HTTPS/host redirects checked. Recheck after deployment. |
| 3 | robots.txt | Production public paths allowed; private/API paths disallowed; no blanket query-parameter block or CSS/JS block. |
| 4 | Indexing directives | Private metadata retained; development/preview protected by root metadata and headers. |
| 5 | Sitemap | Canonical published products, populated categories and public information pages; no private/facet URLs. Database outages fail visibly. Split before 50,000 entries. |
| 6 | Canonicals | Production base normalized to www; product variants consolidate; category/page URLs canonicalize separately. |
| 7 | URL architecture | Keep readable product slugs and current category query routes; no migration required. |
| 8 | Internal linking | Native links connect homepage, categories, products, related pieces and policies. No keyword footer added. |
| 9 | Breadcrumbs | Visible product/category navigation with matching BreadcrumbList. |
| 10 | Metadata | Real product/category/admin SEO fields; corrected duplicate brand titles and inherited social text. |
| 11 | Headings | Sampled mobile pages have one H1 and one main landmark. Full manual assistive-technology QA remains. |
| 12 | Product schema | Real prices/stock/SKUs and published-review aggregates; no fabricated manufacturer/GTIN/shipping terms. |
| 13 | Other schema | Organization/WebSite/Breadcrumb/Collection/visible FAQ retained safely. No fictitious LocalBusiness. FAQ markup does not guarantee a rich result. |
| 14 | Variants | Specific option URLs/selectors and ProductGroup; base canonical; style-only/SKU-only groups need supported attributes for Google variant eligibility. |
| 15 | Facets | Search/filter/nondefault sort noindex/follow, useful populated categories retained. |
| 16 | Pagination | Crawlable page links and page-specific canonicals; invalid ranges 404. |
| 17 | Images | Existing Cloudinary auto format/quality reused; responsive requests/gallery loading improved. Production asset quality and broken legacy images still need a catalogue crawl. |
| 18 | CWV | Removed known image/data-loading overhead. No new performance score or field-CWV claim; measure real production mobile pages. |
| 19 | Mobile | 390px browser checks across ten public flows found no horizontal overflow; bag keyboard check passes. |
| 20 | Accessibility | Native modal/radios, skip target and landmarks improved. Contrast, screen reader and all signed-in admin flows need manual sampling. |
| 21 | Product content | Existing description, short description, material, color, size, dimensions, weight and media/SKU fields reused. Care/what's included can be stated in factual descriptions; no invented bulk text. |
| 22 | Categories | H1, intro, metadata, images, products and canonical supported; empty published category is noindex. |
| 23 | Internal search | Arbitrary search results are noindex; search API remains private to robots. |
| 24 | Social sharing | Product photos/category photos and native site fallback; validate real public image URLs with social debuggers after deploy. |
| 25 | Environment safety | Production localhost/apex/preview values normalize; preview disallowed. Configure hosting env intentionally. |
| 26 | Duplicates | Existing host/slash redirects, base canonicals, previous-slug redirects and tracking normalization; no new duplicate landing pages. |
| 27 | Deleted products | Missing/unpublished products return 404; temporarily unavailable published products remain useful OutOfStock pages. No homepage blanket redirect. |
| 28 | Security | Credential exposure highlighted; auth roles, upload/media boundaries and stored-text escaping hardened. Dependency audit found zero known production vulnerabilities. |
| 29 | Checkout | Server totals, atomic reservations/coupons/cart/order and captured-payment checks; parallel and rollback checks included. |
| 30 | Merchant Center | Partial technical readiness; no feed exists. Verified identifiers/policies/shipping/business details and Google account approval still required. |
| 31 | Business trust | Existing information/policy/help routes retained; blank editable verified-fact fields added. Owner details pending. |
| 32 | India compliance | Disclosure/configuration gaps identified. Legal Metrology, GST, consumer/privacy and applicable terms require professional review. |
| 33 | Dark patterns | Unsupported rating/verified-review implications and conflicting free-return claims corrected. Compare-at prices, material/origin and marketing claims still require owner evidence. |
| 34 | Privacy | Account/address/order/contact/newsletter data stored server-side; guest bag/recently viewed data stored locally. GA consent/retention and policy approval remain manual. |
| 35 | Third parties | GA4 optional/lazy, checkout script on demand, no Meta/chat/heatmap installation found. |
| 36 | Fonts | Existing next/font Latin subsets, swap and selective preload retained; no font family change. Builds require Google Fonts access. |
| 37 | Fetching | Public content remains server-fetched; settings deduplicated; connection failures recover; no loading-only SEO fallback. |
| 38 | IDs | Public slug links retained; Mongo IDs are not redesigned; legacy ID URLs resolve only to published products. |
| 39 | Broken links | Removed missing logo reference; kept existing legacy routing. Historical deleted blog/products are not reconstructed from guesses. |
| 40 | Errors | Existing error/not-found/empty states retained, 404 status fixed; sitemap no longer masks database failure. |
| 41 | Search Console | Sitemap/robots/canonicals prepared; no invented verification token. Domain-property verification may be completed through DNS. |
| 42 | Analytics | Existing optional GA4 and ecommerce events retained; no second pageview loader added. Confirm SPA views/purchase deduplication in DebugView. |
| 43 | SEO spam | No hidden keyword block or generated city-doorway system introduced. Actual catalogue claims/descriptions need human review. |
| 44 | Human-centric content | Existing Hinglish category aliases remain discovery helpers, not a volume/ranking promise or mass-page generator. |
| 45 | Validation | Typecheck, lint, service/unit suite, browser suite and isolated production build run; details below. |
| 46 | Output | Findings, file inventory, manual work, limitations, architecture and priorities documented here. |

## Editing the store

### Category images and SEO

Open **Admin → Categories**, edit the category, upload an image under 4 MB, provide a descriptive alt, and save. Set published status and sort order: the first six published categories form the homepage category row. The current category manager already supports image removal/replacement, intro description, SEO title/description and comma-separated search aliases. These also power category shop metadata and images.

Use aliases only where they match your stock: examples include *jhumka/jhumke/bali*, *anguthi/angoothi*, *haar/mala*, *kangan/kada/chudi*, *payal*. These are candidate terms, not independently verified search-volume data. Validate actual customer language with Search Console and Keyword Planner; do not describe a ring as a jhumka just to attract traffic.

### Verified business and policy details

Open **Admin → Settings**. Enter the verified seller/legal name, address, support email/phone, grievance contact, GSTIN if applicable, dispatch/delivery information, returns/refunds, cancellation, privacy, terms and about text. Fields are blank until supplied and rendered as escaped plain text. Shipping fee, free-shipping threshold, reservation duration and homepage/shop SEO copy remain editable there.

The owner said they will provide verified details but has not supplied the values yet. Existing fallback legal/policy and marketing text is **not certified** by this audit. In particular, review the 7-day return provisions, account/data-deletion promises, tax-inclusive prices, Vapi/manufacturing statements, business history, anti-tarnish/water claims, comparisons/discounts, support response times and jurisdiction language. About overrides do not automatically replace every decorative heading or global marketing line. Review those against the verified facts as well.

## Manual actions required

### Before operating payments

1. Rotate the exposed database credential, revoke the old one and update Vercel/local secrets. Review database access/audit logs and network allowlists. Decide whether Git history needs cleaning with collaborators; rotation is essential even if history is cleaned.
2. Use an Atlas/replica-set database; standalone MongoDB does not support these transaction paths. Backup and rehearse deployment with representative catalogue/order data.
3. Verify Razorpay live/test key alignment, automatic capture configuration and signed webhook secret. Subscribe to payment capture/failure and refund completion events on `/api/webhooks/razorpay`. Make a controlled purchase, failed/retried attempt and refund; confirm amounts, state, stock, coupon and email records.
4. Review orders paid after their reservation expired/cancelled, any historical inconsistent stock and unclear/pending/partial refunds in the gateway. The code blocks unsafe settlement; it does not guess financial outcomes. A refunded shipped order needs physical-return stock reconciliation if the goods arrive later.
5. Configure Resend's verified sender domain and `EMAIL_FROM`; test actual delivery. The default onboarding sender is unsuitable for general customer mail.

### Search Console / hosting / operations

1. Deploy the revision, set the public URL to `https://www.satvastones.in`, verify that production indexing is enabled and preview indexing is disabled. Check DNS/TLS and every host/protocol/slash redirect for one final public response without a loop.
2. Inspect representative homepage/category/product/paginated/variant and missing URLs in Search Console. Confirm rendered HTML, chosen canonical and sitemap inclusion. Submit the canonical www sitemap if the existing property permits it; an apex-only URL-prefix property does not cover www.
3. Use URL-level examples for indexing reasons. Redirects, canonical duplicates, private noindex pages and genuinely removed pages do not all need to become indexed. Do not request indexing of all 177 excluded URLs indiscriminately. Google's [Page indexing guidance](https://support.google.com/webmasters/answer/7440203?hl=en) explains the reason categories.
4. Run a production link/image crawl and Google Rich Results checks. Confirm old important slugs/IDs redirect to real replacements, and retain 404 for genuinely removed content without a relevant replacement.
5. Measure mobile LCP/INP/CLS on home, representative products and categories using PageSpeed and Search Console field data. Targets remain approximately LCP ≤2.5s, INP <200ms, CLS <0.1. The local tests are not field measurements.
6. Configure reservation cleanup frequency for actual traffic. The checked-in Vercel cron runs daily and processes a bounded batch; checkout also sweeps expired reservations. This can leave stale holds during quiet periods/backlogs. More frequent cron/background jobs depend on the hosting plan; confirm availability rather than deploy an unsupported Hobby schedule.
7. Restrict/disable any public unsigned Cloudinary preset. Signed application uploads are preferred; an open preset can bypass application authentication/size rules. Configure WAF/shared rate limiting for multiple server instances; the current Map-based limiter protects only one process.

### Merchant Center and catalogue facts

- Supply genuine brand/manufacturer, GTIN/MPN where applicable, country of origin, seller and packaged-commodity declarations, accurate materials/measurements and images. Do not invent identifiers or misuse `identifier_exists` merely because data is missing.
- Supply verified shipping destinations, cost/timelines, return window/fees/exceptions and refund/cancellation terms. Configure Merchant Center business identity, domain claim, shipping and returns to match the website. Misrepresentation review includes business and policy information, not just schema: [Google's policy](https://support.google.com/merchants/answer/6150127?hl=en-uk).
- No product feed was built without the necessary business/catalogue inputs. The cleanest next implementation is a server-generated Merchant feed from the existing published catalogue services, with one row per purchasable SKU, `item_group_id` for variants and URLs selecting that SKU. Feed price must be the SKU's actual price, not the generic “From” listing value. Availability must use the same stock/hold rules as the page and checkout. Add approved shipping/returns settings, then test/feed-sync in Merchant Center.
- ProductGroup entries with only SKU/style labels need real supported distinguishing attributes. Use actual size/color/material/pattern as applicable; do not invent them to satisfy a validator.

### India disclosures / privacy / content

- Have a qualified reviewer approve seller identity/address, grievance mechanism, cancellation/returns/refunds, packaged-commodity declarations, MRP/tax/GST presentation and privacy/data-rights/retention language against the applicable rules. See the official [Consumer Affairs rules and acts resources](https://consumeraffairs.gov.in/pages/consumer-protection-acts). This source review is not a legal certification.
- Review whether optional analytics needs consent for the customers served; implement the approved policy before enabling tracking. Configure GA4 retention/enhanced measurement and use DebugView to confirm pageviews and purchases fire correctly without personal data.
- Replace thin/copied catalogue descriptions with factual item-specific material, size/fit, dimensions, care, contents and limitations. Add authentic customer reviews through the existing review system. Never manufacture reviews, discounts, urgency, origin or jewellery purity.
- Validate candidate English/Hinglish queries against the actual Search Console export/Keyword Planner. Better words can improve relevance; competition, demand, originality, links, trust and Google's selection still govern ranking.

## Validation and limits

| Check | Result |
| --- | --- |
| `npm run lint` | 0 errors; one pre-existing React Hook Form `watch()`/React Compiler compatibility warning in `ProductForm.tsx`. |
| `npm run typecheck` | Passed. |
| `npm test` | 28 files, 165 tests passed. Includes transactions, rollback, concurrent checkout, capture validation, webhook payloads, expiry, refunds, SKU copies, aliases, ratings and unsafe media/text. |
| Final catalogue regression rerun | 15 tests passed, including preservation of admin base price. |
| `npx playwright test --workers=1 --reporter=line` | All 39 browser checks passed: guest cart, guards, policies, public APIs, server HTML/schema, variant selection, actual 404s, ten mobile pages and native dialog focus/Escape. |
| Production build | Passed with an isolated temporary replica-set database; no production database writes used for testing. |
| Isolated production HTTP smoke | Passed for browser and Googlebot missing-page 404s, inherited/overridden variant prices, www canonical, legacy 308 redirect and product sitemap inclusion. |
| `npm audit --omit=dev --json` | Zero reported production dependency vulnerabilities at audit time. This is not a proof of application security. |
| Public host smoke checks | Existing live HTTPS/hostname redirects and homepage/robots/sitemap responses verified. |

The AGENTS.md self-healing instruction was attempted, but `vibe-check` is not installed/available on PATH; existing project checks were used. Restricted-network Google Fonts failures and concurrent generated-file checks were resolved during validation; fonts still require network access at build time. The final checks were run with isolated browser output and sequential build/browser execution.

Browser fixtures intentionally reference dummy Cloudinary assets, so they generate image 404s. This suite checks interaction/layout/status/schema, not the quality or accessibility of real production photographs. Google OAuth login, real signed-in checkout/admin flows, payment/refund provider responses, DNS ownership, legal facts, every legacy database row, Merchant account approval and field CWV require the manual checks above.

## Remaining work by priority

| Priority | Remaining work |
| --- | --- |
| **Blocking launch / safe operation** | Rotate exposed credentials; verify transactional database and real Razorpay capture/webhooks/refunds; reconcile historical/unclear payment outcomes. |
| **Fix before indexing** | Deploy and inspect real statuses/canonicals/robots; verify business disclosures and unsupported claims; crawl actual catalogue links/images; replace materially thin/inaccurate content. |
| **Fix before Merchant Center** | Verified seller/product identifiers/origin/declarations and shipping/return policies; accurate SKU feed; account/domain/business verification and variant attributes. |
| **Important improvement** | Suitable reservation cleanup cadence, distributed/WAF rate limiting, approved analytics consent/retention, operational email sender, field CWV/mobile and authenticated acceptance checks. |
| **Optional optimization** | Self-host existing fonts if build-network reliability remains an issue; split sitemap before catalogue size requires it; add useful original guides only when supported by expertise/demand. |

## Resulting architecture assessment

The source is crawlable and server-rendered/prerendered where needed, with a coherent canonical strategy, controlled facets, real missing-page status and schema aligned to catalogue/review data. It is performance-conscious and passed the sampled mobile checks. Production indexing depends on deployment/environment settings and Google's assessment.

Merchant readiness and business/legal trust remain **conditional**, pending verified facts, product identifiers, approved policies, feed/account configuration and live acceptance checks. No SEO score, ranking probability, Google approval or “SEO complete” claim is made.

## Files changed

The inventory below is generated from the working diff for this audit. Paths are relative to `D:\newsatva`; `src/app/loading.tsx` was removed. Next dev automatically added its local-guide instructions to AGENTS.md and generated TypeScript configuration entries. No package manifest/lockfile dependency change was made.

- `.env.example`
- `.gitignore`
- `AGENTS.md`
- `docs/TECHNICAL_SEO_AUDIT_2026-09-28.md`
- `e2e/cart.spec.ts`
- `e2e/checkout.spec.ts`
- `e2e/content.spec.ts`
- `e2e/seo-mobile.spec.ts`
- `e2e/shop.spec.ts`
- `eslint.config.mjs`
- `next.config.ts`
- `scripts/e2e-dev.mjs`
- `scripts/migrate-legacy-data.ts`
- `src/app/about/page.tsx`
- `src/app/account/orders/[id]/page.tsx`
- `src/app/account/orders/page.tsx`
- `src/app/account/page.tsx`
- `src/app/admin/layout.tsx`
- `src/app/admin/orders/[id]/page.tsx`
- `src/app/admin/page.tsx`
- `src/app/admin/products/new/page.tsx`
- `src/app/api/admin/settings/route.ts`
- `src/app/api/webhooks/razorpay/route.ts`
- `src/app/cart/page.tsx`
- `src/app/checkout/page.tsx`
- `src/app/contact/page.tsx`
- `src/app/faq/page.tsx`
- `src/app/layout.tsx`
- `src/app/loading.tsx`
- `src/app/login/page.tsx`
- `src/app/opengraph-image.tsx`
- `src/app/page.tsx`
- `src/app/privacy/page.tsx`
- `src/app/products/[slug]/page.tsx`
- `src/app/returns/page.tsx`
- `src/app/robots.ts`
- `src/app/shipping/page.tsx`
- `src/app/shop/page.tsx`
- `src/app/sitemap.ts`
- `src/app/terms/page.tsx`
- `src/app/wishlist/page.tsx`
- `src/components/SiteFooter.tsx`
- `src/components/SiteHeader.tsx`
- `src/features/admin/AdminOrderActions.tsx`
- `src/features/admin/SettingsForm.tsx`
- `src/features/cart/CartDrawer.tsx`
- `src/features/cart/CartProvider.tsx`
- `src/features/checkout/CheckoutWizard.tsx`
- `src/features/notifications/templates.ts`
- `src/features/products/ProductCard.tsx`
- `src/features/products/ProductGallery.tsx`
- `src/features/products/PurchasePanel.tsx`
- `src/features/reviews/ReviewsSection.tsx`
- `src/lib/auth.ts`
- `src/lib/cloudinary.ts`
- `src/lib/db.ts`
- `src/lib/email.ts`
- `src/lib/env.ts`
- `src/lib/rate-limit.ts`
- `src/lib/razorpay.ts`
- `src/models/Category.ts`
- `src/models/Product.ts`
- `src/models/Settings.ts`
- `src/schemas/category.ts`
- `src/schemas/content.ts`
- `src/schemas/product.ts`
- `src/schemas/review.ts`
- `src/services/admin-order-service.ts`
- `src/services/cart-service.ts`
- `src/services/category-service.ts`
- `src/services/coupon-service.ts`
- `src/services/inventory-service.ts`
- `src/services/order-service.ts`
- `src/services/product-service.ts`
- `src/services/settings-service.ts`
- `src/utils/jsonld.ts`
- `tests/admin-order-service.test.ts`
- `tests/cart-service.test.ts`
- `tests/catalog-service.test.ts`
- `tests/cloudinary.test.ts`
- `tests/db.test.ts`
- `tests/email-service.test.ts`
- `tests/env.test.ts`
- `tests/order-service.test.ts`
- `tests/razorpay-webhook.test.ts`
- `tests/seo.test.ts`
- `tests/utils.test.ts`
- `tsconfig.json`
