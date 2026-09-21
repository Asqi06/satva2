import { TypeSafeClient } from "@typesafe-ai/sdk";
import { AppError } from "./errors";

/**
 * TypeSafe (Jev) access — server-only.
 *
 * Lazy construction (same rule as auth/cloudinary): the client is created
 * on first use, never at module scope, so `next build` stays green without
 * the key. The SDK reads TYPESAFE_API_KEY from the environment.
 */

let cached: TypeSafeClient | null = null;

/** Presence check only (no values) — safe to branch on anywhere server-side. */
export function isTypesafeConfigured(): boolean {
  return Boolean(process.env.TYPESAFE_API_KEY?.trim());
}

export function getTypesafeClient(): TypeSafeClient {
  if (!isTypesafeConfigured()) {
    throw new AppError(
      "INTERNAL_ERROR",
      "TYPESAFE_API_KEY is not set. Add it in .env.local (local) or Vercel → Settings → Environment Variables (Production), then retry.",
      503,
    );
  }
  if (!cached) cached = new TypeSafeClient();
  return cached;
}

/** Test-only helper: clears the cached client. */
export function resetTypesafeClient(): void {
  cached = null;
}
