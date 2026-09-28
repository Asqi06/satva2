# Storefront redesign — 28 September 2026

## Implemented

The customer storefront now uses one restrained visual system: existing red branding, white and warm neutral surfaces, Fraunces headings, consistent Inter body text, small corner radii, matching spacing and clear primary/secondary controls. Product photography remains the store's existing photography. No dependencies or tracking services were added.

- **Navigation:** compact sticky header, one static announcement, visible search, live bag count, simple mobile menu, native keyboard-accessible dialogs. Checkout has a compact header and footer.
- **Homepage:** one hero and CTA, early category photography, four popular pieces, delivery/payment/help information, four new arrivals, genuine verified reviews when available, restrained story/help/newsletter sections. Removed promotional repetition, continuous marquees and mounted scroll hijacking/bottom navigation.
- **Discovery:** debounced product suggestions with photos/prices, keyboard navigation, partial product/SKU searches, known jewellery spelling variants and existing Hinglish terms. Relevant category, price, material, colour, size and stock filters; real option counts, multi-select chips, URL persistence and useful empty states. Colour/size combinations must exist on the same variant.
- **Products:** consistent two-column mobile cards, actual prices and genuine review counts, swipe gallery, zoom, visible option buttons, selected option pricing/availability, dominant Add to Cart, compact mobile purchase bar after the main button scrolls away. Description/details/shipping sections are scannable; related products appear later and are limited to four. Stored product descriptions were preserved.
- **Cart:** shared editable line items for page/drawer; visible selected options, quantities, prices, availability and errors. Actual shipping fee/threshold, no added checkout fees or invented offers. Fixed guest picks being skipped on a later login to the same account.
- **Checkout:** guest and member checkout, autofill and Indian phone/PIN validation, retained valid fields, expandable coupon entry, clear costs, existing Razorpay flow and a detailed verified-payment confirmation. Mobile total is visible above the form with a link to the full summary.
- **Help/account:** consistent login, account, wishlist, policy, contact, FAQ and empty/error pages. Removed unsupported delivery/return/studio claims from affected fallback copy and notification templates.

## Guest checkout and payment behaviour

Guest checkout uses the installed authentication library to issue an encrypted token in an HttpOnly, SameSite cookie (Secure in production). It grants access to that browser's cart/orders, without creating a user account or granting access to account/admin APIs. Guest order creation also has an IP rate limit; existing process-local rate limiting is not a distributed abuse-control system.

Cart identities, published products, variants, quantities, prices, coupons and inventory are checked on the server. Existing transactional stock holds, ownership checks, capture/signature verification, webhook handling and refund protections remain in place. Account-restricted coupons require sign-in.

Payment dismissal preserves the pending order. Retry reuses it; reloading restores it. The order's Continue payment link can recover it without the original tab's session storage. A changed server total requires another explicit payment confirmation. Cart clearing and the success screen follow verified payment.

**Known limit:** guest tracking requires the original browser's cookie, valid for 30 days from issuance. There is no cross-device email verification/recovery system or automatic transfer of guest orders into an account. Keep the order number and use configured support when needed. Do not share order numbers as a substitute for authentication.

## Editing the storefront in admin

1. **Banners:** edit the first active banner's photo, title, subtitle, link and sort order to control the homepage hero. The homepage intentionally displays one hero.
2. **Categories:** open Categories, edit a category, upload its image and set useful image alt text. Publish it and use sort order to choose placement. When no category image is set, a published product photo is used as a fallback. The homepage shows up to six categories with an image or published products; all published categories remain discoverable through navigation/shop.
3. **Products:** manage product photography, description, material/dimensions, category, option labels/SKUs, prices, reference prices and inventory. Listing filters and pricing derive from this data. Confirm genuine reference prices and product claims before publishing.
4. **Settings:** set one announcement, shipping fee/free threshold, business/support details, dispatch/delivery information and the existing editable policy/about/SEO fields. Verified seller/address/support/grievance and policy details are still awaiting the owner; unspecified facts were not invented.
5. **Reviews:** only published real reviews appear; homepage testimonials additionally require verified purchases. No fabricated reviews or urgency were added.

## Analytics

The existing optional GA4 helper now covers product views, searches, filters, cart additions/removals, checkout entry, information-step completion, payment attempts and purchases. Filter events send field names/counts rather than form/customer data. No new service was installed; events remain inactive without configured analytics.

## Verification

- `npm test`: **170 tests across 30 files passed**, including guest token isolation, server repricing, inventory/payment guards, variant filters, wishlist option handling and repeat-login cart merging.
- `npm run test:e2e -- --workers=1`: **43 checks passed** using port 3100 and a temporary Mongo database. Includes guest checkout, dismissal/retry/reload, order-link recovery, access denial from another browser, mobile search/filter/gallery and native dialog focus.
- TypeScript passed. ESLint passed with no errors and one existing React Hook Form compiler warning in the admin ProductForm.
- Production build and HTTP verification passed: real 404 statuses, variant structured prices, canonical/sitemap origins, legacy redirects, secure guest cookies, server-calculated guest totals, no guest account creation and account API guards. Rechecked after the final changes.
- Public homepage, shop, product and checkout were inspected at **375, 768, 1024 and 1440px**, with no horizontal overflow and one main heading each. Real product screenshots were reviewed. Visual browsing did not write to the live store database.

`vibe-check` was attempted but is unavailable on this machine. The existing test suite was used. Test emails were disabled and the browser payment gateway was simulated; no live payment was made. Real Google sign-in, configured payment methods, an actual Razorpay purchase/refund and email delivery still require provider acceptance checks. No new PageSpeed score, conversion uplift or ranking result is claimed.

Earlier technical/SEO work remains described in `TECHNICAL_SEO_AUDIT_2026-09-28.md`; this document records the subsequent storefront changes, including replacement of the formerly mounted Lenis/navigation behaviour.
