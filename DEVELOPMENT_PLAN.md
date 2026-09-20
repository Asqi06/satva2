# Development Plan

Do not implement everything at once. Work phase-by-phase. Do not skip phases because implementation appears easy.

After every phase: typecheck, lint, test, build, update docs.

---

# Phase 0: Foundation (no business features)

- [ ] Initialize Next.js + TypeScript strict + ESLint + Tailwind (done: scaffold)
- [ ] `npm run typecheck` script (`tsc --noEmit`)
- [ ] Environment system (`.env.example`, `src/lib/env.ts` with Zod validation, server/client split)
- [ ] MongoDB connection (`src/lib/db.ts`, cached)
- [ ] Project structure (`components/`, `features/`, `lib/`, `models/`, `schemas/`, `types/`, `hooks/`, `utils/`, `services/`)
- [ ] Testing harness (Vitest + RTL + Playwright configs)
- [ ] Base layout, fonts, global styles, error/loading/not-found pages
- [ ] Health endpoint (`/api/health`)

Exit criteria: `lint + typecheck + test + build` green on empty shell.

---

# Phase 1: Authentication

- [ ] Auth.js + Google OAuth + MongoDB user store
- [ ] User model (role default CUSTOMER)
- [ ] Session handling, middleware, protected routes
- [ ] Account shell (`/account`)
- [ ] Seed script for first ADMIN (owner-only, documented)

Verify authentication before continuing.

---

# Phase 2: Products & Categories

- [ ] Category + Product models, indexes, slugs
- [ ] Product/category APIs (public reads, admin writes)
- [ ] Admin product management (CRUD, publish, duplicate, bulk)
- [ ] Shop listing (filters/sort/pagination), product detail page, SEO metadata

---

# Phase 3: Shopping (Cart / Wishlist / Search)

- [ ] Cart (server for auth users, localStorage for guests, merge on login)
- [ ] Wishlist (auth, sync)
- [ ] Search + filters + recommendations (related/recently-viewed)

---

# Phase 4: Checkout & Payments

- [ ] Address management
- [ ] Server-side order calculation + coupon validation
- [ ] Razorpay order creation → Checkout → signature verification → order PAID
- [ ] Webhook handler (idempotent)
- [ ] Inventory reserve → sale on success

---

# Phase 5: Orders & Admin Orders

- [ ] Customer orders (list/detail/timeline/cancel)
- [ ] Admin order management (status transitions, refunds, restock)

---

# Phase 6: Reviews & Coupons

- [ ] Reviews (verified purchase server-side, moderation)
- [ ] Coupons (admin CRUD + server validation at checkout)

---

# Phase 7: Notifications (Resend)

- [ ] Welcome, order confirmation, payment, shipped, out-for-delivery, delivered, cancellation, refund emails

---

# Phase 8: SEO + Analytics

- [ ] Metadata, sitemap, robots, JSON-LD, canonical URLs
- [ ] GA4 events (view_item, add_to_cart, begin_checkout, purchase, wishlist)
- [ ] Search Console verification

---

# Phase 9: Testing & Hardening

- [ ] Unit (pricing/coupons/inventory/validation), integration (auth/cart/orders/payments), E2E (10 critical flows)
- [ ] Rate limiting, security headers, audit of admin/payment paths

---

# Phase 10: Production

- [ ] Vercel + Atlas prod, env vars, Google OAuth prod callback, Razorpay live + webhook, Cloudinary prod, Resend domain, custom domain + HTTPS, sitemap/analytics verification, error monitoring

---

# RULE

After every phase: test, lint, typecheck, build, update documentation (incl. CHANGELOG.md). Never implement future-phase features while working on a phase.
