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
      <p className="admin-eyebrow">Storefront</p>
      <h1 className="admin-title">Store settings</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Controls the announcement strip, shipping at checkout, and the homepage and shop search snippets.
      </p>
      <SettingsForm initial={settings} />
    </div>
  );
}
