# Deployment (Vercel)

Platform: Vercel. Database: MongoDB Atlas (prod cluster, IP-allowlisted / private endpoint).

Production services: Razorpay (live keys + webhook), Cloudinary (prod cloud), Resend (verified domain).

---

# Production Checklist

- [ ] Production MongoDB configured (separate DB/user, least-privilege)
- [ ] Environment variables set in Vercel (all of ENVIRONMENT.md; no `.env` committed)
- [ ] Google OAuth production callback (`https://<domain>/api/auth/callback/google`) registered
- [ ] Razorpay production credentials + webhook (`https://<domain>/api/webhooks/razorpay`) with secret
- [ ] Cloudinary prod cloud + upload presets
- [ ] Resend sending domain verified
- [ ] Custom domain + HTTPS (Vercel default) + redirects (apex → www or vice versa)
- [ ] Sitemap + robots verified, Search Console submitted
- [ ] GA4 verified (purchase event fires on real test order, then refunded)
- [ ] Error monitoring enabled (Sentry or Vercel logs at minimum)
- [ ] Seed ADMIN via documented one-time flow, then remove seed capability

---

# Before Deployment

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

All must pass. Tag release (`vX.Y.Z`) + CHANGELOG.md entry. Rollback = previous Vercel deployment.
