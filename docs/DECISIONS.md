# Architecture Decision Records

## ADR-001 — Next.js full-stack

Decision: use Next.js (App Router) as the full-stack framework (Server Components + Route Handlers + Server Actions where apt).

Reason: the project does not initially require a separate backend service; keeps commerce logic co-located and deployable to Vercel.

## ADR-002 — MongoDB Atlas + Mongoose

Decision: MongoDB Atlas with Mongoose ODM.

Reason: catalog and e-commerce entities (products, variants, carts, orders with snapshots) map naturally to documents; Atlas text indexes cover MVP search; Atlas Search later for fuzzy.

## ADR-003 — Google OAuth via Auth.js

Decision: Google OAuth as primary auth via Auth.js.

Reason: low-friction for the 14–30 audience; no password storage in MVP; extensible to credentials later.

## ADR-004 — Razorpay

Decision: Razorpay for payments (Orders API + Checkout + webhooks).

Reason: primary provider for Indian market (UPI/cards/netbanking/wallets); test mode supports pre-launch verification.

## ADR-005 — Cloudinary

Decision: Cloudinary for image/video storage + transformations.

Reason: product photography needs reliable storage, responsive variants, and signed server-side uploads; MongoDB stores URLs/metadata only.

## ADR-006 — Vercel hosting

Decision: deploy to Vercel.

Reason: natural Next.js target (previews, analytics, HTTPS, edge/static balance).

## ADR-007 — Resend for email

Decision: Resend for transactional email.

Reason: simple API for welcome/order/payment/shipping lifecycle emails; domain verification for deliverability.

## ADR-008 — Money as integer rupees

Decision: store/display money as integer rupees; convert to paise (×100) only in Razorpay calls.

Reason: catalog prices are whole rupees; avoids float errors while keeping Razorpay compatibility. Revisit if sub-rupee pricing ever appears.

## ADR-009 — Phase 0 dependency pins (2026-09-19)

Decision: `next-auth@beta` (v5 line, per constitution) with `mongodb@^6` (required by `@auth/mongodb-adapter` peer range; matches Mongoose 8's driver); `@types/node@^22` (required by Vitest 5 peer range; runtime is Node 22).

Reason: `next-auth@^5` does not exist on npm stable (`latest` is 4.x, v5 is `beta` tag). Pinned via lockfile; re-evaluate when Auth.js v5 goes stable.

## ADR-010 — Lazy env validation

Decision: env validation runs on function call (`requireServerVar`/`getServerEnv`), never at module scope, so `next build` and `/api/health` stay green without secrets. Feature entry points fail fast with value-free errors.

Reason: build-time/prerender evaluation would otherwise require production secrets in CI. Documented in `src/lib/env.ts`.

## ADR-011 — force-dynamic on session routes (2026-09-19)
Decision: every route calling `auth()` (`/account/*`, `/api/account/*`, auth handlers) exports `dynamic = "force-dynamic"`.

Reason: prerendering a session-dependent page evaluates `auth()` at build time, which correctly throws without secrets and fails the build. Dynamic rendering keeps builds secret-free and is semantically right (per-user content is never static).

## ADR-012 — E2E against throwaway in-memory Mongo (2026-09-19)

Decision: `scripts/e2e-dev.mjs` boots Next dev alongside a `mongodb-memory-server` instance; Playwright targets it. E2E covers DB-backed routes with real queries and zero shared state.

Reason: dummy/unreachable Mongo made DB routes 500 in E2E (and masked a real `error.tsx` html/body nesting bug). Seeded fixtures deferred to Phase 9 hardening.

## ADR-013 — Guest snapshot pricing + test seed endpoint (2026-09-19)

Decision: guest bag lines carry price/name/image snapshots (display-only); the server never trusts them — checkout recalculates from products (Phase 4). E2E seeding goes through `POST /api/test/seed`, which 404s in production and requires `E2E_SEED_SECRET` otherwise.

Reason: snapshots keep the guest bag renderable offline with zero extra APIs; the seed endpoint unlocks deterministic cart/checkout/orders E2E without shipping fixtures or weakening prod.

## ADR-014 — Checkout concurrency + cancel scope (2026-09-19)

Decision: conditional `$inc` reservation (single winner per stock unit); atomic coupon reserve at order creation, released on cancel/expiry, redemption recorded at PAID; settle via compare-and-set PENDING → PAID shared by verify + webhook; customer cancel allowed from PENDING only (CONFIRMED+ goes through support/admin in Phase 5); TTL sweep runs lazily at order creation (dedicated cron in Phase 10).

Known residual: per-variant reserved tracking (variant stock checked, not held — concurrent variant oversell possible under race; product-level hold bounds it); coupon validate-then-reserve gap closed by the atomic reserve filter; client double-submit guarded by UI busy state (server idempotency keys deferred to Phase 9).

## ADR-015 — Cancel/refund model (2026-09-19)

Decision: customers cancel PENDING orders only; admins cancel unpaid orders (PENDING/CONFIRMED/PROCESSING/PACKED) with clamped hold-release; PAID orders never cancel — they refund in full via Razorpay, then restock. Status machine enforced server-side; terminal states immutable (DELIVERED → RETURNED excepted).

## ADR-016 — Reviews policy (2026-09-19)

Decision: one review per (product, user) with owner edits; Verified Purchase computed server-side from PAID orders containing the product; display names masked (first + last initial); hidden reviews excluded everywhere including aggregates; review routes use product slugs for URL consistency (`:slug`, not API.md's `:id`).

## ADR-017 — Email delivery model (2026-09-19)

Decision: order-flow sends are awaited (correctness over latency; helpers never throw); welcome is fire-and-forget; one immediate retry then FAILED; expiry-sweep cancellations stay silent; `EMAIL_FROM` overrides the Resend test sender (production needs a verified domain per DEPLOYMENT.md).

## ADR-018 — Phase 8 content calls (2026-09-19)

Decision: curated collections stay tag-based (`?collection=` matches tags; no collections model until merchandising demands it); rate limiting is in-memory per instance (distributed limiting in Phase 9+); GA4 runs without a consent banner (no ads, no remarketing, no PII — revisit with legal if that changes); no COD anywhere (MVP is prepaid Razorpay only).

## ADR-019 — Hardening calls (2026-09-19)

Decision: in-memory sliding-window limits stay (no new infra for MVP traffic; Upstash iff multi-instance deploy); audit logging never blocks the admin action it records; dashboard counts PAID-only sales on UTC days; review photos capped at 4 via member uploads.
