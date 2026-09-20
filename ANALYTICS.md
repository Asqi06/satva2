# Analytics (GA4)

Use Google Analytics 4 (`NEXT_PUBLIC_GA_ID`). Load via `next/script` (afterInteractive), respect consent where required.

---

# Events

```text
page_view (automatic)
view_item — product detail view
search — query submitted
add_to_cart / remove_from_cart
begin_checkout
add_payment_info
purchase — PAID order (value, currency INR, items, coupon)
add_to_wishlist
```

---

# Rules

- Never send passwords, payment credentials, PII (email/phone/address), secret tokens, or full order payloads.
- Purchase event fires only after server-verified payment.
- Keep a typed analytics helper (`src/lib/analytics.ts`) — single call-site per event, no inline `gtag` sprawl.
