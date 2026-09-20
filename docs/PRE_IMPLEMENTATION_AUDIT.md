# Pre-Implementation Audit (documentation-only)

Date: 2026-09-19. Scope: full constitution vs repo state in `D:\newsatva`. No application code was modified for this audit.

Repo state observed: Next.js 16.3.5 + React 19 scaffold (`src/app`: layout, page, globals.css, favicon), `tsconfig.json` (strict, `@/*` alias), empty `next.config.ts`, `package.json` name `newsatva` with only `dev/build/start/lint` scripts. Constitution docs (this audit's baseline): AGENTS/PRD/ARCHITECTURE/TECH_STACK/DATABASE/API/AUTH/SECURITY/DEVELOPMENT_PLAN/TESTING/ENVIRONMENT/CODE_CONVENTIONS + PAYMENTS/STORAGE/SEO/ANALYTICS/DEPLOYMENT/ERROR_HANDLING/LOGGING/PERFORMANCE/ACCESSIBILITY/GIT_CONVENTIONS/CONTRIBUTING/CHANGELOG + docs/* + .opencode/* + .env.example.

---

## 1. Contradictions (resolve before code)

1. **Guest checkout conflict.** PRD §11 allows "Continue as Guest"; AUTH.md decides "require login before payment". DECISION NEEDED: guest browse + guest cart, login mandatory before Razorpay order creation (recommended — matches AUTH.md). Update PRD §11 if confirmed.
2. **Phase naming collision.** PRD §7 uses "Phase 1/2/3" (MVP waves); DEVELOPMENT_PLAN.md uses "Phase 0–10" (build order). Same word, different axes. RESOLUTION: rename PRD waves to "Milestone M1/M2/M3" or "Stage A/B/C"; keep DEVELOPMENT_PLAN phases as the build authority.
3. **Order items storage.** DATABASE.md lists both `orders` (embedded items) and `orderItems`/`orderitems` as possible collection. DATA_MODELS.md + order snapshot rule say embedded. RESOLUTION: embedded `items[]` in `orders`; drop top-level `orderitems` unless scale forces it. Update DATABASE.md collections list.
4. **Money units.** DATABASE.md product section hedged (paise or rupees); ADR-008 fixes integer rupees (paise only at Razorpay boundary). RESOLVED — code must follow ADR-008; remove hedge sentence from DATABASE.md.
5. **Collection naming case drift.** `inventoryTransactions` vs `inventorytransactions`, `verificationtokens` vs `verificationTokens`. RESOLUTION: adopt Mongoose default lowercase-plural collection names; list canonical names once in DATABASE.md.

## 2. Missing Requirements

- Static/policy pages from the original brief (`/about /contact /faq /shipping-policy /return-policy /privacy-policy /terms`) have no specs (content owner, CMS vs static, forms backend for contact).
- Shipping: fee table, free-shipping threshold value, weight/pincode rules, ETA logic — only "fixed rule initially" stated; needs concrete defaults + `settings` fields.
- Tax/GST: DATABASE.md says tax 0 unless rules added — needs explicit decision (inclusive vs exclusive, invoice needs).
- Returns/refunds: window (days), eligible states, who approves, refund timeline — policy + state machine gap.
- Order cancel window: which states cancellable by customer vs admin-only.
- Stock reservation TTL: how long `reservedStock` held during checkout before release (else stock leaks on abandoned payments).
- Coupons: stacking (one per order — assumed, not stated), per-user limit enforcement mechanism (see §5), first-order definition (by user id? email?).
- Reviews: image count/size limits, edit window, moderation SLA.
- Newsletter: storage (new collection vs external list), consent/double-opt-in, unsubscribe.
- Contact form: destination (email? DB?), spam protection.
- Admin bootstrap: exact seed mechanism (`ADMIN_SEED_EMAIL` + script + removal step) referenced but not specified step-by-step.
- Minor audience (14–17 in stated 14–30 range): payment instruments require 18+; need policy (purchase by guardian? account restrictions?) — legal/UX gap, flag to owner.
- Currency/locale standard: INR formatting (`en-IN`), timezone (IST) for dates/analytics — unstated.
- Monitoring choice (Sentry vs Vercel-only) and uptime/health alerting — unspecified.

## 3. Architectural Risks

- **Bleeding-edge versions** (Next 16, React 19): Auth.js v5, Mongoose, Vitest/RTL/Playwright compat must be pinned and verified in Phase 0; lockfile review required.
- **Phase 0 gaps** (code, not docs): no `typecheck`/`test` scripts, no `src/lib/env.ts`, no `src/lib/db.ts`, no test harness, no structure folders — all planned but absent. Expected; Phase 0 must close them.
- **`next.config.ts`**: no `images.remotePatterns` (Cloudinary), no security headers, no `experimental` flags review — required before product images go live.
- **Webhook raw body**: App Router requires `await req.text()` + signature on raw bytes; a JSON-parsing middleware would break verification — implementation must avoid body pre-parsing on that route.
- **Middleware vs server checks**: plan correctly states middleware is UX-only; every protected API/page must re-verify — enforce in code review checklist.
- **Package name**: `newsatva` ≠ `satvastones` — cosmetic; rename at Phase 0 to avoid confusion in logs/analytics.

## 4. Security Risks (controls documented, none implemented yet)

Highest-risk paths to gate phases on: payment verify/webhook idempotency, admin guard, IDOR scoping, coupon atomicity, search-input sanitization.
- Rate-limiting backend unspecified (in-memory vs Upstash/Vercel KV) — decide in Phase 0; webhook route needs generous-but-present limits.
- CSP/header values not specified beyond names — define in Phase 0 (`next.config.ts` headers).
- OAuth: allowed redirect URIs per env, state/nonce handling via Auth.js defaults — verify, don't customize.
- Search regex: cap `q` length (e.g. ≤100 chars), escape regex chars or use text index — else ReDoS/scrape risk.
- Newsletter + coupon-validate + reviews: abuse targets; require CAPTCHA-or-delay decision (at least rate limits + validation).
- No secret-rotation story (Razorpay/webhook/Resend) — document rotation runbook before production.

## 5. Missing Database Relationships / Constraints

- **Coupon per-user limits unenforceable** with counters alone: need `couponRedemptions { couponId, userId, orderId, at }` (unique `couponId+userId+orderId` as appropriate) or embedded redemption log. Add to DATABASE.md.
- Unique indexes planned but not yet codified as code: `users.email`, `products.slug/sku`, `coupons.code`, `carts.userId`, `wishlists.userId`, `orders.razorpayOrderId` (sparse unique), webhook event-id dedupe store. All must appear in Phase 1/2 models.
- `reviews` compound unique `(productId, userId)` decided in DATABASE.md — confirm single-review-per-user policy with owner (vs one-per-order).
- `banners`/`settings` validation schemas missing (fields listed, constraints not) — needed before admin content UI.
- `notifications` payload shape + retention policy missing — needed before Phase 7.

## 6. Missing API Requirements

- Reviews path inconsistency: `GET /api/products/:id/reviews` uses `:id` while product reads use `:slug` — standardize (slug for reads; id accepted internally) and document.
- Absent from API.md: newsletter subscribe/unsubscribe, contact submit, shipping-quote, admin banners/settings CRUD, admin customer detail/disable, admin review moderation queue params, sitemap/health/auth-callback exclusions from auth.
- Pagination defaults unstated: set `default limit 12/20, max 50/100`, `max page` behavior, and sort allowlist — prevents full-catalog loads.
- No API versioning strategy (acceptable: unversioned `/api/*` for MVP — state explicitly).
- Error `details` shape for validation (field errors) shown in ERROR_HANDLING.md but not per-endpoint — fine, but codegen must follow the envelope everywhere.

## 7. Missing Acceptance Criteria

`docs/ACCEPTANCE_CRITERIA.md` covers auth/products/cart/checkout/orders/admin + gates. Add:
- Static/policy pages render + SEO metadata present.
- Newsletter subscribe validates + rate-limits + stores consent.
- Order confirmation + all Resend lifecycle emails deliver (test mailbox) with correct amounts/status.
- Sitemap/robots/JSON-LD valid (Search Console + Rich Results test).
- GA4 commerce events fire with correct value/currency (purchase only after verified PAID).
- Accessibility: keyboard-only checkout completable; Lighthouse a11y ≥ 90; no `dangerouslySetInnerHTML` with user data.
- Performance budgets (PERFORMANCE.md targets) measured on home + product pages.
- Admin audit log entries exist for product/order/coupon mutations.

## 8. Missing Environment Variables / Config

- No test-env story: `MONGODB_TEST_URI` (or in-memory), Razorpay *test* keys vs live, Resend sandbox sender, Cloudinary test folder — document `.env.test` / CI secrets.
- `ADMIN_SEED_EMAIL` present as optional — add one-time seed procedure + removal reminder (DEPLOYMENT.md checklist references it; link both ways).
- `NEXT_PUBLIC_APP_URL` per env (local/preview/prod) + canonical domain decision; OAuth callback derives from it — document preview-URL handling (auth disabled or allowlisted on previews).
- Missing (optional but plan): `SENTRY_DSN`/`NEXT_PUBLIC_SENTRY_DSN`, `UPSTASH_*` (if rate limiting), `NODE_ENV` behavior notes, log-level var.
- Secret generation: `AUTH_SECRET` via `npx auth secret`; Google redirect URIs (`/api/auth/callback/google` for each env) — add to ENVIRONMENT.md/CONTRIBUTING.md.

## 9. Missing Test Cases (add to TESTING.md matrix)

- Coupon edges: expired, inactive, min-order unmet, max-discount cap, category/product scoping, first-order-only (second order rejected), usage-limit exhaustion (concurrent redemptions), stacking attempt (two codes → one applied).
- Payments: signature mismatch → 402 + order stays PENDING; verify retry → single PAID; webhook replay → no duplicate; `payment.failed` → FAILED; refund webhook → REFUNDED + restock.
- Cart merge: guest+account same product/variant → quantities summed, capped at stock; unpublished/out-of-stock items rejected at merge.
- Variants: variant-SKU stock enforced independently; invalid SKU rejected.
- Visibility: unpublished product → 404 public, 200 admin; unlisted category hidden.
- Auth matrix: anon/customer/admin × each admin API → 401/403/200 as appropriate; IDOR: user A `GET /api/orders/<B-id>` → 403/404.
- State machine: invalid transitions rejected (e.g. DELIVERED→PROCESSING; customer cancel of SHIPPED).
- Validation: bad pincode/phone/slug/rating/quantity → 400 with field details.
- Newsletter: invalid email → 400; duplicate → idempotent success; rate-limit → 429.

---

## Verdict

Constitution is **strong and implementable**; no blocking contradiction. Resolve §1 items (guest-checkout decision, phase naming, order-items embedding, collection-name canonicalization) with doc edits, then proceed to `docs/IMPLEMENTATION_PLAN.md` and Phase 0. Do not write application code before the plan lands.
