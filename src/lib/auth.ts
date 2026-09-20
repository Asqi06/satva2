import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { MongoClient } from "mongodb";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { requireServerVar } from "./env";
import { notifyWelcome } from "./email";
import { ensureCustomerRoleByEmail, getUserRoleByEmail } from "@/services/user-service";

/**
 * Auth.js (NextAuth v5) configuration — Google OAuth + MongoDB adapter.
 *
 * Lazy construction (see ADR-010): the NextAuth instance is created on
 * first use, never at module scope, so `next build` and `/api/health`
 * stay green without secrets. Every entry point fails fast with a
 * value-free error when env is missing.
 *
 * Sessions use the JWT strategy (stateless); the adapter persists
 * OAuth account linkage. Roles come from our `users` collection and
 * are injected into the token/session server-side — never from client
 * input. New users default to CUSTOMER (see user-service).
 */

type AuthInstance = ReturnType<typeof NextAuth>;

let cached: AuthInstance | null = null;

function createAuth(): AuthInstance {
  const client = new MongoClient(requireServerVar("MONGODB_URI"));
  const clientPromise = client.connect();
  // Attach a no-op rejection handler so a down/unreachable Mongo during
  // idle periods can't crash the process via unhandled rejection.
  // Auth.js still surfaces connection errors when an auth op needs the DB.
  clientPromise.catch(() => undefined);

  return NextAuth({
    adapter: MongoDBAdapter(clientPromise),
    // AUTH_SECRET is read automatically; needed for JWT + OAuth state.
    trustHost: true,
    session: { strategy: "jwt" },
    providers: [Google],
    pages: { signIn: "/login" },
    callbacks: {
      async signIn() {
        // Any Google account may sign in; authorization happens per-route.
        return true;
      },
      async jwt({ token, user }) {
        // On sign-in or while role is not ADMIN, check DB so promoted
        // admins take effect immediately. Once ADMIN, no repeated DB hit.
        const email = user?.email ?? token.email;
        if (email) {
          if (!token.role || token.role !== "ADMIN") {
            const role = await getUserRoleByEmail(email);
            if (role) {
              token.role = role;
            } else {
              await ensureCustomerRoleByEmail(email);
              token.role = "CUSTOMER";
            }
          }
        }
        return token;
      },
      async session({ session, token }) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role ?? "CUSTOMER";
        return session;
      },
    },
    events: {
      // Best-effort welcome (never blocks login): fire-and-forget.
      createUser: ({ user }) => {
        if (user.email) {
          void notifyWelcome(user.email, user.name ?? "there").catch(() => undefined);
        }
      },
    },
  });
}

function getAuth(): AuthInstance {
  if (!cached) cached = createAuth();
  return cached;
}

/** Session for server components / route handlers. Null when logged out. */
export async function auth() {
  return getAuth().auth();
}

/** NextAuth route handlers (used by [...nextauth]/route.ts). */
export function getAuthHandlers() {
  return getAuth().handlers;
}
