# API Specification

Base: Next.js Route Handlers under `src/app/api/`. REST-style JSON. Envelope:

Success: `{ "success": true, "data": ... }`
Error: `{ "success": false, "error": { "code": "...", "message": "..." } }` (see ERROR_HANDLING.md).

All APIs must: 1) validate input (Zod), 2) authenticate when required, 3) authorize, 4) execute logic, 5) return predictable response, 6) handle errors safely (no stack traces).

---

# Products (public)

```text
GET /api/products?category=&q=&minPrice=&maxPrice=&material=&color=&inStock=&collection=&minRating=&minDiscount=&sort=featured|newest|price-asc|price-desc|best-selling|rating&page=&limit=
→ 200 { products, pagination }

GET /api/products/:slug
→ 200 { product, related }
→ 404 PRODUCT_NOT_FOUND (unpublished products return 404 publicly)
```

---

# Categories (public + admin)

```text
GET /api/categories → 200 { categories }

POST /api/admin/categories (ADMIN) — { name, slug?, description?, image?, parentId?, isPublished? }
PATCH /api/admin/categories/:id (ADMIN)
DELETE /api/admin/categories/:id (ADMIN)
```

---

# Admin products

```text
GET /api/admin/products?q=&published=&page= (ADMIN table listing)
GET /api/admin/products/:id (ADMIN detail)
POST /api/admin/products (ADMIN)
PUT /api/admin/products/:id (ADMIN — full replacement)
DELETE /api/admin/products/:id (ADMIN)
POST /api/admin/products/:id/duplicate (ADMIN — unpublished copy)
POST /api/admin/products/bulk (ADMIN) — { action: publish|unpublish|delete|feature|unfeature, ids[] }
```

Validation: price ≥ 0 integers, compareAtPrice > price when present, stock ≥ 0, slug unique, category exists.

---

# Cart (auth required; guest uses localStorage + merge)

Server cart stores identity + quantity only; prices/availability enrich at read.

```text
GET /api/cart → 200 { items, count, subtotal, unavailableCount }

POST /api/cart/items — { productId, variantSku?, qty } → 201 { ...view, adjusted }
PATCH /api/cart/items/:key — { qty } (0 removes; quantities cap to stock)
DELETE /api/cart/items/:key
POST /api/cart/merge — { items[] } → { added, capped, dropped, cart }
```

Server revalidates product existence, publish state, stock.

---

# Wishlist (auth required)

```text
GET /api/wishlist → 200 { products }
POST /api/wishlist — { productId }
DELETE /api/wishlist/:productId
POST /api/wishlist/:productId/move-to-cart
```

---

# Orders (auth required)

```text
POST /api/orders — { addressId, couponCode? } → 201 { order, excluded }
  Creates PENDING order, reserves coupon + inventory, clears the bag.
GET /api/orders?page= → 200 { orders, pagination } (own orders only)
GET /api/orders/:id → 200 { order } (owner only — 404 otherwise)
POST /api/orders/:id/cancel — { reason? } (PENDING orders only; restores stock)
```

---

# Payments

```text
POST /api/payments/create — { orderId } → { razorpayOrderId, amount, currency, keyId }
POST /api/payments/verify — { razorpayOrderId, razorpayPaymentId, razorpaySignature }
  → verifies HMAC-SHA256 server-side, marks PAID, finalizes inventory, sends email. Idempotent.
POST /api/webhooks/razorpay — raw body + `x-razorpay-signature` verification with RAZORPAY_WEBHOOK_SECRET.
  Handles payment.captured / payment.failed / refund events. Idempotent via event id + payment id.
```

Never mark PAID from frontend state alone.

---

# Reviews (slug-based per ADR-016; product reads use slugs throughout)

```text
GET /api/products/:slug/reviews → 200 { reviews, average, count }
POST /api/products/:slug/reviews (auth) — { rating 1–5, title?, comment?, images? }
PATCH /api/reviews/:id (owner edits content)
DELETE /api/reviews/:id (owner or ADMIN)
PATCH /api/admin/reviews/:id (ADMIN moderation: { isPublished })
GET /api/admin/reviews?hidden=&page= (ADMIN queue)
POST /api/uploads (auth — review images, images-only)
```

`isVerifiedPurchase` set server-side (checks PAID order containing product).

---

# Coupons

```text
POST /api/coupons/validate (auth required — validated against the member's server bag)
  { code } → { valid, discount, reason?, subtotal }
POST /api/admin/coupons (ADMIN)
PATCH /api/admin/coupons/:id (ADMIN — code immutable)
DELETE /api/admin/coupons/:id (ADMIN — unused coupons only)
```

Rate-limited (10/min per user, Phase 9).

---

# Addresses (auth required)

```text
GET /api/addresses
POST /api/addresses
PATCH /api/addresses/:id
DELETE /api/addresses/:id
```

Validate pincode (6-digit), phone (Indian 10-digit).

---

# Admin

```text
GET /api/admin/dashboard → { totalSales, todaySales, orderCount, paidOrderCount, customerCount,
  avgOrderValue, productsSold, pendingOrders, lowStock, salesByDay, topProducts }
GET /api/admin/orders?orderStatus=&paymentStatus=&page= → paginated all orders + customer emails
GET /api/admin/orders/:id → { order }
PATCH /api/admin/orders/:id — { orderStatus, note? } (strict machine; CANCELLED delegates to cancel)
POST /api/admin/orders/:id/cancel — unpaid orders (hold-releasing)
POST /api/admin/orders/:id/refund — PAID orders (Razorpay full refund + restock)
GET /api/admin/banners / POST /api/admin/banners (ADMIN homepage hero)
PATCH /api/admin/banners/:id / DELETE /api/admin/banners/:id
```

All `/api/admin/*` require server-side ADMIN check; every mutation writes an audit log row. Customer/inventory-detail endpoints remain future work.

---

# Misc

```text
GET /api/account/me → { id, name, email, image, role } (401 when logged out)
GET /api/settings → { freeShippingThreshold, shippingFlatFee, announcement }
GET /api/search?q= → lightweight alias of GET /api/products?q=
POST /api/newsletter — { email, name? } (honeypot + 5/min IP limit, idempotent)
POST /api/contact — { name, email, topic?, message } (honeypot + 3/min IP limit)
POST /api/uploads (auth — review images, images-only, 20/min per user)
POST /api/admin/uploads (ADMIN — product/banner media)
GET /api/health → { ok: true } (for monitoring; no secrets)
POST /api/test/seed (test-only: prod-404, E2E_SEED_SECRET gate)
```
