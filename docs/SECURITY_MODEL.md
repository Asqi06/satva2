# Security Model

Threats: price tampering, payment forgery, privilege escalation, IDOR (user A reading user B's orders), injection (MongoDB/regex), XSS (reviews/addresses), coupon abuse, webhook spoofing, secret leakage, admin takeover.

## Controls

| Threat | Control (spec ref) |
|---|---|
| Price/total tampering | Server recalculates all totals; client amounts ignored (PAYMENTS.md, API.md) |
| Fake "paid" claims | HMAC verify + webhook verify before PAID; frontend state never trusted (PAYMENTS.md) |
| Webhook spoof/replay | `RAZORPAY_WEBHOOK_SECRET` on raw body; event-id dedupe (PAYMENTS.md) |
| Privilege escalation | Roles server-side; seed-only ADMIN; no self-grant endpoint (AUTH.md) |
| IDOR | All user queries scoped by `session.user.id`; admin bypass explicit (AUTH.md, API.md) |
| Injection | Zod validation + parameterized Mongoose; no `$where`/raw interpolation (SECURITY.md) |
| XSS | No user HTML; sanitize URLs; `alt` required (SECURITY.md) |
| Coupon abuse | Server validation, usage counters (atomic `$inc` with limit check), rate limits (API.md) |
| Brute force / scraping | Rate limits on auth/coupon/review/checkout/search (SECURITY.md) |
| Secret leak | Server-only env, no `NEXT_PUBLIC_` secrets, no secrets in logs/DB/client (ENVIRONMENT.md, LOGGING.md) |

## Boundaries

- Trust boundary: browser ↔ server. Everything from the client is untrusted.
- Security boundary enforcement lives in route handlers/services, not middleware alone (defense in depth).
- Audit: admin mutations + payment events logged with actor + ids (LOGGING.md).
