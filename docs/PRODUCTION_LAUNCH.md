# Production Launch Runbook (Phase 10)

Target: `https://satvastones.in` (or current prod domain) on Vercel + MongoDB Atlas.
Code status: all phases DONE, gates green. Everything below the line needs
owner credentials — nothing here can run without them.

---

## 1. Accounts & services (owner)

- [ ] MongoDB Atlas: M10+ cluster (or serverless), database user with read/write
      on one database only, IP access list (Vercel IPs / 0.0.0.0 behind VPC peering
      per your plan), automated backups on.
- [ ] Google Cloud Console: OAuth client (Web), authorized redirect URI
      `https://<domain>/api/auth/callback/google` (+ preview URLs if needed).
- [ ] Razorpay: live account, Key ID + Key Secret, webhook
      `https://<domain>/api/webhooks/razorpay` subscribed to
      `payment.captured`, `payment.failed`, `refund.processed`, webhook secret saved.
- [ ] Cloudinary: production cloud, signed-upload preset defaults (we upload
      server-side; no unsigned preset needed).
- [ ] Resend: sending domain verified, `EMAIL_FROM` set to it
      (e.g. `SatvaStones <orders@satvastones.in>`).
- [ ] Vercel: project linked, custom domain + HTTPS, cron enabled
      (sweep runs every 30 min — needs a plan that allows sub-daily crons,
      otherwise switch `vercel.json` to `0 * * * *` or daily).
- [ ] Google Analytics 4 property + Search Console site.

## 2. Environment (Vercel → Project → Settings → Environment Variables)

Production values for every var in `.env.example`, plus:

```text
MONGODB_URI=<atlas connection string>
AUTH_SECRET=<`npx auth secret` output — fresh, never reused from dev>
GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET=<prod OAuth client>
RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET=<LIVE keys>
RAZORPAY_WEBHOOK_SECRET=<webhook secret from Razorpay dashboard>
CLOUDINARY_*=<prod cloud>
RESEND_API_KEY=<live key>
EMAIL_FROM=SatvaStones <orders@satvastones.in>
CRON_SECRET=<openssl rand -hex 32>
NEXT_PUBLIC_APP_URL=https://<domain>
NEXT_PUBLIC_RAZORPAY_KEY_ID=<same live Key ID>
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=<prod cloud>
NEXT_PUBLIC_GA_ID=<G-XXXX>
```

Never set `E2E_SEED_SECRET` or `ADMIN_SEED_EMAIL` in production.

## 3. Deploy

```bash
npm run lint && npm run typecheck && npm test && npm run build
git add -A && git commit -m "chore: ..."   # repo currently untracked — init + first commit first
git tag v1.0.0
vercel --prod   # or push to main with Git integration
```

Rollback: Vercel dashboard → previous deployment → Promote to Production.
Database has no down-migrations — additive schema only, so rollback is safe.

## 4. Seed the owner (once)

1. Open the live site, sign in with Google (creates your CUSTOMER row).
2. Temporarily set `ADMIN_SEED_EMAIL=<you>` in Vercel, redeploy (or run the
   script locally with prod `MONGODB_URI`):
   `ADMIN_SEED_EMAIL=<you> MONGODB_URI=<atlas> npm run seed:admin`
3. Confirm `/admin` loads. Unset `ADMIN_SEED_EMAIL`, redeploy.

## 5. Manual gates (blocking — do not announce before these pass)

### Gate A — test-mode rupee flow (Razorpay TEST keys on a preview deploy)

1. Create a category + product (₹100–500) in admin, publish it.
2. As a fresh Google test user: add to bag → checkout → address → pay with a
   Razorpay test card/UPI → verify the confirmation screen.
3. Assert in Atlas: order `PAID`/`CONFIRMED`, stock decremented, coupon
   consumed (if used), two emails logged in `notifications` (confirmation +
   receipt), webhook `processedEvents` contains the capture event.
4. Refund the payment from Razorpay dashboard → assert order `REFUNDED`,
   stock restored, refund email logged.
5. Cancel a second unpaid order → `CANCELLED`, hold released.

### Gate B — production smoke (after DNS + live keys)

1. `/api/health` → ok. Homepage, shop, product page render; sitemap +
   robots resolve; GA `page_view` fires.
2. Place a REAL ₹1–10 order with your own card/UPI, then refund it from
   admin (`/admin/orders`) — proves live keys, webhook delivery, and the
   refund path end-to-end.
3. Check Resend: confirmation + receipt delivered (not spam).
4. Search Console: submit sitemap, request indexing for `/` + 3 products.

## 6. Post-launch

- [ ] Error monitoring reviewed daily for the first week (Vercel logs minimum).
- [ ] `notifications` FAILED rows triaged (Resend dashboard cross-check).
- [ ] First real customer order watched through PACKED → SHIPPED manually.
- [ ] Weekly: low-stock list, pending-order list, coupon usage, review queue.
- [ ] Rotate `CRON_SECRET` + `AUTH_SECRET` quarterly (calendar reminder).

## 7. Known limitations at launch (accepted, tracked)

- Rate limiting is per-instance memory (ADR-019) — fine on one Vercel region,
  revisit with Upstash on multi-region.
- No order idempotency keys on client retries (ADR-014) — UI busy-guards cover it.
- Variant reserved stock is product-level (ADR-014).
- Partial refunds unsupported (full only).
- Newsletter is single opt-in; double opt-in later.
- Contact inbox has no admin UI yet (read from `contactmessages` in Atlas).
