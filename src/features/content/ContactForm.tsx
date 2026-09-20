"use client";

import { useState } from "react";

/** Contact inbox form. Honeypotted + rate-limited server-side. */
export function ContactForm() {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState("busy");
    setMessage("");
    try {
      const data = new FormData(e.currentTarget);
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(data.get("name") ?? ""),
          email: String(data.get("email") ?? ""),
          topic: String(data.get("topic") ?? "") || undefined,
          message: String(data.get("message") ?? ""),
          company: String(data.get("company") ?? ""),
        }),
      });
      const body = (await res.json()) as { success: boolean; error?: { message: string } };
      if (!body.success) throw new Error(body.error?.message ?? "Could not send");
      setState("done");
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "Could not send");
    }
  };

  if (state === "done") {
    return (
      <p role="status" className="rounded-2xl border border-ink/10 bg-white/60 p-6 text-center">
        Message received — we reply within 2 working days.
      </p>
    );
  }

  const inputCls = "w-full rounded-xl border border-ink/15 bg-ivory px-3 py-2 text-sm";
  return (
    <form onSubmit={submit} className="grid gap-3 rounded-3xl border border-ink/10 bg-white/60 p-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Name
          <input name="name" required maxLength={120} autoComplete="name" className={inputCls} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input name="email" type="email" required maxLength={320} autoComplete="email" className={inputCls} />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        Topic (optional)
        <input name="topic" maxLength={120} placeholder="Order, sizing, gifting…" className={inputCls} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Message
        <textarea name="message" required rows={5} maxLength={2000} className={inputCls} />
      </label>
      <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      {state === "error" && (
        <p role="alert" className="text-sm text-clay">
          {message}
        </p>
      )}
      <button type="submit" disabled={state === "busy"} className="rounded-full bg-ink px-8 py-3 text-sm font-medium text-ivory hover:bg-clay disabled:opacity-60">
        {state === "busy" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
