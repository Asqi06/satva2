# User Flows

## Customer Purchase

```text
Homepage
↓
Category / Search
↓
Product
↓
Add to Cart (or Buy Now → Checkout)
↓
Cart (coupon, totals)
↓
Login (Google / Guest start)
↓
Address (select or add)
↓
Delivery (standard, fee, ETA)
↓
Razorpay payment
↓
Server verification
↓
Order Confirmation (order id, items, amounts, payment status, address, ETA)
↓
Order Tracking (/orders/:id timeline)
```

## Customer Authentication

```text
Login → Google → OAuth callback → find-or-create user (CUSTOMER)
→ session → Account (or resume checkout)
```

## Admin Product Creation

```text
Admin Login
↓
Admin Dashboard → Products
↓
Create Product → upload images (Cloudinary) → details/variants/price/stock/category/tags/SEO
↓
Zod validation → save draft → Publish → visible on storefront
```
