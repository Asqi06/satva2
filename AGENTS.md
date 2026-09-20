# SatvaStones Development Instructions

## Project

SatvaStones is a D2C jewellery e-commerce platform.

The application must support:

- Customer shopping
- Google authentication
- Product discovery
- Product search
- Categories
- Cart
- Wishlist
- Checkout
- Razorpay payments
- Orders
- Order tracking
- Reviews
- Coupons
- Customer accounts
- Inventory
- Admin management
- Analytics
- SEO
- Email notifications

---

# NON-NEGOTIABLE RULE

Do not write application code until all project documentation has been read.

Required documents:

- PRD.md
- ARCHITECTURE.md
- TECH_STACK.md
- DATABASE.md
- API.md
- AUTH.md
- SECURITY.md
- DEVELOPMENT_PLAN.md
- TESTING.md
- ENVIRONMENT.md
- CODE_CONVENTIONS.md

If requirements conflict, stop and resolve the conflict before implementation.

Never invent requirements silently.

---

# Development Philosophy

Build a production-quality application.

Priorities:

1. Correctness
2. Security
3. Maintainability
4. Type safety
5. Performance
6. Accessibility
7. Developer experience
8. Visual polish

Do not optimize for writing the smallest amount of code.

Do not create unnecessary abstractions.

Do not introduce libraries without a reason.

---

# Technology

Frontend:

- Next.js
- React
- TypeScript
- Tailwind CSS

Backend:

- Next.js server-side APIs
- Server Actions where appropriate

Database:

- MongoDB Atlas
- Mongoose

Authentication:

- Auth.js
- Google OAuth

Payments:

- Razorpay

Image storage:

- Cloudinary

Email:

- Resend

Hosting:

- Vercel

---

# TypeScript

Strict TypeScript is mandatory.

Never use:

- `any`
- `@ts-ignore`
- `@ts-nocheck`

unless there is a documented and justified exception.

Prefer explicit types.

Validate external input with Zod.

---

# Security

Never expose:

- MongoDB credentials
- Google client secret
- Razorpay secret
- Cloudinary secret
- Resend API key

Secrets must only exist server-side.

Never trust:

- client prices
- client totals
- client user IDs
- client payment status
- client inventory
- client permissions

All important values must be verified server-side.

---

# Database

MongoDB is the source of truth for:

- Users
- Products
- Categories
- Orders
- Inventory
- Reviews
- Coupons
- Addresses
- Wishlist
- Cart
- Payments

Do not store secrets in MongoDB.

---

# Authentication

Google OAuth is the primary authentication method.

Authentication does not automatically grant admin access.

Admin authorization must be explicitly checked server-side.

Never trust a client-side `isAdmin` value.

---

# Payments

Never mark an order as paid simply because the frontend says payment succeeded.

Payment verification must happen server-side.

Razorpay webhook/signature verification is mandatory.

---

# API

Every API endpoint must:

1. Validate input
2. Authenticate when required
3. Authorize the user
4. Execute business logic
5. Return a predictable response
6. Handle errors safely

Never leak internal errors or stack traces to users.

---

# Components

Use reusable components.

Avoid huge components.

A component should have one clear responsibility.

Prefer:

components/
features/
lib/
services/

over putting everything inside page files.

---

# UI

No design system is prescribed by this document.

The implementation may establish visual rules during development, but business requirements must never depend on visual styling.

The website must be responsive.

Accessibility is mandatory.

---

# Testing

Every important business flow must have tests.

Minimum critical flows:

- Google login
- Product creation
- Product retrieval
- Cart
- Checkout
- Payment verification
- Order creation
- Order cancellation
- Inventory updates
- Admin authorization

---

# Git

Use small, meaningful commits.

Do not commit:

- `.env`
- secrets
- build output
- node_modules
- generated credentials

---

# Before Completing Any Task

Run:

- TypeScript check
- Lint
- Tests
- Build

Fix failures before declaring the task complete.

---

# Change Management

Before changing architecture:

1. Check existing documentation.
2. Determine whether the change affects other systems.
3. Update documentation.
4. Then implement.

Do not silently change documented architecture.

---

# Definition of Done

A feature is complete only when:

- Requirements are implemented.
- Types are correct.
- Validation exists.
- Authorization exists where necessary.
- Error handling exists.
- Tests exist for important behavior.
- Documentation is updated.
- Build passes.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
