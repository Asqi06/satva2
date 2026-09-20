# Environment Variables

Required (server-only unless prefixed `NEXT_PUBLIC_`):

```text
MONGODB_URI

AUTH_SECRET

GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET

RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET

CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET

RESEND_API_KEY

NEXT_PUBLIC_APP_URL

NEXT_PUBLIC_RAZORPAY_KEY_ID
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

NEXT_PUBLIC_GA_ID
```

Optional: `ADMIN_SEED_EMAIL` (one-time owner bootstrap, unset after use — see AUTH.md + `npm run seed:admin`).

Optional: `CRON_SECRET` (Vercel Cron bearer for `/api/cron/*`; generate with `openssl rand -hex 32`).

Optional: `EMAIL_FROM` (transactional sender; production needs a verified domain).

Optional (test only, never production): `E2E_SEED_SECRET`.

Google OAuth callback (register in Google Cloud Console per environment):

```text
http://localhost:3000/api/auth/callback/google   (local)
https://<preview-url>/api/auth/callback/google   (preview — or keep auth off on previews)
https://<domain>/api/auth/callback/google        (production)
```

Generate `AUTH_SECRET` with `npx auth secret`. Host detection uses `trustHost: true` in `src/lib/auth.ts` (safe behind Vercel).

---

# Rules

- Never commit `.env*` files. Only `.env.example` is committed.
- Validate at startup via `src/lib/env.ts` (Zod): fail fast with a clear message listing missing vars.
- Public (`NEXT_PUBLIC_`) variables must contain no secrets — only publishable key IDs, cloud name, app URL, GA ID.
- Server-only secrets must never use `NEXT_PUBLIC_` prefix.
- Local dev: copy `.env.example` → `.env.local`. Production: set in Vercel dashboard (per ENVIRONMENT), never paste into code/docs/issues.
