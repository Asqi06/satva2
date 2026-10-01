# SatvaStones local SEO, AI discovery and content audit

Audit date: 1 October 2026. Scope: repository evidence plus accessible public search records. This is a code and public-footprint audit, not a measurement of Google rankings or AI citations.

## Verified business identity

The owner confirmed **Vapi, Gujarat**, **online-only sales across India**, **no physical shop**, and the official profile **https://www.instagram.com/satvastonesjewelry/** during this audit. The business is an online fashion jewellery retailer, not a service-area business. Shipping to a city does not establish an in-person local business there.

Google requires in-person customer contact for Business Profile eligibility. Its current guidance lists online-only brands as ineligible. Therefore GBP/Maps store creation and a physical JewelryStore entity are not appropriate for the verified operating model. [Google business eligibility](https://support.google.com/business/answer/13763036?hl=en).

The suitable strategy is India-focused product and collection SEO, a truthful Vapi origin signal, consistent business identity and usable shipping information. Do not produce interchangeable city pages or publish guessed streets, PIN codes, coordinates, opening hours, certifications or customer reviews.

## Evidence and score limits

The local/GEO specialist initially could not retrieve the live site through the web tool. The separate technical workstream subsequently verified current HTTP/browser responses and completed a 111-URL crawl; see TECHNICAL-FINDINGS.md and the full report. Older cached `/product/:id` search results do not establish the current live response. The canonical www host is verified.

**Local SEO score: not applicable to map-pack eligibility for this online-only business.** A weighted GBP score would penalize the business for features it must not claim. The following dimension review records actual evidence rather than treating unknowns as failures:

| Dimension / framework weight | Finding | Assessment |
|---|---|---|
| GBP signals, 25% | No verified shop; owner confirmed online-only | Not applicable |
| Reviews and reputation, 20% | Product review pipeline and ratings present in code; live count/rating unknown | Partial implementation, performance unverified |
| Local on-page SEO, 20% | India buying intent on shop/category metadata; Vapi origin now owner verified | Suitable country intent; add truthful city origin |
| NAP and citations, 15% | Same settings feed footer/contact; no live phone/street verified | Consistency pipeline available, data completeness unknown |
| Business schema, 10% | Homepage Organization; safe OnlineStore helper now added | Correct online model; local schema deliberately conditional |
| Local authority, 10% | Public marketplace listings and founder discussion surfaced | Brand footprint exists; independent local authority unverified |

## NAP source comparison

| Source | Name | Address | Phone | Notes |
|---|---|---|---|---|
| Repository homepage | SatvaStones, optional legalName | Optional businessAddress setting | Optional supportPhone in ContactPoint | Before fixes, sameAs empty |
| Contact/footer | SatvaStones and optional legalName | Same optional businessAddress | Same supportPhone | Shared source avoids literal NAP disagreement |
| Owner clarification | SatvaStones | Vapi, Gujarat, India; no public shop | Not supplied | City/state are verified; street/PIN unknown |
| Google Business Profile | Unverified | Unverified | Unverified | Online-only business ineligible under verified facts |
| Revised identity helper | SatvaStones | Partial PostalAddress with Vapi/Gujarat/IN, or configured legacy/full address | Configured supportPhone only | Same address helper intended for visible text and schema |

No factual address/phone discrepancy was established. Unknown database configuration is not equivalent to missing production data. Preserve the registered seller address separately if it needs to be displayed for customer/legal information; avoid portraying it as a walk-in showroom.

## GBP and reviews checklist

- GBP primary category, secondary categories, photos, posts, review rating/count, review velocity and owner response rate: unverified and GBP ineligible for the confirmed online-only model.
- Map iframe, place identifier, opening hours: absent from inspected code; these are not necessary online-store fixes.
- Product reviews: model/service/UI and conditional AggregateRating exist; actual review counts and recent dates require live data.
- Verified-purchase labels should remain backed by the service's purchase check. Request honest reviews from buyers without screening sentiment or inventing ratings.
- No supported universal review-frequency threshold was established. Avoid claiming an 18-day ranking cliff as a site requirement.

## Citations and brand presence

Exact-name Yelp and BBB searches did not establish matching listings. This is a limited search, not proof of absence. Those US-centric directories are low priority for an online India retailer. Prioritize owner-confirmed Instagram, consistent marketplace seller/store identity and genuine media/customer references.

Search found Satvastones product listings on Flipkart and a public founder profile discussing the brand. That profile referenced an older Instagram handle; the current owner-confirmed `satvastonesjewelry` handle takes precedence. No Wikipedia, Reddit or YouTube presence was verified. Do not manufacture mentions or create Wikipedia pages merely for SEO.

Examples of public evidence: [Flipkart jewellery set](https://www.flipkart.com/satvastones-plastic-stainless-steel-gold-plated-gold-white-jewellery-set/p/itmea00cef0eae16), [public founder profile](https://in.linkedin.com/in/anniverma). Marketplace seller identity should be confirmed before linking these pages as official sameAs values.

## Business schema changes implemented in this workstream

`src/lib/business-seo.ts` now builds an OnlineStore entity with stable `/#organization` identity. It uses only configured contact data, shared address formatting and validated HTTPS official profiles. It publishes partial PostalAddress locality/region/country for the owner-verified Vapi origin without guessed street/PIN.

JewelryStore is added only after an explicit physicalStore opt-in AND a complete structured street/city/state/PIN AND a nonempty support phone. The owner-confirmed current configuration defaults physicalStore to false. A Maps link is emitted only for such a fully configured physical business, and Google Maps host validation rejects lookalikes. No fabricated logo, geo, hours or business rating is added.

The admin pipeline now accepts structured address fields, a physical-store opt-in, Google Maps URL and official profile URLs. Old admin clients that omit these new fields preserve previously stored configuration; explicit blanks/empty profiles still clear it. Runtime/schema safeguards have dedicated tests.

## Location pages

No multi-location architecture exists in the inspected routes. Unique-content percentages, location crawl depth and a store-locator review therefore do not apply. A generic India delivery page and truthful Vapi origin description fit the business better than a national set of city storefront pages. Consider a destination page only when there is original, verified customer value such as genuinely different delivery/pickup terms; ordinary courier coverage does not justify one page per city.

## AI discovery readiness

**Provisional GEO code-readiness baseline: 62/100.** This editorial score reflects the inspected code before the new content/identity integrations, not a ranking prediction or measured platform visibility. Citability 14/25, readable structure 16/20, multimedia 9/15, authority/brand evidence 8/20, technical access 15/20. Live crawler/CDN verification and original expert content could materially change it. Google AI Overviews, ChatGPT and Perplexity visibility are individually **unmeasured**; no fabricated platform scores are assigned.

Public product, collection, FAQ, shipping and about pages are server components, so the key text can be delivered in HTML. robots.ts permits public crawling when production indexing is enabled and blocks operational/private paths. Deployment HTML, CDN bot handling and actual robot responses remain unverified.

Content is readable and cautious: materials vary by product, shipping fees come from shared settings, and product details show material/dimensions/SKU where supplied. Weaknesses are generic About fallback, brief shopping answers, absence of original guides, limited sourcing/author identity, and no verified founder story in code.

Google's official guide says normal SEO, useful original content and technical access underpin AI discovery. It explicitly says llms.txt does not affect Google Search visibility and there is no required chunk length or special AI schema. Adding llms.txt may be a low-cost informational aid for other clients, but must not be reported as an AI ranking mechanism. [Google AI optimization guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide).

FAQ HTML remains useful to visitors. Google removed the FAQ rich-results documentation in June 2026 after ending the feature; do not promise FAQ SERP enhancements. [Google documentation updates](https://developers.google.com/search/updates).

Search-crawler access and model-training access are separate decisions. Do not open training crawlers just to claim search discoverability. Keep public HTML accessible, preserve canonical product URLs and measure referral traffic instead of claiming current AI rankings from code inspection.

## Content and search-experience opportunities

1. Add a short truthful origin sentence: “SatvaStones is an online jewellery store based in Vapi, Gujarat, serving customers across India.” Link immediately to the collection, current delivery information and customer support.
2. Create an original jewellery-buying guide covering how to read material, plating, dimensions and size fields, compare options, check care instructions and find the real delivery/returns rules. Link to actual products and collections.
3. Add care guidance focused on checking product-specific materials rather than blanket waterproof, tarnish-free, hypoallergenic or durability guarantees.
4. Expand owner-approved About text with founder, sourcing process and quality-check evidence only when verified. Photographs of actual packing/products and a named editorial reviewer can support trust.
5. Make FAQs navigable with contextual collection, care, shipping, returns and contact links. Use direct factual answers and current price/delivery settings.
6. Keep collection/product pages as the commercial destinations. Informational guides should help shoppers choose a real item; avoid loading the homepage with broad unsupported sales claims.

## Top ten prioritized actions

| Priority | Action | Completion evidence |
|---|---|---|
| Critical | Confirm public production crawl/index settings and deployed HTML | Live 200 response, accessible text, canonical, robots verified |
| High | Adopt owner-verified OnlineStore/Vapi/Instagram identity | Shared helper and admin pipeline added; root integrates rendering |
| High | Preserve legacy product URL traffic via valid redirects or genuine 404s | Old cached `/product/:id` URLs checked against current catalogue |
| High | Complete current seller/contact and return/dispatch settings | Approved data present consistently in footer/contact/policies |
| High | Improve collection copy and product material/size/care details | Original copy tied to actual inventory and user decisions |
| High | Add helpful buying/care guides with internal links | Server-rendered, indexable guide content |
| Medium | Add verified owner story and original product/packing photographs | Factual owner review and usable media |
| Medium | Align official social and marketplace identity | Consistent brand URL/profile names; uncertain identities confirmed |
| Medium | Monitor Search Console/Bing and AI referrals after deployment | Baseline by page, query, country and referral source |
| Low | Maintain an optional llms.txt page index | Real public URLs only; no Google ranking claim |

## Limitations

No authenticated GBP, Search Console, Bing Webmaster, analytics, live AI-query monitoring, geo-grid data or comprehensive backlink feed was available in this workstream. Live rating/count/velocity, conversion data, indexed-page counts, exact search ranks and AI citation frequency remain unmeasured. Code changes cannot guarantee rankings, and this document must not be presented as evidence that the fixes are deployed.
