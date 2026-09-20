# SatvaStones Product Requirements Document

## 1. Product

SatvaStones is a D2C jewellery e-commerce platform.

Brand positioning: Korean, Western, Gen-Z and Pinterest-inspired aesthetic jewellery for Indian customers (rings, bracelets, necklaces, pendants, earrings, oxidised jewellery, gift hampers). Premium-looking but accessible. Audience roughly 14–30-year-old Indian consumers.

The website is a complete e-commerce platform, not a showcase. No "DM us to order".

## 2. Objective

Allow customers to discover, purchase and manage jewellery orders online.

Provide administrators with complete control over products, inventory, orders and customers.

---

# 3. Users

## Customer

Customers can:

- Browse products
- Search products
- Filter products
- View products
- Add products to cart
- Wishlist products
- Checkout
- Login with Google
- Manage addresses
- Pay online
- Track orders
- Review purchased products

## Admin

Administrators can:

- Manage products
- Manage categories
- Manage inventory
- Manage orders
- Manage customers
- Manage coupons
- Moderate reviews
- View analytics

---

# 4. Customer Features

## Authentication

Google OAuth (primary, via Auth.js). Optional future: email + password.

## Product Discovery

Customers can:

- Browse categories
- Search products (name, category, tags, description, SKU)
- Filter products (category, price, material, color, availability, collection, rating, discount)
- Sort products (featured, newest, price low→high, price high→low, best selling, highest rated)
- View product details

## Cart

Customers can:

- Add products (with variants)
- Remove products
- Change quantity
- Move to wishlist
- Apply coupons
- View subtotal / shipping / totals
- Guest cart in localStorage, merged on login; logged-in cart persisted in MongoDB

## Checkout

Multi-step: Browse (guest allowed, cart in localStorage) → Login with Google (required before payment — guest checkout is not offered; guest cart merges on login) → Address → Delivery → Payment (Razorpay: UPI, cards, netbanking, wallets) → Order confirmation.

## Orders

Customers can:

- View orders
- View order details
- Track status (timeline: Pending → Payment Confirmed → Processing → Packed → Shipped → Out for Delivery → Delivered; plus Cancelled / Refunded / Returned / Failed)
- Cancel eligible orders
- View payment information

## Wishlist

Customers can:

- Add products
- Remove products
- Move products to cart
- Sync across devices after login (requires auth)

## Reviews

Customers can review products they purchased. Verified Purchase label only for actual purchasers. Admin moderation.

---

# 5. Admin Features

## Product Management

Admin can: create, edit, delete, duplicate, publish/unpublish, update stock/price, add images/variants, assign categories/tags. Bulk: price update, stock update, delete, publish.

## Inventory

Admin can: view stock, modify stock, set low-stock threshold, view stock history. Order placement decrements available stock; cancellation/refund restores it.

## Orders

Admin can: view orders, update order status, cancel orders, process refunds, view payment status.

## Coupons

Admin can: create, edit, disable, delete coupons (percentage / fixed, min cart value, max discount, product/category scoping, first-order-only, usage limits, expiry).

## Homepage / Content

Admin can manage banners, featured categories, collections (e.g. Navratri Collection, Everyday Essentials, Pinterest Edit, Gift Edit), offers.

---

# 6. Non-functional Requirements

The application must be:

- Secure
- Responsive
- Accessible
- SEO-friendly
- Type-safe
- Maintainable
- Production deployable

Design direction: bold and beautiful, playful-minimal and editorial. No generic AI-slop sections. Business requirements must never depend on visual styling.

---

# 7. MVP (Milestones — not to be confused with DEVELOPMENT_PLAN.md build Phases 0–10)

Milestone M1 (launch MVP; built across Phases 0–8, hardened in Phase 9, shipped in Phase 10):

- Google authentication
- Product catalog
- Categories
- Search
- Product pages
- Cart
- Checkout
- Razorpay
- Orders
- Customer account
- Admin dashboard
- Inventory
- Cloudinary
- Email notifications

Milestone M2: Wishlist, Reviews, Coupons, Advanced search, Analytics dashboard, Recommendations, Shipping API, Abandoned-cart recovery.

Milestone M3: WhatsApp automation, Loyalty, Referrals, Gift cards, Personalized recommendations, AI support, Advanced CRM.

---

# 8. Future Features

- WhatsApp notifications
- Loyalty system
- Referral program
- Gift cards
- AI customer support
- Advanced recommendations
- Abandoned-cart recovery
