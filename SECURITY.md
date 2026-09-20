# Security Requirements

## Secrets

- Never commit secrets (`.env`, keys, credentials). Only `.env.example` is committed.
- Server-only secrets must never use `NEXT_PUBLIC_` prefix.
- Secrets used: `MONGODB_URI`, `AUTH_SECRET`, `GOOGLE_CLIENT_SECRET`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `CLOUDINARY_API_SECRET`, `RESEND_API_KEY`.

## Authorization

- Every privileged server operation verifies authorization (session + role + ownership).
- Admin routes/APIs require server-side `ADMIN` check.
- Ownership checks on all user-scoped reads/writes (`userId === session.user.id`).

## Input Validation

- Zod schemas for all external input (body, query, params).
- Reject unknown/oversized payloads; validate pincode/phone/slug/rating ranges.
- Never trust: client prices, totals, user IDs, payment status, inventory counts, permissions.

## Payments

- Never trust frontend payment state.
- `POST /api/payments/verify` checks HMAC-SHA256 (`razorpayOrderId|razorpayPaymentId` with `RAZORPAY_KEY_SECRET`).
- Webhooks verified with `RAZORPAY_WEBHOOK_SECRET` on raw body; idempotent processing.
- Server calculates subtotal/discount/shipping/tax/total.

## Database

- Validated, parameterized Mongoose queries only.
- Never interpolate raw user input into queries (`$where`, `$expr` forbidden with user data).
- Sanitize search input; cap regex length; use indexes + pagination.

## XSS / Output

- React escapes by default; sanitize user-generated HTML (reviews, addresses) — no `dangerouslySetInnerHTML` with user data.
- Validate image URLs (Cloudinary allowlist); `alt` text required.

## CSRF

- Auth.js handles OAuth state/CSRF; mutations require session; SameSite cookies.
- Webhook endpoint exempts CSRF but requires signature verification.

## Rate Limiting

Apply to: login/OAuth callbacks, coupon validation, reviews, checkout, payment create/verify, webhooks (generous), public search/products, newsletter.

## Admin

- No admin self-registration. Seeded/owner-granted only.
- Admin actions audit-logged (who, what, when).

## Headers / Transport

- HTTPS only in production. Secure cookies. `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`, least-privilege CSP (allow Razorpay/Cloudinary/GA domains).

## Logging

Never log: passwords, OAuth secrets/tokens, API keys, payment secrets, card data, full Razorpay signatures, session cookies.

See LOGGING.md for allowlisted fields.
