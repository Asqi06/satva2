# Architecture

## Application Architecture

SatvaStones uses a modular Next.js architecture.

Client:

Next.js + React (App Router)

Server:

Next.js server components
Route handlers (`src/app/api/**/route.ts`)
Server actions where appropriate

Database:

MongoDB Atlas via Mongoose

Authentication:

Auth.js + Google OAuth

External services:

Razorpay (payments)
Cloudinary (images)
Resend (email)
Google Analytics 4 (analytics)

---

# High-Level Flow

Browser
↓
Next.js (Server Components / Client Components)
↓
Authentication / API / Server Actions
↓
Business Logic (`src/services/`, `src/features/*/`)
↓
MongoDB (via `src/models/` + `src/lib/db.ts`)

External integrations:

Next.js
├── Razorpay
├── Cloudinary
├── Resend
└── Google Analytics

---

# Architectural Principles

- Business logic must not be duplicated between frontend and backend.
- Client components must not directly access MongoDB.
- Database access must remain server-side.
- Payment verification must remain server-side.
- Authorization must remain server-side.
- External API credentials must remain server-side.
- Server calculates prices/totals; never trust client amounts.

---

# Suggested Structure

```text
src/
├── app/
│   ├── (shop)/            # public storefront routes
│   ├── account/           # customer dashboard
│   ├── admin/             # admin dashboard
│   └── api/               # route handlers
├── components/            # shared UI
├── features/              # feature modules
├── lib/                   # db, auth, razorpay, cloudinary, resend, utils
├── models/                # mongoose models
├── schemas/               # zod validation
├── types/                 # shared TS types
├── hooks/                 # client hooks
└── utils/                 # pure helpers
```

---

# Feature Modules

```text
features/
├── auth/
├── products/
├── cart/
├── wishlist/
├── checkout/
├── orders/
├── payments/
├── reviews/
├── coupons/
├── inventory/
└── admin/
```

Each feature should encapsulate its own:

- components
- services
- validation
- types
- business logic
