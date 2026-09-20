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
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-ivory text-ink">
      {/* Decorative half-screen background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute bottom-0 left-0 right-0 top-1/2 bg-[#0a0a0a]" />
      </div>

      <main className="w-full max-w-sm border border-ink/[0.07] bg-ivory px-8 py-12 shadow-[0_24px_80px_rgba(10,10,10,0.12)] animate-scale-in">
        {/* Wordmark */}
        <p className="font-display italic text-2xl text-[#c8a96e]">SatvaStones</p>

        <h1 className="mt-6 font-display italic text-5xl leading-[1.05] tracking-tight">
          Welcome<br />back.
        </h1>

        <p className="mt-4 text-sm leading-7 text-ink/60">
          One tap with Google — your orders, wishlist and addresses stay in sync
          across every device.
        </p>

        <div className="mt-8">
          <SignInButton />
        </div>

        <p className="mt-5 text-xs text-ink/40">
          New here? The same button creates your account — no password needed.
        </p>
      </main>
    </div>
  );
}
