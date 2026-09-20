# API Contracts (request/response shapes)

Envelope: success `{ success: true, data }`; error `{ success: false, error: { code, message, details? } }`. See `API.md` (routes) + `ERROR_HANDLING.md` (codes).

## Conventions

- Auth: session cookie; admin endpoints 403 for non-admins.
- Pagination: `?page=&limit=` → `{ items, page, limit, total, totalPages }`.
- Money: integer rupees in API; paise only inside Razorpay payload (server-side).
- Idempotency: `POST /api/payments/verify` + webhooks safe to retry (unique razorpay ids + event-id log).

## Examples

Create cart item:

```json
POST /api/cart/items
{ "productId": "64f...", "variantSku": "RING-S-001", "quantity": 2 }
→ 200 { "success": true, "data": { "items": [], "subtotal": 598 } }
```

Validate coupon:

```json
POST /api/coupons/validate
{ "code": "WELCOME10", "cartValue": 999 }
→ 200 { "success": true, "data": { "valid": true, "discount": 100 } }
→ 200 { "success": true, "data": { "valid": false, "reason": "MIN_ORDER_VALUE" } }
```

Verify payment:

```json
POST /api/payments/verify
{ "razorpayOrderId": "order_...", "razorpayPaymentId": "pay_...", "razorpaySignature": "..." }
→ 200 { "success": true, "data": { "orderId": "64f...", "paymentStatus": "PAID" } }
→ 402 { "success": false, "error": { "code": "PAYMENT_ERROR", "message": "Signature mismatch" } }
```

Admin guard failure: `403 { success: false, error: { code: "FORBIDDEN", message: "Admin access required" } }`.
