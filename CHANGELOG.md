# Changelog

All notable changes to SatvaStones are documented here. Format follows Keep a Changelog; versions follow SemVer.

## [Unreleased]

### Changed (Storefront revamp: Desi-Editorial)

- Design system: new `haldi`/`mehendi`/`sindoor` tokens + utilities (`.eyebrow`, `.section-title`, `.lede`, `.btn-primary/gold/ghost`, `.card-lift`, `.badge-off/bestseller/new`, `.trust-strip`, `.bg-bandhani`, `.ship-progress`, `.admin-card/kpi`) in `globals.css`. No business logic touched.
- Header: festive announcement bar (free shipping ₹399, UPI/cards, 7-day cover), sticky positioning (spacer removed), ADMIN link for admins.
- Footer: trust-badge row, SEO `nav` landmark, `h2` headings, Vapi + ₹/taxes copy.
- Home: trust strip, "Shop by occasion" (Wedding/Everyday/Gifting/Under ₹499), budget band (Under ₹499/₹999/Most loved), hero trust microcopy, `new`/`bestseller` card badges. Single h1 preserved; Organization + WebSite JSON-LD untouched.
- Shop: category-aware h1, lede with shipping/payment reassurance, playful empty state.
- Product: "Good to know" trust panel (delivery, UPI-only-no-COD, gift packing, 7-day cover), tax-inclusive notes, gallery counter + resized images, warmer purchase panel.
- Bag/wishlist: free-shipping progress bar (live threshold), gift/trust notes, `btn` system, lazy resized thumbnails.
- Checkout: step hints, UPI-first payment copy, server-truth disclaimer, festive confirmation with order tracking link.
- Account/auth/static: `Namaste` login with trust checklist, eyebrow/section titles, order tracking eyebrows.
- Reviews: verified-review header copy.
- Admin: back-office greeting, ₹ KPIs via `.admin-kpi` classes, dashboard quick-nav via `.admin-card`. Guards, services, APIs unchanged.

### Changed (Mobile-first responsiveness)

- Admin shell: `minmax(0,1fr)` grid (no overflow), sticky mobile nav, compact brand bar with ← Store link, `px-4` mobile padding.
- Admin tables (products/orders/coupons/categories): mobile card lists (`md:hidden`) with full actions; tables kept for `md+`. Search stacks vertically on phones; 16px inputs stop iOS zoom.
- Storefront type scale: heroes `text-5xl` base, section titles `text-4xl` base, product/shop h1s stepped down on phones; announcement bar wraps with tighter tracking.
- Touch: stacked checkout buttons, compact cart rows, 16px form text site-wide on ≤640px, gold tap highlight, `max-width:100%` media guard.

### Fixed (Admin orders crash, uploads, back-office theme)

- Orders `replaceAll` crash: legacy orders missing `orderStatus`/`paymentStatus`/`userId`/`items`/`timeline` no longer 500 the list — `toOrderDTO` + `listAdminOrders` default defensively, `StatusPill`/`OrderTimeline` accept nullish values (admin uses new `dark` variant).
- Uploads: 4MB cap (Vercel bodies die ~4.5MB before code runs), client-side size guard + non-JSON platform-error surfacing in `ProductForm`/`BannerManager`. Set `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET` on Vercel or every upload 500s.
- Theme: orders/coupons/categories/reviews/banners managers + order detail + actions converted from washed-out `bg-white/60`-on-dark to the dark back-office (ivory text, gold accents, emerald/red status tones).

### Fixed (Legacy COD-era orders read-only)

- `POST /api/admin/orders/6a5b85…/cancel` 409: that order (SAT-1003, COD-era import with `status: "Delivered"`, no `userId`, no machine statuses) can never enter the PENDING→…→DELIVERED machine. `updateOrderStatus`/`adminCancelOrder`/`refundOrder` now reject such docs with a clear "Legacy imported order is read-only" 409 instead of crashing or misleading.
- `OrderDTO`/`AdminOrderRow` carry `legacy: true`; the admin list shows a LEGACY pill (plus the legacy customer email/amount), the detail page shows a read-only banner and hides Actions. `updateOrderStatus` also guards `TRANSITIONS[undefined]` (was a 500).

### Added (Phase 3: Shopping)

