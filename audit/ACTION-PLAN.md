# SatvaStones: India sales and search execution plan

**1 October 2026.** Online-only Vapi, Gujarat business; India-wide customers. Candidate queries below are hypotheses to validate against Search Console/Keyword Planner and real stock, not fabricated volume or guaranteed ranking predictions.

## Before release

1. Review the local revision and deploy it to the canonical `https://www.satvastones.in` production host. Keep production indexing enabled and preview indexing disabled. Recheck homepage, category, page 2, guide, simple product, variant product, missing product, robots, sitemap and feed.
2. Correct missing real variant SKUs on the two products named in the full report. Check selection, price and stock against the bag and feed. The code now excludes malformed schema/feed rows; catalogue repair is still needed.
3. Fill the seller's actual legal name, support email/phone, registered street/PIN, dispatch/delivery information and approved return/cancellation policies in Admin → Settings. Vapi/Gujarat/official Instagram already have verified defaults. Keep physical-store opt-in disabled.
4. Write unique details for the three products with missing descriptions and differentiate the duplicate bracelet titles. Add accurate item-specific size/material/care evidence for the top-selling or best-margin available items.
5. Run Google Rich Results Test and Search Console live URL inspection after deployment. Submit the canonical sitemap. A domain property covers www and apex; a URL-prefix property may not. Do not request indexing of private, empty, duplicate or obsolete URLs indiscriminately.

## Week 1: measurement and merchant foundation

| Work | Acceptance criterion | Owner |
|---|---|---|
| GSC domain/property verification and sitemap | Submitted www sitemap; sampled desired canonicals/indexing reasons understood | Site owner |
| GA4 ecommerce verification | view_item/add_to_cart/begin_checkout/purchase verified; purchase transaction IDs consistent; no customer personal data in events | Owner/developer |
| Merchant Center account/domain | Verified business and claimed canonical domain; approved India shipping/returns match website | Site owner |
| Product feed review | `/product-feed.xml` fetches; every intended SKU accounted for; current price/availability; omitted rows repaired or deliberately excluded | Owner/developer |
| Product identifiers | Actual brand/GTIN/MPN/condition supplied when required; no invented identifiers or false identifier_exists | Catalogue owner |
| Performance baseline | Real mobile/desktop PSI or Lighthouse sample plus available CrUX field data; hosting/Mongo region and slow routes profiled | Developer |

Record 28-day baselines for organic impressions/clicks, branded vs nonbranded queries, category/product entrances, add-to-cart, checkout completion, organic revenue and returns. Missing baseline values remain unknown, not zero. Configure measurement/access first; numerical sales/ranking targets should then reflect actual traffic and margins.

## Weeks 2–4: improve existing pages first

Choose the first 10 priority items by stock, margin, demand evidence and sales, rather than editing all 66 products at random. For each: original photo details, exact measurements/options, honest materials/finish, package contents, applicable care, relevant delivery/return answers, clear title/snippet and real customer questions. Review titles against other products to avoid cannibalization.

| Candidate query cluster | Appropriate page | Evidence needed |
|---|---|---|
| jewellery online India / SatvaStones jewellery | Homepage and main shop | Brand/business identity and clear collection proposition |
| rings online India / minimalist rings / couple rings | Actual rings collection and matching items | Real assortment, size system and option SKUs |
| Korean earrings India / bow stud earrings / drop earrings | Earrings collection and matching products | Style-specific photographs and factual materials/measurements |
| minimalist bracelets / charm bracelet / paperclip bracelet | Bracelets collection and corresponding items | Distinct titles, fit/length and chain/charm details |
| necklaces online India / minimalist choker | Necklaces collection and corresponding items | Chain length, fastening and genuine item attributes |
| jewellery gift hamper India | Actual gift-hamper products/collection | What is included, dimensions, packaging, delivery terms |
| oxidised jewellery / festive jewellery | Existing genuinely matching collection | Accurate finish, available pieces and original styling photos |
| anti-tarnish / 18K gold-plated / stainless steel queries | Only products with verified claims | Supplier specifications or credible product evidence |
| SatvaStones Vapi / SatvaStones Gujarat | About/contact/business entity | Accurate origin and online-only model |

Use existing category editors for original collection copy and snippets. Explain the actual assortment and selection decisions; link to matching products and the buying guide. Do not create overlapping thin collections to target every keyword spelling. English/Hinglish aliases can help internal search; translated SEO pages require actual translations and maintenance before hreflang is added.

## Weeks 5–8: original evidence and reputation

- Enrich the new buying guide with photos showing how listed measurements/options correspond to actual products. Add a real ring size reference only after measuring and verifying the sizing system used for your stock.
- Publish at most a few useful pieces that answer actual support/GSC questions: selecting a specific gift hamper, comparing genuinely stocked ring sizes, or caring for a confirmed material/finish. Use your own demonstrations and product photography. Avoid generic daily AI articles.
- Gather honest purchaser reviews through the existing review system, respond to complaints and keep proof of buyer status. Do not create artificial reviews or offer rewards only for positive ratings.
- Align Instagram bio/store links with the canonical website and brand identity. Reuse original product demonstrations; maintain current product availability and support information.
- Pursue relevant real creator/customer/editorial coverage, with disclosure where appropriate. Evaluate relevance and referral sales rather than buying bulk links or directory packages.

## Weeks 9–12: improve from measured results

Compare 28-day trends by branded/nonbranded and product/category. Check indexing reasons for URLs intended to rank. Improve titles where meaningful impressions coexist with low CTR, and product fit/delivery clarity where visitors fail to add to cart. Account for seasonality and small samples before assigning causality to an SEO change.

Track Merchant disapprovals and SKU omissions, reconcile prices/stock, assess field mobile CWV, and test a compact mobile product purchase presentation only if behavior suggests friction. Check AI referral landing pages and sales where referrals are actually recorded; manually sample relevant AI answers without representing those samples as universal visibility.

Expand content and collections only after existing pages show demand and fulfilment can support them. Set numerical goals from the baseline; no top-position or sales outcome can be promised solely from this code revision.

## Location and AI decisions

Keep Vapi/Gujarat origin information consistent. Target India through product/collection content and verified shipping. Google excludes online-only brands from GBP eligibility, so a fake shop pin or repeated city landing pages is inappropriate. [Business eligibility](https://support.google.com/business/answer/13763036?hl=en).

Keep public HTML accessible and factual, improve original evidence and merchant/business details. llms.txt does not improve Google Search visibility; no special AI schema or fixed article length is needed. [Google AI guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide).

## Operations backlog

- Consolidate the two-hop HTTP apex redirect at the hosting/CDN layer if supported; do not introduce app redirect loops.
- Review Cloudflare email obfuscation if contact information must work without JavaScript.
- Profile slow public data queries before adding selective caching. Keep authenticated review controls and live stock out of shared stale responses.
- Add a genuine logo to business schema when an approved crawlable logo asset is available.
- Consider verified IndexNow submission for Bing when its traffic justifies the integration; it is not a Google requirement.
- Split the sitemap before 50,000 URLs/50 MB. Current 66-product scope does not require sitemap sharding.
