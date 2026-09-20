"use client";

import { useState } from "react";
import type { AddressDTO } from "@/services/address-service";

/** Inline address creator for checkout. Reports the created id. */
export function AddressForm({ onCreated }: { onCreated: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const data = new FormData(e.currentTarget);
      const payload = {
        fullName: String(data.get("fullName") ?? ""),
        phone: String(data.get("phone") ?? ""),
        addressLine1: String(data.get("addressLine1") ?? ""),
        addressLine2: String(data.get("addressLine2") ?? "") || undefined,
        city: String(data.get("city") ?? ""),
        state: String(data.get("state") ?? ""),
        pincode: String(data.get("pincode") ?? ""),
        landmark: String(data.get("landmark") ?? "") || undefined,
        isDefault: data.get("isDefault") === "on",
      };
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await res.json()) as
        | { success: true; data: AddressDTO }
        | { success: false; error: { message: string; details?: { path: string; message: string }[] } };
      if (!body.success) {
        const details = body.error.details?.map((d) => `${d.path}: ${d.message}`).join("; ");
        throw new Error(details ?? body.error.message);
      }
      onCreated(body.data.id);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save address");
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-ink/20 px-5 py-2 text-sm hover:border-ink"
      >
        + Add a new address
      </button>
    );
  }

  const inputCls = "w-full rounded-xl border border-ink/15 bg-ivory px-3 py-2 text-sm";
  return (
    <form onSubmit={submit} className="mt-4 grid gap-3 rounded-2xl border border-ink/10 bg-white/60 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Full name
          <input name="fullName" required maxLength={120} autoComplete="name" className={inputCls} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Phone (10-digit mobile)
          <input name="phone" required inputMode="numeric" autoComplete="tel" maxLength={10} className={inputCls} />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          Address
          <input name="addressLine1" required maxLength={256} autoComplete="street-address" className={inputCls} />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          Apartment / flat (optional)
          <input name="addressLine2" maxLength={256} className={inputCls} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          City
          <input name="city" required maxLength={120} autoComplete="address-level2" className={inputCls} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          State
          <input name="state" required maxLength={120} autoComplete="address-level1" className={inputCls} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Pincode
          <input name="pincode" required inputMode="numeric" maxLength={6} autoComplete="postal-code" className={inputCls} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Landmark (optional)
          <input name="landmark" maxLength={256} className={inputCls} />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isDefault" className="h-4 w-4 accent-[#b34a2b]" />
        Make default
      </label>
      {error && (
        <p role="alert" className="text-sm text-clay">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="rounded-full bg-ink px-6 py-2 text-sm font-medium text-ivory hover:bg-clay disabled:opacity-60">
          {saving ? "Saving…" : "Save address"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-ink/20 px-6 py-2 text-sm">
          Cancel
        </button>
      </div>
    </form>
  );
}
