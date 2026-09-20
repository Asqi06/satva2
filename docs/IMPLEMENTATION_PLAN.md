# Implementation Plan (build authority after DEVELOPMENT_PLAN.md)

Status: planning only — no application code written. Execute top-to-bottom; never start a phase with the previous phase's exit criteria red. After every phase: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` green + docs updated.

Decisions required from owner before Phase 4: (a) guest checkout — RECOMMENDED: login required before Razorpay order creation (AUTH.md); update PRD §11 accordingly. (b) PRD "Phase 1/2/3" renamed to Milestones M1/M2/M3. (c) Order items embedded; drop `orderitems` collection. Minor: rename package `newsatva` → `satvastones`.

---

## Phase 0 — Foundation (shell, no business features)

Dependencies: none. Goals: scripts, env validation, DB hookup, structure, test harness, headers, health.

Tasks:

1. **0.1 Package rename + scripts + deps.** Files: `package.json`. Add `typecheck: tsc --noEmit`, `test: vitest run`, `test:e2e: playwright test`. Install (pinned): `mongoose zod react-hook-form`, `next-auth@5 (auth.js)`, `@auth/mongodb-adapter` (or custom adapter — spike first), `razorpay cloudinary resend`, dev: `vitest @vitejs/node-tui? (per docs) @testing-library/react @testing-library/jest-dom jsdom mongodb-memory-server`, `@playwright/test`, `prettier`. DB/API/security/tests: none. Accept: `npm install` clean, lockfile committed.
2. **0.2 Env validation.** Files: `src/lib/env.ts`, `.env.example` (verify). Zod-splits server vs `NEXT_PUBLIC_*`; fail fast. Security: no secrets client-side. Tests: unit — missing-var error, public-secret rejection. Accept: app boots with example-missing error message listing vars.
3. **0.3 DB connection.** Files: `src/lib/db.ts` (cached Mongoose, server-only). DB: none (connection only). Tests: integration connect/disconnect. Accept: health check queries DB ping in dev.
4. **0.4 Structure + base UI.** Files: `src/{components,features,lib,models,schemas,types,hooks,utils,services}/`, `src/app/{error.tsx,loading.tsx,not-found.tsx}`, base `layout.tsx` (fonts, metadata), `globals.css` theme tokens (editorial playful-minimal). No business logic. Accept: build green, 404/error pages render.
5. **0.5 Config hardening.** Files: `next.config.ts` (Cloudinary `remotePatterns`, security headers incl. CSP allowing Razorpay/Cloudinary/GA, HSTS), `src/proxy.ts` (Next 16 proxy convention; placeholder passthrough). Security: headers verified. Tests: header assertions (e2e smoke). Accept: Lighthouse/security-headers spot check.
6. **0.6 Test harness.** Files: `vitest.config.ts`, `playwright.config.ts`, `tests/setup.ts`, `tests/fixtures.ts`. Accept: `npm test` + `test:e2e --list` run (zero specs allowed, harness green).
7. **0.7 Health + logging utils.** Files: `src/app/api/health/route.ts`, `src/lib/logger.ts` (sanitized JSON), `src/lib/errors.ts` (AppError + envelope). Tests: health 200, envelope shape. Accept: gates scripted.

Exit criteria: lint+typecheck+test+build green on shell. Docs: CHANGELOG Phase-0 entry.

## Phase 1 — Authentication & Users

Dependencies: Phase 0. DB: `users` (+ Auth.js `accounts/sessions`), indexes (`email` unique). API: Auth.js routes; `GET /api/account/me` (optional). Files: `src/lib/auth.ts`, `src/models/User.ts`, `src/app/account/*`, `src/proxy.ts` (route guards), seed script `scripts/seed-admin.ts` (one-time, `ADMIN_SEED_EMAIL`). Security: role default CUSTOMER; admin checks server-side; session cookies secure. Tests: unit (role default), integration (find-or-create idempotent, admin guard 403 matrix), e2e (mocked Google login → account). Accept: ACCEPTANCE_CRITERIA auth boxes.

## Phase 2 — Catalog (Categories + Products) — DONE 2026-09-19

Dependencies: Phase 1 (admin role). DB: `categories`, `products` + indexes (slug/sku unique, categoryId, isPublished, text). API: `GET /api/products`, `GET /api/products/:slug`, `GET /api/categories`, admin CRUD/duplicate/bulk. Files: models, `schemas/product.ts`, `services/product-service.ts`, shop pages, product detail (gallery/variants/SEO/JSON-LD), admin product UI, Cloudinary signed-upload API. Security: unpublished → 404 public; admin-only writes; upload auth + file-type/size limits. Tests: slug/sku uniqueness, visibility matrix, pagination caps, image validation. Accept: product boxes.

## Phase 3 — Cart / Wishlist / Search — DONE 2026-09-19

