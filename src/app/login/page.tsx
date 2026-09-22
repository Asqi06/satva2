import type { Metadata } from "next";
import { SignInButton } from "@/features/auth/SignInButton";

export const metadata: Metadata = {
  title: "Sign in — SatvaStones",
  description: "Log in to SatvaStones with Google. Your orders, wishlist and addresses in sync.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/login" },
};

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-ivory px-4 py-10 text-ink">
      {/* Decorative half-screen background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute bottom-0 left-0 right-0 top-1/2 bg-ink" />
      </div>

      <main className="w-full max-w-sm border border-light-gray bg-ivory px-8 py-12 shadow-[0_24px_80px_rgba(10,10,10,0.12)] animate-scale-in">
        {/* Wordmark */}
        <p className="font-display italic text-2xl text-gold">SatvaStones ✦</p>

        <h1 className="mt-6 font-display italic text-5xl leading-[1.05] tracking-tight">
          Namaste,<br />welcome back.
        </h1>

        <p className="mt-4 text-sm leading-7 text-warm-gray">
          One tap with Google — your orders, wishlist and addresses stay in sync
          across every device. No passwords, no OTP spam.
        </p>

        <div className="mt-8">
          <SignInButton />
        </div>

        <ul className="mt-6 space-y-1.5 border-t border-light-gray pt-5 text-xs leading-5 text-muted">
          <li>✓ Track orders live, 5–7 day delivery</li>
          <li>✓ Wishlist syncs across phone & laptop</li>
          <li>✓ UPI, cards & netbanking at checkout</li>
        </ul>

        <p className="mt-5 text-xs text-muted">
          New here? The same button creates your account — no password needed.
        </p>
      </main>
    </div>
  );
}
