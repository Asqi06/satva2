"use client";

import { useState } from "react";
import type { ShippingSettings } from "@/services/settings-service";

const DETAIL_FIELDS = {
  legalName: "Legal / seller name",
  businessAddress: "Business postal address",
  supportEmail: "Customer support email",
  supportPhone: "Customer support phone",
  grievanceContact: "Grievance officer name, designation and contact",
  gstin: "GSTIN (if applicable)",
  dispatchInformation: "Dispatch information",
  deliveryInformation: "Delivery information",
  returnPolicy: "Return, exchange and refund policy",
  cancellationPolicy: "Cancellation policy",
  privacyPolicy: "Privacy policy",
  termsPolicy: "Terms and conditions",
  aboutInformation: "About the business",
} as const;

/** Store settings editor: announcement strip + shipping numbers. */
export function SettingsForm({ initial }: { initial: ShippingSettings }) {
  const [threshold, setThreshold] = useState(String(initial.freeShippingThreshold));
  const [flatFee, setFlatFee] = useState(String(initial.shippingFlatFee));
  const [ttl, setTtl] = useState(String(initial.reservationTtlMinutes));
  const [announcement, setAnnouncement] = useState(initial.announcement ?? "");
  const [homeSeoTitle, setHomeSeoTitle] = useState(initial.homeSeoTitle ?? "");
  const [homeSeoDescription, setHomeSeoDescription] = useState(initial.homeSeoDescription ?? "");
  const [shopSeoTitle, setShopSeoTitle] = useState(initial.shopSeoTitle ?? "");
  const [shopSeoDescription, setShopSeoDescription] = useState(initial.shopSeoDescription ?? "");
  const [details, setDetails] = useState(() => Object.fromEntries(Object.keys(DETAIL_FIELDS).map((key) => [key, initial[key as keyof typeof DETAIL_FIELDS] ?? ""])));
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
          ...details,
          freeShippingThreshold: Number(threshold),
          shippingFlatFee: Number(flatFee),
          reservationTtlMinutes: Number(ttl),
          announcement: announcement.trim() ? announcement.trim() : undefined,
          homeSeoTitle,
          homeSeoDescription,
          shopSeoTitle,
          shopSeoDescription,
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
        One static message above the header. If an older value contains <code className="font-mono text-gold">|</code>, only its first message appears.
        Leave this blank to show the configured free-delivery threshold.
      </p>
      <textarea
        aria-label="Announcement strip messages"
        value={announcement}
        onChange={(e) => setAnnouncement(e.target.value)}
        maxLength={200}
        rows={3}
        placeholder="Add a verified announcement"
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

      <h2 className="mt-8 font-display italic text-2xl text-ivory">Business details and policies</h2>
      <p className="mt-1 text-sm text-ivory/50">Publish verified facts and approved policy text. Leave unknown fields blank; these fields never invent business information. Confirm legal requirements with your adviser.</p>
      <div className="mt-4 grid gap-4 text-ivory/70">
        {Object.entries(DETAIL_FIELDS).map(([key, label]) => (
          <label key={key} className="flex flex-col gap-1 text-sm">{label}
            <textarea value={details[key]} onChange={(event) => setDetails({ ...details, [key]: event.target.value })} maxLength={5000} rows={key.endsWith("Policy") || key === "aboutInformation" ? 5 : 2} className={inputCls} />
          </label>
        ))}
      </div>

      <h2 className="mt-8 font-display italic text-2xl text-ivory">Search appearance</h2>
      <p className="mt-1 text-sm text-ivory/50">Write clear titles and descriptions for the homepage and all-jewellery page. Edit collection copy in Categories and individual item copy in Products. Keep claims accurate.</p>
      <div className="mt-4 grid gap-4 text-ivory/70">
        <label className="flex flex-col gap-1 text-sm">Homepage title<input value={homeSeoTitle} onChange={(e) => setHomeSeoTitle(e.target.value)} maxLength={160} placeholder="SatvaStones — Everyday Jewellery Online in India" className={inputCls} /></label>
        <label className="flex flex-col gap-1 text-sm">Homepage description<textarea value={homeSeoDescription} onChange={(e) => setHomeSeoDescription(e.target.value)} maxLength={320} rows={2} className={inputCls} /></label>
        <label className="flex flex-col gap-1 text-sm">Shop title<input value={shopSeoTitle} onChange={(e) => setShopSeoTitle(e.target.value)} maxLength={160} placeholder="Buy Jewellery Online in India | SatvaStones" className={inputCls} /></label>
        <label className="flex flex-col gap-1 text-sm">Shop description<textarea value={shopSeoDescription} onChange={(e) => setShopSeoDescription(e.target.value)} maxLength={320} rows={2} className={inputCls} /></label>
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
