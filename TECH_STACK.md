# Technology Stack

## Frontend

- Next.js (App Router)
- React
- TypeScript (strict)
- Tailwind CSS

## Backend

- Next.js Route Handlers
- Next.js Server Actions (where appropriate)
- REST-style endpoints where useful

## Database

- MongoDB Atlas
- Mongoose (ODM)

## Authentication

- Auth.js (NextAuth v5) + Google OAuth provider
- MongoDB adapter (or Mongoose-backed user lookup)

## Payments

- Razorpay (Orders API + Checkout + webhook signature verification)

## Storage

- Cloudinary (image/video storage + transformations; MongoDB stores URLs + metadata only)

## Email

- Resend (welcome, order confirmation, payment, shipped, out-for-delivery, delivered, cancellation, refund)

## Hosting

- Vercel

## Validation / Forms

- Zod
- React Hook Form

## Testing

- Vitest (unit/integration)
- React Testing Library
- Playwright (E2E)

## Code Quality

- ESLint (`eslint-config-next`)
- Prettier
- TypeScript (`tsc --noEmit` as `typecheck`)

## Source Control

- GitHub

## Shipping (later)

- Shiprocket / Delhivery (initial: fixed shipping rule by pincode / cart value / weight)

## Search

- Initial: MongoDB regex/text search over name, category, tags, description, SKU
- Later: MongoDB Atlas Search (fuzzy)

## Analytics / SEO

- Google Analytics 4
- Google Search Console
- Next.js Metadata API, sitemap.xml, robots.txt, JSON-LD structured data

## Core MVP

`Next.js + TypeScript + MongoDB + Google Login + Razorpay + Cloudinary + Vercel`
