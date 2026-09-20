# Requirements (source of truth index)

SatvaStones: D2C jewellery e-commerce for Korean/Western/Gen-Z/Pinterest-inspired jewellery (rings, bracelets, necklaces, pendants, earrings, oxidised, gift hampers). Premium-looking, accessible. Audience ~14–30 India.

## Functional (MVP)

1. Google OAuth login; account (profile, addresses, orders, wishlist, reviews, settings, logout).
2. Catalog: categories (dynamic), product listing with search/filter/sort/pagination, product detail (gallery, variants, ratings, related, recently-viewed).
3. Cart: add/update/remove, coupon, totals; guest localStorage + merge on login; server persistence for members.
4. Checkout: login → address → delivery → Razorpay (UPI/cards/netbanking/wallets) → confirmation (order id, items, amounts, payment status, address, ETA).
5. Orders: list/detail/timeline tracking, cancel eligible, payment info.
6. Wishlist: add/remove/move-to-cart, cross-device sync (auth).
7. Reviews: purchasers only get Verified Purchase; moderation.
8. Coupons: percentage/fixed, min-order, max-discount cap, product/category scope, first-order-only, usage limits, expiry.
9. Admin: dashboard (sales, orders, customers, AOV, top products, low stock, pending), products (CRUD/duplicate/publish/bulk), inventory (thresholds/history), orders (status/refunds), customers, coupons, review moderation, banners/collections.
10. Inventory: SKU-level available/reserved/sold, decrement on paid order, restore on cancel/refund.
11. Email (Resend): welcome, confirmation, payment, shipped, out-for-delivery, delivered, cancellation, refund.
12. SEO + analytics: metadata/sitemap/robots/JSON-LD; GA4 commerce events.

## Non-functional

Secure, responsive, accessible (WCAG-minded), SEO-friendly, strict-TS, maintainable, deployable to Vercel. Editorial, playful-minimal design; no AI-slop. Performance targets: LCP ≤ 2.5s, CLS ≤ 0.1, INP ≤ 200ms.

## Out of scope (MVP)

COD, Shiprocket/Delhivery live integration (fixed rules first), WhatsApp, loyalty/referrals/gift cards, AI support, abandoned-cart recovery — Phase 2/3.

Conflicts: this file defers to PRD.md; if conflict, stop and resolve per AGENTS.md (never silently invent).
