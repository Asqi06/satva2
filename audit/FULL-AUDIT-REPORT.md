# SatvaStones SEO audit and implementation

**1 October 2026 · https://www.satvastones.in · D:\newsatva**

SatvaStones has a workable technical foundation for organic sales. This audit found specific metadata, variant, business identity, discovery and mobile gaps and implemented fixes in the project. Those fixes are local and need deployment before they affect the live website. Ranking and AI citations also depend on product quality, originality, competition, reputation and search engines' decisions.

The owner confirmed an **online-only jewellery business based in Vapi, Gujarat**, targeting **customers across India**, with official Instagram **https://www.instagram.com/satvastonesjewelry/**. There is no shop for customer visits. The appropriate model is OnlineStore, with accurate Vapi origin information and nationwide commercial search targeting.

## Coverage and evidence

| Workstream | Coverage | Limit |
|---|---|---|
| Production crawl | 111 discovered URL requests, all 83 sitemap entries, 66 product pages, redirects and pagination; robots respected, five workers, one-second worker delay, 500-URL cap | Crawl snapshot rather than Google's index |
| Codebase | Next.js 16.3.5 routes, metadata, robots/sitemap, product/category services and models, policies, public navigation, images, analytics and business settings | No production database migration or product edits |
| Schema | Product/ProductGroup/Offer, BreadcrumbList, collection ItemList, business and WebSite identities | Controlled checks; no claim of live Google rich-result approval |
| Mobile and images | Live desktop homepage, mobile homepage/product screenshots; four actual responsive image downloads | Sampled pages and image deliveries |
| Performance | PageSpeed mobile and desktop requests; code/crawl response analysis | Both API requests returned HTTP 429 quota errors; CWV unknown |
| Local/GEO/content/SXO | Verified online-only identity, origin, social profile, answer content, buying intent and crawler access | Google/ChatGPT/Perplexity citations unmeasured |
| Demand and competition | Current public search samples for Korean, anti-tarnish and oxidised jewellery in India | Not a geo-specific rank tracker; no keyword volume/difficulty dataset |
| Search Console/GA4/backlinks | Existing metadata/analytics plumbing and public footprint reviewed | No connected GSC/GA4/paid backlink data; indexing, clicks, conversions and link counts unknown |

Direct HTTP/browser evidence confirms the **www** canonical host. Some web-tool cached results had outdated host behavior and were not treated as current production evidence. Of 111 requests, 110 ended at 200; the one 404 was a Cloudflare email-obfuscation fallback, not a missing product. Missing-product probes correctly returned 404.

The specialist technical report includes a **74/100 editorial live-baseline assessment** with its explicit rubric. It excludes unavailable CWV data and is not a Google score. No full weighted health score or post-deployment improvement score is assigned: important account/field measurements are unavailable and the live site has not received this revision. See [technical evidence](TECHNICAL-FINDINGS.md).

## Most important findings and resulting changes

| Priority | Verified finding | Implemented locally | Still required |
|---|---|---|---|
| High | Two live ProductGroups emitted `?variant=undefined` and lacked child SKUs | Only real, nonblank variant SKUs enter variant schema/feed; distinct URL/ID and actual selected price/stock; no fake fallback identifiers | Correct actual legacy variant records in admin and check purchase selection |
| High | Three live product pages lacked meta descriptions | Trimmed authored descriptions with factual product/category/specification fallback; fallback also visible when Description is blank | Write distinctive product-specific copy |
| High | Product metadata could override preview noindex | Product robots and Googlebot honor production/preview indexing configuration | Verify preview and production deployed headers |
| High | Mobile header targets measured 44 × 24 px | Removed CSS layer conflict; browser tests confirm menu/search 44 × 44 px or larger | Repeat checks on deployed devices |
| Medium | Homepage H1 depended on campaign banner (`Rings`) | Stable `Everyday jewellery for India` H1; campaign label remains visible; explicit India/Vapi introduction | Maintain honest campaign/product copy |
| Medium | Business schema lacked stable entity ID and official profiles | OnlineStore identity, shared address formatting, verified Vapi/Gujarat defaults and Instagram; WebSite/products reference same business | Complete actual seller/contact/street/PIN information in settings |
| Medium | Category links took unnecessary alias redirects | Header/home/footer/guide and suggestions link directly to existing canonical query category URLs; renamed-category redirects keep filters/search/sort | Preserve existing aliases; no mass slug migration |
| Medium | Sitemap lacked catalogue image entries | Product images deduplicated; category images included; buying guide discoverable | Verify actual image crawlability and Search Console diagnostics |
| Medium | Collections had limited semantic product-list context | CollectionPage/ItemList mirror rendered products; consistent main-shop/category breadcrumbs | Add original category descriptions |
| Medium | No machine-readable shopping feed | `/product-feed.xml`: published catalogue, one row per real SKU, selected variant links, exact price/stock, XML escaping, 503 on database failure | Merchant Center setup, business/policy validation and missing identifiers |
| Medium | Buying guidance and origin context were sparse | Server-rendered buying guide, useful questions, real current shipping fees, catalogue links/products and Article/breadcrumb markup | Enrich with authentic photos, measurements and experience |
| Low | Robots only matched slash-terminated private paths | Exact private roots plus descendants, orders and demo exclusions | Keep private page noindex/auth; robots is not a deletion mechanism |
| Info | Default terms claimed all products had an anti-tarnish finish; Twitter handle unverified | Terms point to actual item materials/finishes; unverified Twitter attribution removed | Review approved seller policies and all product-level claims |

