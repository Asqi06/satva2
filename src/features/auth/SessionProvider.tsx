"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

/** Client session context (merge-on-login, wishlist redirects). */
export function AuthSessionProvider({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
