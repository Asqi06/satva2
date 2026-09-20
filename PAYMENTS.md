# Razorpay Payment Architecture

Never trust payment information received from the browser. The server is the authority on amounts, order state, and payment success.

---

# Flow

```text
Customer (checkout)
↓ selects address + coupon
Server calculates order (subtotal, discount, shipping, tax, total)
↓
Server creates Razorpay order (amount in paise, receipt = local order id)
↓
Browser opens Razorpay Checkout (key = NEXT_PUBLIC_RAZORPAY_KEY_ID)
↓
Customer pays (UPI / card / netbanking / wallet)
↓
Razorpay returns { razorpay_order_id, razorpay_payment_id, razorpay_signature }
↓
Browser POSTs to /api/payments/verify
↓
Server verifies HMAC-SHA256("orderId|paymentId", RAZORPAY_KEY_SECRET)
↓ valid → Order PAID → inventory SALE finalized → confirmation email
↓ invalid → 402 PAYMENT_ERROR, order stays PENDING/FAILED
```

Webhooks (`/api/webhooks/razorpay`, verified with `RAZORPAY_WEBHOOK_SECRET` on raw body) handle async settlement: `payment.captured` → ensure PAID (idempotent); `payment.failed` → mark FAILED; refunds → REFUNDED + restock.

---

# Important Rules

- The server calculates subtotal, discount, shipping, tax, total. Never accept the final amount from the frontend.
- Amounts to Razorpay in paise (integer). Local totals in rupees (integers; no fractional paise for this catalog).
- Idempotency: unique index on `razorpayOrderId` + processed webhook event ids. Retried verify/webhook must not double-create orders, double-charge, or double-decrement stock.
- Never store card/CVV; never log full signatures or secrets.
- Test mode keys for dev; production keys only in Vercel prod env + Razorpay dashboard webhook configured.
