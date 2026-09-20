"use client";

import { useState } from "react";

/** Homepage newsletter signup. Idempotent; bots meet the honeypot. */
export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState("busy");
    setMessage("");
    try {
      const data = new FormData(e.currentTarget);
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, company: String(data.get("company") ?? "") }),
      });
      const body = (await res.json()) as { success: boolean; error?: { message: string } };
      if (!body.success) throw new Error(body.error?.message ?? "Signup failed");
      setState("done");
      setMessage("You're on the list — see you Sunday.");
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "Signup failed");
    }
  };

  if (state === "done") {
    return (
      <p role="status" className="rounded-2xl border border-ink/10 bg-white/60 p-4 text-sm">
        {message}
      </p>
    );
  }

  return (
    <form onSubmit={submit} aria-label="Newsletter signup">
      <div className="flex max-w-md gap-2">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.in"
          autoComplete="email"
          className="w-full rounded-full border border-ink/15 bg-ivory px-4 py-2.5 text-sm"
        />
        <button
          type="submit"
          disabled={state === "busy"}
          className="shrink-0 rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-ivory hover:bg-clay disabled:opacity-60"
        >
          {state === "busy" ? "Joining…" : "Join"}
        </button>
      </div>
      {/* Honeypot — invisible to humans. */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />
      {state === "error" && (
        <p role="alert" className="mt-2 text-sm text-clay">
          {message}
        </p>
      )}
    </form>
  );
}