- `Cart` + `Wishlist` models (one per user, unique userId); guest carts in localStorage with snapshots, merged once-per-login via `CartProvider` + `SessionProvider`.
- `cart-service` (live pricing/availability, stock caps with `adjusted` flag, merge summary, unavailable pruning) + `wishlist-service` (idempotent add, remove, move-to-bag).
- APIs: cart CRUD + `POST /api/cart/merge`, wishlist CRUD + move-to-cart, `GET /api/search` alias, test-only `POST /api/test/seed` (prod-404, secret-gated).
- UI: global `SiteHeader`/`SiteFooter`, bag drawer + `/cart` page, `/wishlist` page, product `PurchasePanel` (variant/qty/add/wishlist), `RecentlyViewed` (snapshot-based).
- Tests: guest-cart unit (6), cart-service integration (6), wishlist-service (4), guest e2e (seeded: add, qty, sold-out, wishlist→login, seed-auth).
- ADR-013: guest snapshot pricing + test seed endpoint. `/checkout` forward link in place for Phase 4.

### Added (Phase 4: Checkout & Payments)

- Models `Order` (server totals, address snapshot, timeline, idempotency indexes), `Payment` (event log), `Coupon` + `CouponRedemption`, `InventoryTransaction`, `Settings` (shipping + TTL).
- Services: addresses (default rotation, cap, ownership), coupons (scope/cap/first-order/limits + atomic reserve/release/redemption), inventory (reserve → sale / release / restock + lazy TTL sweep), orders (create, Razorpay order, verify, webhook settle, cancel).
- `src/lib/razorpay.ts` (lazy SDK, HMAC verify both paths, constant-time compare).
- APIs: addresses CRUD, coupons/validate, orders create/cancel, payments create/verify, raw-body webhook (400 on bad signature, ack-200 otherwise).
- Checkout wizard: login gate → address → delivery + coupon → Razorpay Checkout.js → server verify → confirmation. Bag clears at order creation (order becomes truth).
- Tests: crypto (3), addresses (4), coupons (6), orders (12: totals, shipping, idempotency, replay, refund, cancel, expiry, ownership), checkout e2e (guards + webhook gate).
- ADR-014: reservation/coupon concurrency model + customer-cancel scope. Live test-mode rupee flow remains a manual gate before Phase 5.

### Added (Phase 5: Orders)

- Customer: `GET /api/orders`, `GET /api/orders/:id` (owner-scoped), `/account/orders` history + detail with tracking timeline, totals, PENDING cancel button.
- Admin: `GET /api/admin/orders` (status/payment filters + customer emails), detail, `PATCH` status along a strict machine, `POST cancel` (unpaid, hold-releasing), `POST refund` (Razorpay full refund → REFUNDED + restock).
- Shared `StatusPill` + `OrderTimeline`; account/admin nav wired; `payments.refund` correction (SDK has no `refunds.create`).
- Tests: state-machine walk + jump rejections, admin cancel/restock, refund idempotency, IDOR scoping, requireAdmin matrix, orders e2e guards.
- ADR-015: cancel/refund model (customer PENDING-only; paid orders refund, never cancel).

### Added (Phase 6: Reviews & Coupons)

- `Review` model (unique per product+user, server-computed verified badge, moderation flag) with aggregate recalc on every mutation.
- Review APIs: public list, member create/edit/delete (owner-scoped), admin publish/hide, member image uploads (`POST /api/uploads`, images-only).
- Coupon admin: CRUD service + APIs (immutable codes, limit guards, delete-only-unused) + manager UI.
- Product page `ReviewsSection` (aggregate header, verified badges, masked authors, write/edit); admin reviews queue + coupons manager wired into nav.
- Tests: verified/unverified/duplicate/ownership/aggregate matrix (6), coupon admin rules (4), review + admin e2e guards.
- ADR-016: one-review-per-user, verified-from-PAID-orders, masked display names. Reviews API uses slugs (`:slug`), diverging from API.md's `:id`.

### Added (Phase 7: Notifications)

