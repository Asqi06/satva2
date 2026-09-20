# Error Handling

Use a consistent JSON envelope. No stack traces, DB errors, secrets, or internals leak to clients.

Success:

```json
{ "success": true, "data": {} }
```

Failure:

```json
{
  "success": false,
  "error": { "code": "PRODUCT_NOT_FOUND", "message": "Product not found" }
}
```

---

# Error Categories (codes)

```text
VALIDATION_ERROR (400) — Zod failures; include field-level `details`
UNAUTHORIZED (401) — no/invalid session
FORBIDDEN (403) — authenticated but not allowed (non-admin on admin API, wrong owner)
NOT_FOUND (404)
CONFLICT (409) — duplicate slug/SKU/email, state-transition conflicts
PAYMENT_ERROR (402) — Razorpay failures, signature mismatch
RATE_LIMITED (429)
DATABASE_ERROR (500, generic message only)
INTERNAL_ERROR (500, generic message only)
```

---

# Rules

- Server logs full error (sanitized); client receives `code` + safe `message` only.
- Zod errors map to `VALIDATION_ERROR` with `details: [{ path, message }]`.
- Auth failures return 401/403 without revealing whether a resource exists (for private resources).
- Payment/webhook handlers log event ids + order ids, never secrets.
- Global `error.tsx` / `not-found.tsx` per route segment for UI-level failures.
