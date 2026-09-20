# Contributing to SatvaStones

## Prerequisites

- Node 20+, npm, MongoDB Atlas (or local Mongo for dev), Google OAuth test project, Razorpay test keys, Cloudinary + Resend test accounts.

## Setup

```bash
cp .env.example .env.local   # fill values, never commit
npm install
npm run dev
```

## Workflow

1. Read `AGENTS.md` + relevant spec docs before touching code.
2. Work phase-by-phase per `DEVELOPMENT_PLAN.md`; one concern per branch/commit (see `GIT_CONVENTIONS.md`).
3. Validate input with Zod; keep DB + secrets server-side; verify payments server-side.
4. Before pushing: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` — all green.
5. Update docs + `CHANGELOG.md` with your change.

## What Not to Do

- No secrets in code/docs/logs. No client-trusted prices/payments/roles. No `any` without documented exception. No new dependencies without justification in the PR.
