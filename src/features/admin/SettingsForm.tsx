"use client";

import { useState } from "react";
import type { ShippingSettings } from "@/services/settings-service";

/** Store settings editor: announcement strip + shipping numbers. */
export function SettingsForm({ initial }: { initial: ShippingSettings }) {
  const [threshold, setThreshold] = useState(String(initial.freeShippingThreshold));
  const [flatFee, setFlatFee] = useState(String(initial.shippingFlatFee));
  const [ttl, setTtl] = useState(String(initial.reservationTtlMinutes));
  const [announcement, setAnnouncement] = useState(initial.announcement ?? "");
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          freeShippingThreshold: Number(threshold),
          shippingFlatFee: Number(flatFee),
          reservationTtlMinutes: Number(ttl),
          announcement: announcement.trim() ? announcement.trim() : undefined,
        }),
      });
      const body = (await res.json()) as { success: boolean; error?: { message: string } };
      if (!body.success) throw new Error(body.error?.message ?? "Save failed");
      setNotice("Saved — storefront updates within a minute.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "admin-input";

  return (
    <form onSubmit={save} className="mt-6 max-w-2xl border border-ivory/[0.07] bg-ivory/[0.03] p-5">
      {notice && (
        <p role="status" className="mb-4 border border-gold/30 bg-gold/10 p-3 text-sm text-ivory">
          {notice}
        </p>
      )}

      <h2 className="font-display italic text-2xl text-ivory">Announcement strip</h2>
      <p className="mt-1 text-sm text-ivory/50">
        Black marquee bar under the header. Separate messages with <code className="font-mono text-gold">|</code> —
        empty hides the custom strip and shows defaults.
      </p>
      <textarea
        value={announcement}
        onChange={(e) => setAnnouncement(e.target.value)}
        maxLength={200}
        rows={3}
        placeholder="Free gift on order above INR 899 | Secure online payments | Easy return"
        className={`${inputCls} mt-3`}
      />

      <h2 className="mt-8 font-display italic text-2xl text-ivory">Shipping</h2>
      <div className="mt-4 grid gap-4 text-ivory/70 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          Free-shipping over (₹)
          <input
            type="number"
            min={0}
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            required
            className={inputCls}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Flat fee below (₹)
          <input
            type="number"
            min={0}
            value={flatFee}
            onChange={(e) => setFlatFee(e.target.value)}
            required
            className={inputCls}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Reservation (min)
          <input
            type="number"
            min={5}
            value={ttl}
            onChange={(e) => setTtl(e.target.value)}
            required
            className={inputCls}
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="mt-6 border border-gold bg-gold/10 px-8 py-3 text-sm font-medium text-gold hover:bg-gold hover:text-ink disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