Dependencies: Phase 2. DB: `carts`, `wishlists` (userId unique). API: cart CRUD + `POST /api/cart/merge`; wishlist CRUD + move-to-cart; search via `GET /api/products?q=` (+ `/api/search` alias). Files: guest cart lib (localStorage), cart drawer/page, wishlist page, shop filters/sort, related + recently-viewed. Security: server revalidates stock/publish; merge caps at stock; search `q` length-capped + sanitized; rate limits. Tests: merge conflicts, stock caps, unpublished rejection, wishlist sync. Accept: cart boxes.

## Phase 4 — Checkout & Payments (highest risk) — DONE 2026-09-19 (live test-mode rupee flow = manual gate before Phase 5)

Dependencies: Phases 1–3. DB: `orders`, `payments`, `inventoryTransactions`, `couponRedemptions` (new — audit §5), `settings` (shipping fees). API: addresses CRUD, `POST /api/coupons/validate`, `POST /api/orders`, `POST /api/payments/create`, `POST /api/payments/verify`, `POST /api/webhooks/razorpay`. Files: checkout wizard (address/delivery/payment/confirm), Razorpay Checkout integration, order service (server totals), inventory reserve→sale logic, webhook handler (raw-body verify, event dedupe). Security: HMAC both paths, idempotency (unique razorpay ids), never client amounts, reservation TTL + release job. Tests: full matrix — signature mismatch, double-verify, webhook replay, failed payment, refund-restock, coupon edges, invalid transitions. Accept: checkout/payment/order-inventory boxes. GATE: real test-mode rupee flow before Phase 5.

## Phase 5 — Orders (customer + admin) — DONE 2026-09-19

Dependencies: Phase 4. DB: order timeline appends. API: `GET /api/orders`, `GET /api/orders/:id`, `POST /api/orders/:id/cancel`, admin list/status/refund. Files: account orders UI, tracking timeline, admin orders UI. Security: ownership scoping (IDOR tests), admin-only transitions, valid-state machine. Tests: cancel-restore stock, forbidden cross-user reads, invalid transitions. Accept: orders boxes.

## Phase 6 — Reviews & Coupons Admin — DONE 2026-09-19

Dependencies: Phases 2 + 5 (verified purchase needs PAID orders). DB: `reviews` (+ compound unique), `coupons` (+ redemptions). API: review CRUD + moderation; coupon admin CRUD. Files: review form/list, rating aggregates (denormalized), admin coupon/review UIs. Security: verified-purchase server-computed, moderation auth, coupon atomic `$inc` + limits, rate limits. Tests: unverified→no badge, duplicate review rejected, coupon exhaustion under concurrency. Accept: review/coupon behavior.

## Phase 7 — Notifications (Resend) — DONE 2026-09-19

Dependencies: Phases 4–5. DB: `notifications` log. Files: `src/lib/email.ts` + templates (welcome, confirmation, payment, shipped, out-for-delivery, delivered, cancel, refund), triggers in order/payment services, retry on failure. Security: no PII beyond necessary; no secrets in templates. Tests: payload snapshots, status transitions emit exactly one email each (idempotent on retry). Accept: all lifecycle emails deliver to test mailbox with correct amounts.

## Phase 8 — SEO + Analytics + Content — DONE 2026-09-19

Dependencies: Phases 2–5. Files: metadata templates, `sitemap.ts`, `robots.ts`, JSON-LD components, `src/lib/analytics.ts` + event call-sites, admin banners/collections CRUD, static pages (about/contact/faq/policies), newsletter endpoint + storage. Security: newsletter rate-limit + consent; contact spam controls. Tests: sitemap/robots snapshots, metadata assertions, GA event unit tests (mocked), newsletter validation. Accept: §7 additions (separate audit checklist).

## Phase 9 — Testing & Hardening Sprint — DONE 2026-09-19

Full matrix from TESTING.md + audit §9; rate-limit backend decision (Upstash vs in-memory) implemented; CSP tightened; admin audit log verified; performance (LCP/CLS/INP) + a11y (keyboard checkout, Lighthouse ≥90) measured and fixed.

## Phase 10 — Production Launch — CODE DONE 2026-09-19 (owner gates: credentials, deploy, Gate A + B in docs/PRODUCTION_LAUNCH.md)

Per DEPLOYMENT.md checklist: Atlas prod, Vercel envs, OAuth prod callback, Razorpay live + webhook, Cloudinary prod, Resend domain, custom domain + HTTPS, Search Console + GA verification, monitoring, seed ADMIN then remove seed path, tag `v1.0.0` + CHANGELOG.

---

## Cross-cutting Rules (all phases)

- Files affected listed per task in PRs; smallest correct change; one concern per commit (`feat/fix/refactor/test/docs/chore`).
- Every API: Zod validate → auth → authorize (role + ownership) → logic → envelope response → sanitized log.
- Money integers (rupees; paise at Razorpay edge). Stock: available = stock − reserved; append-only transactions.
- Never: client prices/totals/roles/payment claims; `any`; secrets in client/logs/DB; full-catalog loads (paginate, cap limits).