No site-wide production indexing block was found. No invented address, coordinates, shop, manufacturer brand, GTIN, review, discount, certification, delivery promise or return entitlement was added.

## Product and content work that code cannot truthfully supply

The three formerly missing-description URLs are:

- `/products/gold-paperclip-chain-heart-charm-bracelet-for-womens`
- `/products/minimalist-everyday-jewelry-choker`
- `/products/dainty-pave-crystal-bowknot-stud-earrings`

The malformed-variant URLs are:

- `/products/best-minimalist-everyday-couple-rings`
- `/products/pastel-stone-double-drop-earrings-18k-gold-plated-minimalist-korean-aesthetic-jewelry`

Review these in the product editor first. Assign real, unique SKU values to actual purchasable options, their measurements, prices and stock. Until repaired, malformed variants are withheld from rich offer data/feed rather than generating invalid identifiers. This does not repair legacy checkout data automatically.

Two separate bracelet URLs share the same live title: `anti-tarnish-gold-plated-minimal-bracelet-women` and `anti-tarnish-gold-plated-minimal-bracelet-for-women`. Compare the actual items. Give distinct products factual distinguishing titles; consolidate only if they are genuinely the same product, preserving a permanent redirect and order history. Do not merge from text alone.

For priority products, supply verified base metal, finish/coating, size system and measurements, weight if relevant, what the package contains, product-specific care, actual photographs and delivery/return information. Claims such as anti-tarnish, waterproof, hypoallergenic or 18K plating require product evidence. The new guide explicitly helps customers resolve missing details instead of asserting them.

The existing review system and published-review-only rating logic are retained. Gather honest purchaser reviews, answer buyer questions, and add an authentic founder/business story through existing settings. Code structure and Article author markup do not create first-hand expertise by themselves.

## Location strategy: Vapi identity, India sales

The location signal belongs in the About page, Contact page, footer and business entity. The revision supplies verified city/state and the correct online-only description, and permits structured registered address/contact input in admin. The same source formats schema and visible business information.

Google's eligibility guidance excludes online-only brands from Business Profile. Do not create a storefront/Maps pin or dozens of near-identical city pages. Shipping nationwide is a commercial fulfilment model, not proof of physical premises in every city. [Google Business Profile eligibility](https://support.google.com/business/answer/13763036?hl=en).

Use nationwide product/style/category intent for sales. Destination content is justified only where there is actual distinct information—for example different verified fulfilment terms or original local customer stories. Shipping estimates should use the destination PIN code and actual courier information rather than invented city delivery timelines.

## GEO and AI search

The revision improves machine-readable entity consistency, public HTML, catalogue detail, clear buying answers and internal discovery. Production robots' wildcard rule already permits public search crawlers; no special bot allowlist is needed to override working access. CDN/WAF behavior for verified search bots still needs operational inspection. Search access and model-training access are separate choices. [OpenAI crawler definitions](https://developers.openai.com/api/docs/bots).

Google's current guidance emphasizes useful original content, indexable pages and normal SEO. It explicitly says llms.txt does not improve Google Search rankings and no special AI schema or fixed page length is needed. Consequently this revision does not add a speculative AI ranking file. The retained FAQ is useful visitor content, not a promised rich-result enhancement. [Google AI search guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide).

The buying guide uses an organization author and real shopping mechanics. Add original sizing photos, product-specific demonstrations and sourced answers over time. Keep brand name, Instagram, seller details and policies consistent on channels you control. Measure actual search/referral visits and conversions; no AI platform visibility or citations have been claimed.

