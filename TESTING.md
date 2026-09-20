# Testing Strategy

## Unit Tests (Vitest)

Test pure logic:

- price calculations (subtotal, discount, shipping, tax, total)
- coupon calculations (percentage caps, fixed, min-order, expiry, scoping)
- inventory math (available = stock − reserved; reserve/release/sale/restock)
- order total server-calculation
- Zod validation schemas (address, product, coupon, review)
- slug generation, pagination helpers

No DB, no network. Fast, deterministic.

## Integration Tests (Vitest + in-memory MongoDB or test Atlas)

Test:

- authentication (session creation, role assignment, admin guard)
- database operations (product CRUD, unique slug/sku enforcement)
- cart (add/update/remove, stock revalidation, guest merge)
- order creation (server totals, coupon application)
- payment verification (valid/invalid/duplicate signatures; webhook idempotency)
- inventory transitions on order/cancel/refund

Tests must not depend on production data. Seed fixtures per test, clean up after.

## E2E Tests (Playwright)

Critical flows:

1. Customer login (Google — mocked OAuth in test)
2. Browse product
3. Add product to cart
4. Checkout (address + coupon)
5. Payment (mocked Razorpay success + failure)
6. Order confirmation + tracking view
7. Admin login → product creation
8. Inventory update reflected on storefront
9. Order status update → customer sees timeline
10. Review submission (verified purchase)

## Test Rule

No critical business logic without tests. Failing tests block phase completion.

## Commands

```bash
npm test            # unit + integration (vitest run)
npm run test:e2e    # playwright
npm run test:coverage
```
