# Code Conventions

## TypeScript

- Strict mode (`strict: true`). No `any`, no `@ts-ignore` / `@ts-nocheck` without a documented, justified exception in code comment + DECISIONS.md entry.
- Prefer `const` over `let`; explicit return types on exported functions; prefer `unknown` + narrowing over `any`.
- Validate external input with Zod at API boundaries; infer TS types from schemas (`z.infer`).

## Naming

- Components: `PascalCase` (`ProductCard.tsx`).
- Functions/variables: `camelCase` (`getProduct()`, `productId`).
- Constants: `UPPER_SNAKE_CASE` only when genuinely constant (`FREE_SHIPPING_THRESHOLD`).
- Files: kebab-case for non-components (`order-service.ts`); components `PascalCase.tsx`.

## Files / Structure

- One primary responsibility per file. Avoid massive files (>300 lines is a smell).
- Imports via absolute alias: `@/components`, `@/lib`, `@/features`, `@/models`, `@/schemas`.
- Barrel files (`index.ts`) only for stable public APIs, not for everything.

## Server vs Client

- Prefer Server Components. Add `"use client"` only for browser interactivity (cart drawer, checkout forms, search input).
- Database queries belong in server-side services (`src/services/`, `src/features/*/server.ts`). Components never import Mongoose directly.

## Validation

- All external input validated with Zod schemas in `src/schemas/`, co-located per feature.

## Errors

- Throw structured `AppError(code, message, status)`; route handlers map to envelope responses. Never expose internals.

## Data Fetching

- Server Components fetch via services; client mutation via `fetch` to route handlers + `useState`/`SWR`-lite patterns (no extra dep until justified).

## Comments

- Explain *why*, not *what*. No commented-out code. No AI-slop filler comments.

## Formatting

- Prettier default; ESLint `next/core-web-vitals`. Run both before commit.