## Merchant feed and Shopping readiness

The feed reads only published products; emits real SKU rows; selects variants via `?variant=<SKU>`; uses parent and variant stock after reservations; and reflects selected prices in INR. Missing images, descriptions, positive prices or usable SKUs cause a row to be skipped. Style-only options are not assigned a pretend size/colour group. Missing product identifiers, brand or condition are not guessed, and `identifier_exists=false` is not used to conceal missing data.

This is an accurate feed foundation, **not an assertion of Merchant approval**. Its row omissions and missing optional/conditionally required product data must be resolved before submission. Validate the live feed against the storefront, supply genuine brand/GTIN/MPN when applicable, configure India shipping/returns in the account, verify/claim the domain, and review Merchant diagnostics. Google requires consistency between product data and landing pages. [Merchant product specification](https://support.google.com/merchants/answer/7052112?hl=en), [variant grouping rules](https://support.google.com/merchants/answer/6324507?hl=en).

The feed sends `noindex` and `no-store`, serves 404 on disabled indexing/preview environments, and returns 503 when the catalogue cannot be read. Do not add it to the SEO sitemap or treat it as a category landing page.

## Performance, mobile and images

Four delivered responsive images measured roughly 10–87 KB, all WebP/200 with immutable delivery caching. Cloudinary responsive transforms, reserved aspect ratios, priority hero delivery, lazy lower-page media, font swap and lazy analytics already help. The audit counted 664 image-tag observations, all with an alt attribute; that is not 664 distinct photographs or proof every description is useful.

One shop download took 23.1 seconds and one product 8.5 seconds during the crawl. These are network/cold-start observations, not LCP/INP/CLS. Product/shop pages contain dynamic behavior; review authentication can personalize output. Do not force shared caching on whole product responses. Profile public catalogue/settings queries, database/hosting region and cold starts, then introduce selective public-data caching/invalidation only where measured. Keep prices, reservations and personal controls correct.

Both PageSpeed calls returned 429. Field targets should be evaluated using the real-user 75th percentile: LCP around 2.5 seconds, INP around 200 ms, CLS around 0.1. No performance score or passed CWV assessment can be reported from this audit. [Core Web Vitals](https://web.dev/articles/vitals).

The sample product's mobile purchase panel sat below the fold after a large gallery. This is an optional conversion experiment, not grounds for an untested layout rewrite. The new browser regression checks cover the existing product flow and 10 mobile pages, plus the guide.

## Search experience and competition

Search samples surfaced established marketplace/category pages such as [Myntra Korean jewellery](https://www.myntra.com/korean-jewellery), [Nykaa oxidised jewellery](https://www.nykaa.com/oxidised-jewellery/c/10760) and [The Jewelbox anti-tarnish collection](https://www.thejewelbox.in/collections/anti-tarnish-jewelry). This supports a commercial collection-page intent assessment; it is not a measured Google India ranking, market-share or keyword difficulty result.

Compete first on specific item/style/material terms supported by your actual products, useful original photos, clearly priced delivery, credible reviews and distinct collection descriptions. Avoid making every page target the broadest jewellery term. No fabricated search volumes, difficulty scores, backlink counts or rank positions were used. See [the action plan](ACTION-PLAN.md) for candidate query groups and a 90-day execution sequence.

## Verification and release status

Validation results are recorded in `VALIDATION.md`. Checks use disposable databases and dedicated output directories; no production catalogue/order writes occurred. Lint retains a pre-existing React Hook Form compiler warning. The prescribed `vibe-check` was attempted but is not on PATH. A sandbox Google Fonts failure was resolved by rerunning isolated validation with network access.

No commit, push, deployment, Search Console submission, Merchant account change or message to customers was made. After deployment, inspect representative URLs in Search Console, check live robots/sitemap/variant offers and rerun mobile/schema checks. Account access, genuine product data, original content and field measurement are the remaining practical dependencies.

Detailed evidence: [catalogue](CATALOGUE-FINDINGS.md), [local/GEO](LOCAL-GEO-FINDINGS.md), [technical](TECHNICAL-FINDINGS.md), [performance](PERFORMANCE-AUDIT-REPORT.md), [visual](VISUAL-AUDIT-REPORT.md), `live-crawl.json`, `IMAGE-SUMMARY.json`, `PERFORMANCE-SUMMARY.json`, `screenshots/`.
