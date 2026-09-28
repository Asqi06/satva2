import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-guard";
import { AppError } from "@/lib/errors";
import { AdminShell } from "@/features/admin/AdminShell";

/** Authorization stays on the server; the shell only handles navigation. */
export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AppError && error.status === 403) redirect("/account");
    if (error instanceof AppError && error.status === 401) redirect("/login");
    throw error;
  }
  return <AdminShell>{children}</AdminShell>;
}
