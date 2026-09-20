import { connectDb } from "@/lib/db";
import { User, type UserRole } from "@/models/User";

/**
 * User role helpers (server-only). Single authority for role reads/writes
 * used by Auth.js callbacks. Emails are stored lowercase (schema).
 */

export function normalizeRole(role?: string | null): UserRole {
  if (!role) return "CUSTOMER";
  const upper = role.trim().toUpperCase();
  if (upper === "ADMIN") return "ADMIN";
  return "CUSTOMER";
}

export async function getUserRoleByEmail(email: string): Promise<UserRole | null> {
  await connectDb();
  const user = await User.findOne({ email: email.toLowerCase() })
    .select("role")
    .lean<{ role?: string } | null>();
  if (!user) return null;
  return normalizeRole(user.role);
}

/**
 * Ensure an OAuth-created user document carries a role.
 * The Auth.js adapter bypasses Mongoose defaults, so adapter-created
 * users may lack `role` — default them to CUSTOMER, never ADMIN.
 * Existing roles (including ADMIN) are never overwritten.
 */
export async function ensureCustomerRoleByEmail(email: string): Promise<UserRole> {
  await connectDb();
  const normalized = email.toLowerCase();
  const existing = await User.findOne({ email: normalized })
    .select("role")
    .lean<{ role?: string } | null>();
  if (existing?.role) return normalizeRole(existing.role);
  await User.updateOne(
    { email: normalized, $or: [{ role: { $exists: false } }, { role: null }] },
    { $set: { role: "CUSTOMER" satisfies UserRole } },
  );
  return "CUSTOMER";
}
