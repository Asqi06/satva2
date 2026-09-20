# Admin Flows

## Login

`/admin/login` (or shared login) → Google → server checks `role === ADMIN` → else 403 + redirect. No self-elevation path exists in UI or API.

## Dashboard

`/admin` → KPIs (total/today sales, orders, customers, AOV, products sold, low stock, pending) + charts (sales/orders over time, top products, category performance).

## Products

List (paginated, search) → create/edit → image upload → variants → validate → save → publish/unpublish/duplicate/delete; bulk actions with confirmation + audit log.

## Inventory

`/admin/inventory` → low-stock alerts → adjust stock/threshold → transaction history per SKU. Adjustments logged with reason.

## Orders

`/admin/orders` → filter by status → detail → valid status transitions only (e.g. CONFIRMED→PROCESSING→PACKED→SHIPPED→OUT_FOR_DELIVERY→DELIVERED; CANCELLED/REFUNDED restore stock) → refund triggers payment refund + email.

## Customers / Coupons / Reviews / Content

- Customers: list, view orders, disable (no delete of history).
- Coupons: create/edit/disable with rule preview + usage counts.
- Reviews: moderation queue (publish/hide).
- Banners/collections: hero, featured categories, collections, offers scheduling.
