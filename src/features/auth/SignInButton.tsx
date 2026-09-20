"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

/** Google OAuth entry button. Redirects into /account after login. */
export function SignInButton() {
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        setPending(true);
        void signIn("google", { redirectTo: "/account" });
      }}
      className="flex w-full items-center justify-center gap-3 rounded-full bg-ink px-7 py-3 text-sm font-medium text-ivory transition-colors hover:bg-clay disabled:opacity-60"
    >
      <span aria-hidden="true">G</span>
      {pending ? "Opening Google…" : "Continue with Google"}
    </button>
  );
}
