import { Suspense } from "react";
import type { Metadata } from "next";
import { SignInButton } from "@/features/auth/SignInButton";

export const metadata: Metadata = {
  title: { absolute: "Sign in — SatvaStones" },
  description: "Log in to SatvaStones with Google. Your orders, wishlist and addresses in sync.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/login" },
};

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-ivory px-4 py-10 text-ink">
      <div className="w-full max-w-sm border border-light-gray bg-ivory px-8 py-12 bg-cream">
        {/* Wordmark */}
        <p className="font-display text-2xl font-semibold text-primary">SatvaStones</p>

        <h1 className="mt-6 section-title text-3xl leading-[1.05] tracking-tight">
          Welcome back
        </h1>

        <p className="mt-4 text-sm leading-7 text-warm-gray">
          One tap with Google — your orders, wishlist and addresses stay in sync
          across devices.
        </p>

        <div className="mt-8">
          <Suspense fallback={<span className="btn-gold w-full">Continue with Google</span>}><SignInButton /></Suspense>
        </div>

        <ul className="mt-6 list-inside list-disc space-y-1.5 border-t border-light-gray pt-5 text-xs leading-5 text-muted">
          <li>View order updates and saved addresses</li>
          <li>Wishlist syncs across phone & laptop</li>
          <li>Secure payment through Razorpay</li>
        </ul>

        <p className="mt-5 text-xs text-muted">
          New here? The same button creates your account — no password needed.
        </p>
      </div>
    </div>
  );
}
