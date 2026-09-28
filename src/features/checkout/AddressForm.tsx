"use client";

import { AddressFields } from "./AddressFields";
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
        className="btn-ghost"
      >
        + Add a new address
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-4 grid gap-5 border border-light-gray p-4">
      <AddressFields />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isDefault" className="h-4 w-4 accent-clay" />
        Make default
      </label>
      {error && (
        <p role="alert" className="text-sm text-clay">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Saving…" : "Save address"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-ghost">
          Cancel
        </button>
      </div>
    </form>
  );
}
