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
  const [threshold, setThreshold] = useState(
    String(initial.freeShippingThreshold),
  );
  const [flatFee, setFlatFee] = useState(String(initial.shippingFlatFee));
  const [ttl, setTtl] = useState(String(initial.reservationTtlMinutes));
  const [announcement, setAnnouncement] = useState(initial.announcement ?? "");
  const [homeSeoTitle, setHomeSeoTitle] = useState(initial.homeSeoTitle ?? "");
  const [homeSeoDescription, setHomeSeoDescription] = useState(
    initial.homeSeoDescription ?? "",
  );
  const [shopSeoTitle, setShopSeoTitle] = useState(initial.shopSeoTitle ?? "");
  const [shopSeoDescription, setShopSeoDescription] = useState(
    initial.shopSeoDescription ?? "",
  );
  const [localDetails, setLocalDetails] = useState({
    addressStreet: initial.addressStreet ?? "",
    addressLocality: initial.addressLocality ?? "",
    addressRegion: initial.addressRegion ?? "",
    addressPostalCode: initial.addressPostalCode ?? "",
    googleMapsUrl: initial.googleMapsUrl ?? "",
  });
  const [physicalStore, setPhysicalStore] = useState(initial.physicalStore ?? false);
  const [profiles, setProfiles] = useState((initial.sameAs ?? []).join("\n"));
  const [details, setDetails] = useState(() =>
    Object.fromEntries(
      Object.keys(DETAIL_FIELDS).map((key) => [
        key,
        initial[key as keyof typeof DETAIL_FIELDS] ?? "",
      ]),
    ),
  );
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
          ...localDetails,
          physicalStore,
          sameAs: profiles.split(/\r?\n/).map((value) => value.trim()).filter(Boolean),
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
      const body = (await res.json()) as {
        success: boolean;
        error?: { message: string };
      };
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
    <form onSubmit={save} className="mt-6 space-y-5">
      <div className="sticky top-[72px] z-20 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-light-gray bg-white p-4">
        <p className="text-sm text-muted">
          Changes apply across your storefront.
        </p>
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Saving…" : "Save settings"}
        </button>
      </div>
      {notice && (
        <p
          role="status"
          className="border border-primary/20 bg-white p-4 text-sm"
        >
          {notice}
        </p>
      )}
      <fieldset disabled={saving} className="admin-card">
        <legend className="sr-only">Storefront announcement</legend>
        <h2 className="text-base font-semibold">Announcement</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          One static message above the store header. Leave blank to show the
          free-delivery threshold.
        </p>
        <label className="mt-4 block text-sm">
          Message
          <textarea
            value={announcement}
            onChange={(e) => setAnnouncement(e.target.value)}
            maxLength={200}
            rows={2}
            placeholder="Add a verified announcement"
            className={`${inputCls} mt-2`}
          />
        </label>
      </fieldset>
      <fieldset disabled={saving} className="admin-card">
        <legend className="sr-only">Shipping and reservations</legend>
        <h2 className="text-base font-semibold">Shipping & reservations</h2>
        <p className="mt-2 text-sm text-muted">
          Shipping is calculated after discounts. Unpaid orders reserve stock
          for the time set below.
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm">
            Free delivery from (₹)
            <input
              type="number"
              min={0}
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              required
              className={inputCls}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            Delivery fee below threshold (₹)
            <input
              type="number"
              min={0}
              value={flatFee}
              onChange={(e) => setFlatFee(e.target.value)}
              required
              className={inputCls}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            Stock reservation (minutes)
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
      </fieldset>
      {[
        {
          title: "Business & contact",
          description:
            "Verified seller information and delivery details shown to customers.",
          policy: false,
        },
        {
          title: "Policies & about",
          description:
            "Approved return, cancellation, privacy and terms text, plus your business story.",
          policy: true,
        },
      ].map((group) => (
        <details key={group.title} className="admin-card">
          <summary className="min-h-11 cursor-pointer text-base font-semibold">
            {group.title}
          </summary>
          <p className="mt-2 text-sm leading-6 text-muted">
            {group.description} Leave unknown facts blank.
          </p>
          <fieldset
            disabled={saving}
            className="mt-5 grid gap-5 sm:grid-cols-2"
          >
            <legend className="sr-only">{group.title}</legend>
            {Object.entries(DETAIL_FIELDS)
              .filter(
                ([key]) =>
                  (key.endsWith("Policy") || key === "aboutInformation") ===
                  group.policy,
              )
              .map(([key, label]) => (
                <label
                  key={key}
                  className={`flex flex-col gap-2 text-sm ${group.policy || ["businessAddress", "grievanceContact", "dispatchInformation", "deliveryInformation"].includes(key) ? "sm:col-span-2" : ""}`}
                >
                  {label}
                  {[
                    "legalName",
                    "supportEmail",
                    "supportPhone",
                    "gstin",
                  ].includes(key) ? (
                    <input
                      type={
                        key === "supportEmail"
                          ? "email"
                          : key === "supportPhone"
                            ? "tel"
                            : "text"
                      }
                      value={details[key]}
                      onChange={(event) =>
                        setDetails({ ...details, [key]: event.target.value })
                      }
                    maxLength={5000}
                      className={inputCls}
                    />
                  ) : (
                    <textarea
                      value={details[key]}
                      onChange={(event) =>
                        setDetails({ ...details, [key]: event.target.value })
                      }
                      maxLength={5000}
                      rows={group.policy ? 5 : 2}
                      className={inputCls}
                    />
                  )}
                </label>
              ))}
          </fieldset>
        </details>
      ))}
      <details className="admin-card">
        <summary className="min-h-11 cursor-pointer text-base font-semibold">Business location & profiles</summary>
        <p className="mt-2 text-sm leading-6 text-muted">SatvaStones is based in Vapi, Gujarat and sells online across India. Keep street address and PIN code blank until verified. Add official profiles using HTTPS URLs, one per line.</p>
        <fieldset disabled={saving} className="mt-5 grid gap-5 sm:grid-cols-2">
          <legend className="sr-only">Business location & profiles</legend>
          {Object.entries({ addressStreet: "Street address", addressLocality: "City", addressRegion: "State", addressPostalCode: "PIN code", googleMapsUrl: "Google Maps place or directions URL (physical shop only)" }).map(([key, label]) => (
            <label key={key} className="flex flex-col gap-2 text-sm">{label}<input
              value={localDetails[key as keyof typeof localDetails]}
              onChange={(event) => setLocalDetails({ ...localDetails, [key]: event.target.value })}
              type={key === "googleMapsUrl" ? "url" : "text"}
              maxLength={key === "addressPostalCode" ? 6 : key === "googleMapsUrl" ? 2048 : 500}
              inputMode={key === "addressPostalCode" ? "numeric" : undefined}
              className={inputCls}
            /></label>
          ))}
          <label className="flex flex-col gap-2 text-sm sm:col-span-2">Official brand profiles<textarea value={profiles} onChange={(event) => setProfiles(event.target.value)} rows={3} className={inputCls} /></label>
          <label className="flex items-start gap-3 text-sm sm:col-span-2"><input type="checkbox" checked={physicalStore} onChange={(event) => setPhysicalStore(event.target.checked)} className="mt-1" /><span>We operate a verified shop where customers can visit in person. Online-only businesses should leave this off. A complete address and support phone are required before physical-store information is published.</span></label>
        </fieldset>
      </details>
      <details className="admin-card">
        <summary className="min-h-11 cursor-pointer text-base font-semibold">
          Search appearance
        </summary>
        <p className="mt-2 text-sm leading-6 text-muted">
          Homepage and shop search snippets. Edit collection copy in Categories
          and item copy in Products.
        </p>
        <fieldset disabled={saving} className="mt-5 grid gap-5 sm:grid-cols-2">
          <legend className="sr-only">Search appearance</legend>
          <label className="flex flex-col gap-2 text-sm">
            Homepage title
            <input
              value={homeSeoTitle}
              onChange={(e) => setHomeSeoTitle(e.target.value)}
              maxLength={160}
              className={inputCls}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            Shop title
            <input
              value={shopSeoTitle}
              onChange={(e) => setShopSeoTitle(e.target.value)}
              maxLength={160}
              className={inputCls}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            Homepage description
            <textarea
              value={homeSeoDescription}
              onChange={(e) => setHomeSeoDescription(e.target.value)}
              maxLength={320}
              rows={3}
              className={inputCls}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            Shop description
            <textarea
              value={shopSeoDescription}
              onChange={(e) => setShopSeoDescription(e.target.value)}
              maxLength={320}
              rows={3}
              className={inputCls}
            />
          </label>
        </fieldset>
      </details>
    </form>
  );
}
