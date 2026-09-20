# Authentication

Provider: Google OAuth

Library: Auth.js (NextAuth v5)

Adapter: MongoDB adapter (Auth.js) sharing the `users` collection with the Mongoose `User` model. Sessions use the JWT strategy (stateless); the adapter persists OAuth account linkage. Roles are injected into token/session server-side via `src/lib/auth.ts` callbacks + `src/services/user-service.ts`.

---

# Authentication Flow

```text
User clicks "Continue with Google"
↓
Google OAuth consent
↓
OAuth callback (/api/auth/callback/google)
↓
Auth.js verifies tokens
↓
Find user by email → create (role CUSTOMER) if new
↓
Create session (secure HTTP-only cookie)
↓
Redirect to app (account / checkout resume)
```

---

# Roles

```text
CUSTOMER — default for every new user
ADMIN — granted manually (seed script / direct DB update by owner; never self-grantable)
```

- Authentication ≠ authorization. Being logged in grants zero admin rights.
- Admin check is server-side on every admin route + admin API (`session.user.role === 'ADMIN'` from trusted session, never from client payload).
- Never trust client-side `isAdmin`, hidden fields, or localStorage flags.

---

# Protected Routes (proxy guards + server checks)

```text
/login       — public (Google entry; Auth.js pages.signIn target)
/cart        — public (guest local bag, member server bag)
/account/*   — any authenticated user (else redirect /login)
/wishlist     — authenticated user (else redirect /login; guests redirect from toggle)
/checkout    — guest may browse/start; login required before payment (no guest checkout)
/orders/*    — owner or ADMIN (account history + tracking live)
/admin/*     — ADMIN only: unauthenticated → /login, non-admin → /account
/api/account/*, /api/orders/*, /api/cart, /api/wishlist — session required (401 JSON)
/api/admin/* — ADMIN only (403 JSON)
```

Proxy (`src/proxy.ts`, edge-safe JWT read) enforces redirects; pages/APIs re-verify (proxy is UX, not security boundary).

---

# First ADMIN Bootstrap

No self-registration path exists. Owner flow:

1. Sign in with Google once (creates the CUSTOMER row).
2. Run `ADMIN_SEED_EMAIL=you@example.com npm run seed:admin`.
3. Unset `ADMIN_SEED_EMAIL`.

The script refuses missing users and never touches other rows. See `scripts/seed-admin.ts`.

---

# Authorization Matrix

Customer can access only their own: orders, addresses, wishlist, cart, reviews, profile.

Admin can: manage products/categories/inventory/orders/users/coupons/reviews/banners/settings + view dashboard.

Users must never access another user's private data (always scope queries by `session.user.id` unless ADMIN).

---

# Session / Cookies

- `AUTH_SECRET` signs sessions; secure, HTTP-only, SameSite=Lax cookies.
- HTTPS enforced in production (Vercel default).
- Never log tokens, secrets, or session values.

---

# Future

Optional email+password (Credentials provider + hashing) may be added later. No password storage until then.
