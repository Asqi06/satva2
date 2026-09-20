# Logging

Structured server-side logging. No secrets, ever.

---

# What to Log

- Request: method, route, status, duration, user id (if auth), order/payment ids, coupon code, event ids.
- Domain events: order created/paid/cancelled, stock transitions, admin actions (who/what/when), email queued/sent/failed, webhook received/verified/duplicate.

# Never Log

Passwords, OAuth tokens/secrets, API keys, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, card data, full `razorpay_signature`, session cookies, `AUTH_SECRET`, `CLOUDINARY_API_SECRET`, `RESEND_API_KEY`, full addresses (log pincode/city only unless debugging with consent).

---

# Format

JSON lines in production (`{ level, msg, route, userId?, orderId?, durationMs }`). `debug/info/warn/error` levels; `error` includes sanitized `code` (see ERROR_HANDLING.md), never stack to client (stack in server logs only).

# Retention

Vercel logs default; promote to Sentry/log-drain before launch if order volume justifies it.
