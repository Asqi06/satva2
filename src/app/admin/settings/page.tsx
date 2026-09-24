import type { Metadata } from "next";
import { SettingsForm } from "@/features/admin/SettingsForm";
import { getSettings } from "@/services/settings-service";

export const metadata: Metadata = {
  title: "Store settings — Admin",
  description: "Edit the announcement strip and shipping numbers.",
};

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getSettings();
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold">Storefront</p>
      <h1 className="mt-1 font-display italic text-4xl tracking-tight text-ivory">Store settings</h1>
      <p className="mt-2 max-w-xl text-sm text-ivory/45">
        Controls the announcement strip, shipping at checkout, and the homepage and shop search snippets.
      </p>
      <SettingsForm initial={settings} />
    </div>
  );
}
