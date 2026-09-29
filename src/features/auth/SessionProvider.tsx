"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

/** Client session context (merge-on-login, wishlist redirects). */
export function AuthSessionProvider({ children, demoMode = false }: { children: ReactNode; demoMode?: boolean }) {
  return <SessionProvider {...(demoMode ? { session: null, refetchOnWindowFocus: false } : {})}>{children}</SessionProvider>;
}