- `Notification` outbox model (SENT/FAILED log, never throws into business flows).
- Eight Resend templates (welcome, order confirmation, payment receipt, shipped, out-for-delivery, delivered, cancellation, refund) — pure, snapshot-asserted, secret-free.
- `src/lib/email.ts` (lazy client, one immediate retry, recipient resolution, `EMAIL_FROM` override).
- Triggers: welcome on first OAuth user (fire-and-forget), confirmation + receipt at settle, shipped/out-for-delivery/delivered on admin transitions, cancellation on both cancel paths, refund on admin refund + webhook. Expiry sweep stays silent (no money moved).
- Tests: template content/secrecy (3), delivery SENT/retry/FAILED/no-recipient (4), exactly-once across verify replay, refund retry, cancel retry, and status walks.
- ADR-017: awaited sends in order flows, silent expiry, Resend test-sender default.

### Added (Phase 8: SEO + Analytics + Content)

- SEO: `sitemap.ts` (fail-soft), `robots.ts` (private areas disallowed), product canonical + BreadcrumbList JSON-LD, corrected a stray COD claim (no COD in MVP).
- Analytics: typed GA4 helper + loader (ID-gated), events wired (view_item, search, bag, wishlist, begin_checkout, payment info, purchase).
- Content: `Banner` model + admin CRUD, homepage (hero, departments, new arrivals, best sellers, verified-review wall, newsletter), `NewsletterSubscriber` + honeypotted/rate-limited signup, `ContactMessage` inbox + contact page, about/FAQ/shipping/returns/privacy/terms, footer links.
- Tests: SEO routes (2), analytics events incl. no-PII (3), rate-limit + newsletter + contact (3), content e2e (signup, contact, banners guard, policy pages).
- ADR-018: collections-as-tags, in-memory rate limits, GA without consent banner (no ads/remarketing).

### Added (Phase 9: Hardening)

- Rate limits rolled out: coupons/validate (10/min), review writes (5/min), order create (10/min), payments (15/min), member uploads (20/min) — user-scoped after auth; newsletter/contact stay IP-scoped. In-memory per instance (ADR-019).
- Admin audit log: `auditlogs` collection + helper, wired into all 16 admin mutations (products, categories, orders, coupons, reviews, banners).
- Admin dashboard: KPIs, 14-day sales bars, top products, low-stock alerts (`GET /api/admin/dashboard` + hub UI).
- Review photo uploads in the review form (completes the Phase 6 images contract).
- A11y: skip link, global focus-visible ring, reduced-motion guard, drawer Escape + focus.
- Tests: audit writes (2), dashboard aggregates (2), address validation, post-progress cancel refusal, newsletter 429, security headers, keyboard drawer.
- Fixed a live regression: Phase 5 had overwritten `POST /api/orders` (order creation) — restored alongside GET.
- ADR-019: in-memory limiter + audit-never-blocks + dashboard definitions (UTC day, PAID-only sales).

### Added (Phase 10: Production)

- `GET /api/cron/release-reservations` (CRON_SECRET bearer) + `vercel.json` 30-min schedule.
- `test:coverage` script (TESTING.md parity).
- `docs/PRODUCTION_LAUNCH.md`: accounts, env table, deploy, seed, rollback, the two blocking manual gates (test-mode rupee flow, prod smoke), post-launch ops, accepted limitations.
- Env: `CRON_SECRET` documented; secret audit clean (publishable-only `NEXT_PUBLIC_*`, no TODOs, logger-only console).

### Added (Phase 1: Authentication)

- Auth.js Google OAuth: `src/lib/auth.ts` (lazy instance, MongoDB adapter + JWT sessions, server-side role injection), `src/app/api/auth/[...nextauth]/route.ts`, `GET /api/account/me` (401 when logged out).
- `src/models/User.ts` (shared `users` collection, CUSTOMER default, unique email, validated Indian phone/pincode addresses), `src/services/user-service.ts` (role reads, adapter-doc backfill).
- `/login` (Google entry), `/account` shell (server-checked layout + profile overview + sign-out).
- `src/proxy.ts` guards: `/account /orders /admin` + user/admin APIs (redirects for pages, 401/403 JSON for APIs).
- `scripts/seed-admin.ts` + `npm run seed:admin` (one-time ADMIN grant; refuses unknown users).
- Tests: model validation, role service integration (unique email, backfill, ADMIN preserved), e2e guards with dummy env (login renders, redirects, 401 envelope). Live Google round-trip remains a manual acceptance step.
- ADR-011: `force-dynamic` on session routes (prerender must never evaluate `auth()`).

