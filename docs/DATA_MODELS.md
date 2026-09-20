# Data Models (summary)

Full field specs: `DATABASE.md`. This file maps relationships.

```text
User 1──* Address (embedded)
User 1──1 Cart 1──* CartItem → Product (+ variantSku)
User 1──1 Wishlist ──* Product
User 1──* Order 1──* OrderItem → Product (+ variant snapshot)
User 1──* Review *──1 Product; Review ──0..1 Order (purchase proof)
Category 1──* Product (categoryId); Category self-parent for subcategories
Coupon ──* Order (couponCode + redemption counters)
Order 1──1 Payment (razorpay ids, idempotency keys)
Product 1──* InventoryTransaction
User 1──* Notification
Banner / Setting (site-wide content, no user FK)
Auth.js: Account/Session → User (OAuth linkage)
```

## Ownership & Cardinality Rules

- All user data scoped by `userId`; admin reads are global but audited.
- Order items snapshot product name/price/image at purchase (immune to later edits).
- One review per (product, user) — enforced by compound unique index.
- Coupon usage tracked globally (`usageCount`) + per-user where `perUserLimit` set.
- Inventory: `available = stock − reserved`; transactions append-only (no in-place history rewrites).
