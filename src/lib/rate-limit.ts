import { AppError } from "./errors";

/**
 * In-memory per-key rate limiting (single instance). Covers MVP abuse
 * targets; distributed limiting is a documented future step (ADR-019).
 */

const buckets = new Map<string, number[]>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; remaining: number } {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) return { ok: false, remaining: 0 };
  hits.push(now);
  buckets.set(key, hits);
  return { ok: true, remaining: limit - hits.length };
}

/** Test-only: clear all buckets. */
export function resetRateLimits(): void {
  buckets.clear();
}

export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || "unknown";
}

/**
 * Enforce a budget or throw 429. Prefer user-scoped keys on authed
 * routes (after authentication, so probes don't burn budgets).
 */
export function limitOrThrow(
  req: Request,
  scope: string,
  limit: number,
  windowMs: number,
  identity?: string,
): void {
  const key = `${scope}:${identity ?? clientIp(req)}`;
  const gate = rateLimit(key, limit, windowMs);
  if (!gate.ok) {
    throw new AppError("RATE_LIMITED", "Too many requests — slow down a moment", 429);
  }
}
