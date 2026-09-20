"use client";

import { signOut } from "next-auth/react";

/** Ends the session and returns home. */
export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => void signOut({ redirectTo: "/" })}
      className="rounded-full border border-ink/20 px-6 py-2.5 text-sm font-medium text-ink transition-colors hover:border-clay hover:text-clay"
    >
      Sign out
    </button>
  );
}
