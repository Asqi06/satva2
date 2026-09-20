# Acceptance Criteria

## Authentication

- [ ] User can authenticate using Google.
- [ ] User receives a valid session.
- [ ] New users are created with role CUSTOMER; existing users are not duplicated (email unique).
- [ ] Normal users cannot access admin routes/APIs (403 + redirect).

## Products

- [ ] Published products appear publicly; unpublished return 404 publicly but are visible in admin.
- [ ] Product URLs use slugs (`/products/<slug>`).
- [ ] Stock displayed accurately (available = stock − reserved).

## Cart

- [ ] Customer can add/change-quantity/remove; server validates existence, publish state, stock.
- [ ] Guest cart merges into account cart on login without duplication.

## Checkout & Payments

- [ ] Valid address required (pincode/phone validated).
- [ ] Server calculates final price; coupon validated server-side.
- [ ] Razorpay signature verified server-side; webhook signature verified; retries idempotent.
- [ ] Failed payment never yields a PAID order.

## Orders & Inventory

- [ ] Successful payment creates exactly one PAID order (no duplicates on retry).
- [ ] Inventory decremented on sale, restored on cancel/refund.
- [ ] Customer sees accurate timeline; admin transitions restricted to valid states.

## Admin

- [ ] Only admins access admin APIs (server-side check).
- [ ] Admin can manage products/inventory/orders/coupons/reviews/customers/content.

## Quality Gates

- [ ] `lint`, `typecheck`, `test`, `build` green per phase. No critical logic without tests.