### Added (Phase 2: Catalog)

- Models `Category` + `Product` (unique slugs/SKUs, text index, variant SKU guards), `slugify`/`ensureUnique`, Zod input + query schemas (capped pagination, safe filters).
- Services: public list/detail (visibility, related, discount math), admin create/update/delete/duplicate/bulk (SKU collision checks, sales-counter preservation, best-effort image cleanup).
- APIs: `GET /api/products`, `GET /api/products/:slug`, `GET /api/categories`; admin categories/products CRUD, duplicate, bulk, `POST /api/admin/uploads` (server-side Cloudinary, type/size gated).
- Storefront: `/shop` (search/filter/sort/pagination), `/products/:slug` (gallery, variants, specs, breadcrumbs, JSON-LD, metadata).
- Admin: `/admin` hub, products table (bulk ops), full product form (RHF+Zod, uploads, variants), category manager. All behind `requireAdmin`.
- Tests: 8 catalog-service integration cases, utils/upload unit tests, 6 shop e2e cases (real throwaway DB via `scripts/e2e-dev.mjs`).
- ADR-012: E2E against in-memory Mongo.

### Fixed (Phase 2)

- `error.tsx` no longer nests `<html>/<body>` (was a hydration error on every crash page).

### Added

- Project constitution: AGENTS.md, PRD.md, ARCHITECTURE.md, TECH_STACK.md, DATABASE.md, API.md, AUTH.md, SECURITY.md, DEVELOPMENT_PLAN.md, TESTING.md, ENVIRONMENT.md, CODE_CONVENTIONS.md, ERROR_HANDLING.md, PAYMENTS.md, STORAGE.md, SEO.md, ANALYTICS.md, DEPLOYMENT.md, LOGGING.md, PERFORMANCE.md, ACCESSIBILITY.md, GIT_CONVENTIONS.md, CONTRIBUTING.md, docs/*, .opencode/*, .env.example.
- Next.js + TypeScript + Tailwind scaffold (Phase 0, partial — pending typecheck script, env validation, DB connection, test harness).

### Changed

- README.md replaced with constitution entrypoint (was create-next-app default).
- Package renamed `newsatva` → `satvastones`.
- PRD.md: login required before payment (guest cart merges on login; no guest checkout); MVP waves renamed Milestones M1/M2/M3 (build phases stay in DEVELOPMENT_PLAN.md).
- DATABASE.md: order items embedded in `orders` (no `orderitems` collection); addresses embedded in users; canonical lowercase-plural collection names; money fixed to integer rupees (ADR-008).

## [0.1.0] — 2026-09-19 (Phase 0: Foundation)

### Added

- Scripts: `typecheck`, `test` (vitest), `test:e2e` (playwright). Deps: mongoose, zod, react-hook-form, next-auth@beta + @auth/mongodb-adapter, mongodb@^6, razorpay, cloudinary, resend; dev: vitest, RTL, jest-dom, jsdom, mongodb-memory-server, prettier, playwright (see ADR-009).
- `src/lib/env.ts` (lazy Zod validation, presence flags), `src/lib/db.ts` (cached Mongoose), `src/lib/errors.ts` (AppError + envelopes), `src/lib/logger.ts` (redacting JSON logger).
- `src/proxy.ts` (Next 16 proxy convention; passthrough, guards in Phase 1), hardened `next.config.ts` (Cloudinary remotePatterns, security headers, prod-only CSP).
- App shell: SatvaStones home, metadata, `error.tsx`/`loading.tsx`/`not-found.tsx`, `GET /api/health` (secret-free).
- Test harness: `vitest.config.ts`, `playwright.config.ts`, `tests/setup.ts`; unit tests (env, errors, logger), integration test (DB connect via memory server), e2e smoke (home + health).
- ADR-009 (dependency pins), ADR-010 (lazy env validation).

### Fixed

- Replaced deprecated `middleware.ts` with Next 16 `src/proxy.ts`.
- E2E pinned to port 3100 (`reuseExistingServer: false`): localhost:3000 is occupied by an unrelated server and must fail loudly rather than test the wrong app.
