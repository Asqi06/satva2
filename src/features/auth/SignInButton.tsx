"use client";

import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

/** Google OAuth entry button. Redirects into /account after login. */
export function SignInButton() {
  const params = useSearchParams();
  const target = params.get("callbackUrl");
  const redirectTo = target?.startsWith("/") && !target.startsWith("//") && !target.includes("\\") ? target : "/account";
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        setPending(true);
        void signIn("google", { redirectTo });
      }}
      className="btn-gold w-full"
    >
      <span aria-hidden="true">G</span>
      {pending ? "Opening Google…" : "Continue with Google"}
    </button>
  );
}
