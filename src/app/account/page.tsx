import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { SignOutButton } from "@/features/auth/SignOutButton";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "My Account — SatvaStones",
  description: "Your SatvaStones profile, orders and settings.",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { user } = session;

  return (
    <main className="rounded-3xl border border-light-gray bg-white/60 p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-clay">
        Overview
      </p>
      <div className="mt-4 flex items-center gap-5">
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt=""
            width={64}
            height={64}
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-16 w-16 items-center justify-center rounded-full bg-ink font-display text-2xl text-ivory"
          >
            {(user.name ?? user.email ?? "?").charAt(0).toUpperCase()}
          </span>
        )}
        <div>
          <h1 className="font-display text-3xl">{user.name ?? "Collector"}</h1>
          <p className="mt-1 text-sm text-warm-gray">{user.email}</p>
        </div>
      </div>
      {user.role === "ADMIN" && (
        <div className="mt-6 border border-gold/30 bg-gold/10 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">Admin access</p>
          <p className="mt-1 text-sm text-warm-gray">You are signed in as ADMIN.</p>
          <a
            href="/admin"
            className="mt-3 inline-flex items-center gap-2 bg-ink px-5 py-2.5 text-sm font-medium text-ivory transition-colors hover:bg-gold hover:text-ink"
          >
            Go to admin dashboard →
          </a>
        </div>
      )}
      <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
        <div className="rounded-2xl border border-light-gray p-4">
          <dt className="text-warm-gray">Role</dt>
          <dd className="mt-1 font-semibold">{user.role}</dd>
        </div>
        <div className="rounded-2xl border border-light-gray p-4">
          <dt className="text-warm-gray">Signed in with</dt>
          <dd className="mt-1 font-semibold">Google</dd>
        </div>
      </dl>
      <div className="mt-6">
        <SignOutButton />
      </div>
    </main>
  );
}
