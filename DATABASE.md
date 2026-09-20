# Database Specification

Database: MongoDB Atlas

ODM: Mongoose

Connection: single cached connection in `src/lib/db.ts` (server-only). All queries server-side.

---

# Collections

```text
users
accounts
sessions
verificationtokens (Auth.js, if adapter-managed)
products
categories
orders (order items embedded in orders; no separate orderitems collection)
carts
wishlists
reviews
coupons
couponredemptions (per-user redemption log; enforces perUserLimit)
inventorytransactions
payments
notifications
banners
settings
```

Authoritative source list (per AGENTS.md): users, products, categories, orders, inventory, reviews, coupons, addresses, wishlist, cart, payments. Addresses are embedded subdocuments in users (no top-level addresses collection). Auth.js collections (`accounts`, `sessions`) support Google OAuth. `banners`/`settings` support admin homepage content. Collection names use Mongoose lowercase-plural defaults.

---

# User

```text
_id
name
email (unique, indexed)
image
phone (optional, validated Indian format when present)
role: CUSTOMER | ADMIN (default CUSTOMER)
addresses: Address[]
emailVerified
createdAt
updatedAt
```

Address subdocument:

```text
_id
label (Home / Work)
fullName
phone
addressLine1
addressLine2 (apartment/flat, optional)
city
state
pincode (6-digit Indian)
landmark (optional)
isDefault
```

---

# Category

```text
_id
name
slug (unique, indexed)
description
image
parentId (optional, for subcategories)
isPublished
sortOrder
seo { title, description }
createdAt
updatedAt
```

---

# Product

```text
_id
name
slug (unique, indexed)
description
shortDescription
categoryId (ref Category, indexed)
subcategory (optional string)
images: [{ publicId, secureUrl, alt, width, height, isThumbnail }]
videos: [{ publicId, secureUrl }]
price (integer rupees; see ADR-008 in docs/DECISIONS.md — paise only at the Razorpay boundary)
compareAtPrice (optional, > price when discounted)
sku (unique, indexed)
variants: [{ sku, size, color, style, price, stock, image }]
material (e.g. alloy, stainless steel, oxidised silver)
color
size / dimensions / weight
tags: string[]
stock (available quantity)
reservedStock (transient holds during checkout)
soldQuantity
lowStockThreshold (default 5)
isPublished (indexed; unpublished invisible publicly)
isFeatured / isBestSeller flags (derived or manual for homepage)
seo { title, description, canonicalUrl, ogImage }
ratingAverage / ratingCount (denormalized from reviews)
createdAt
updatedAt
```

Image rule: never store binaries in MongoDB. Cloudinary only; MongoDB stores publicId + secureUrl + metadata.

---

# Cart

```text
_id
userId (unique when logged in; guest carts live in localStorage, merged on login)
items: [{ productId, variantSku?, quantity, priceAtAdd, addedAt }]
couponCode (optional)
updatedAt
```

Server revalidates price/availability on every checkout; `priceAtAdd` is display-only.

---

# Wishlist

```text
_id
userId (unique)
productIds: ObjectId[]
updatedAt
```

---

# Order

```text
_id
userId (ref User, indexed)
items: [{ productId, variantSku?, name, image, quantity, unitPrice, totalPrice }]
shippingAddress (snapshot copy at purchase time)
subtotal
discount
shipping
tax (0 initially unless GST rules added; must be explicit in code)
total (server-calculated)
couponCode (optional)
paymentStatus: PENDING | AUTHORIZED | PAID | FAILED | REFUNDED (indexed)
orderStatus: PENDING | CONFIRMED | PROCESSING | PACKED | SHIPPED | OUT_FOR_DELIVERY | DELIVERED | CANCELLED | RETURNED | REFUNDED (indexed)
razorpayOrderId
razorpayPaymentId (after verify)
razorpaySignature (not stored long-term; verify then discard or store hashed — prefer discard)
timeline: [{ status, at, note }]
createdAt (indexed)
updatedAt
```

Idempotency: unique index on `razorpayOrderId` (sparse) and on `razorpayPaymentId` (sparse) to prevent duplicate paid orders from retried webhooks.

---

# Payment

```text
_id
orderId (ref Order)
provider: RAZORPAY
razorpayOrderId
razorpayPaymentId
amount
currency (INR)
status
webhookEventIds: string[] (processed event ids for idempotency)
rawPayload (sanitized — never card/CVV secrets)
createdAt
updatedAt
```

---

# Review

```text
_id
productId (ref Product, indexed)
userId (ref User, indexed)
orderId (ref Order, optional — proves purchase)
rating (1–5)
title
comment
images: [{ publicId, secureUrl }]
isVerifiedPurchase (true only if order containing product with PAID status exists)
isPublished (moderation flag; default true, admin can hide)
createdAt
updatedAt
```

Compound unique index `(productId, userId, orderId)` or `(productId, userId)` per policy (one review per product per user).

---

# Coupon

```text
_id
code (unique, uppercase, indexed)
type: PERCENTAGE | FIXED
value
minimumOrderValue
maximumDiscount (cap for percentage)
applicableProductIds / applicableCategoryIds (optional scoping)
firstOrderOnly
usageLimit (global)
usageCount
perUserLimit
expiresAt
isActive
createdAt
updatedAt
```

---

# InventoryTransaction

```text
_id
productId
variantSku (optional)
type: RESERVE | RELEASE | SALE | RESTOCK | ADJUSTMENT
quantity (signed)
orderId (optional)
reason
createdAt
```

Stock math: `available = stock - reservedStock`. Checkout reserves → payment success converts to SALE (decrement stock, decrement reserved) → cancel/refund RESTOCKs.

Example: `IVORY-EMBER-001 — Stock: 18, Reserved: 2, Available: 16, Threshold: 5`.

---

# Notifications

```text
_id
userId (optional)
type: ORDER_CONFIRMATION | PAYMENT | SHIPPED | DELIVERED | CANCELLATION | REFUND | WELCOME
channel: EMAIL (Resend; future: WHATSAPP)
to
subject
bodyRef / payload
status: QUEUED | SENT | FAILED
createdAt
```

---

# Banners / Settings

Banners: `{ _id, title, image, link, placement (hero/offers), sortOrder, isActive }`.
Settings: `{ _id: 'site', shippingFlatFee, freeShippingThreshold, announcementBar, ... }` — single-document pattern.

---

# Indexes

- Products: `slug` (unique), `sku` (unique), `categoryId`, `isPublished`, text index on `name/description/tags`
- Users: `email` (unique)
- Orders: `userId`, `createdAt`, `paymentStatus`, `orderStatus`, `razorpayOrderId` (unique sparse)
- Reviews: `productId`, `userId`, compound `(productId, userId)`
- Coupons: `code` (unique)
- Carts: `userId` (unique)
- Wishlists: `userId` (unique)

---

# Rules

- Never store secrets in MongoDB.
- Never construct queries from raw user input without validation/sanitization (injection protection).
- Paginate all list queries; never load full catalog into memory.
