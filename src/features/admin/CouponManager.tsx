"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminCouponRow } from "@/services/coupon-admin-service";
import { formatINR } from "@/utils/format";

const emptyForm = {
  code: "",
  type: "PERCENTAGE",
  value: "10",
  minimumOrderValue: "0",
  maximumDiscount: "",
  firstOrderOnly: false,
  usageLimit: "",
  perUserLimit: "",
  expiresAt: "",
  isActive: true,
};

/** Coupon list + create/edit/disable. Codes are immutable; used coupons can't be deleted. */
export function CouponManager() {
  const [rows, setRows] = useState<AdminCouponRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/coupons");
      const body = (await res.json()) as {
        success: boolean;
        data?: { coupons: AdminCouponRow[] };
        error?: { message: string };
      };
      if (!body.success || !body.data) throw new Error(body.error?.message ?? "Load failed");
      setRows(body.data.coupons);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  // Mount fetch of the coupon list (async load, not a render cascade).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const startEdit = (row: AdminCouponRow) => {
    setEditingId(row.id);
    setForm({
      code: row.code,
      type: row.type,
      value: String(row.value),
      minimumOrderValue: String(row.minimumOrderValue),
      maximumDiscount: row.maximumDiscount !== undefined ? String(row.maximumDiscount) : "",
      firstOrderOnly: row.firstOrderOnly,
      usageLimit: row.usageLimit !== undefined ? String(row.usageLimit) : "",
      perUserLimit: row.perUserLimit !== undefined ? String(row.perUserLimit) : "",
      expiresAt: row.expiresAt ? row.expiresAt.slice(0, 16) : "",
      isActive: row.isActive,
    });
  };

  const cancel = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    try {
      const payload = {
        ...(editingId ? {} : { code: form.code }),
        type: form.type,
        value: Number(form.value),
        minimumOrderValue: Number(form.minimumOrderValue) || 0,
        ...(form.maximumDiscount ? { maximumDiscount: Number(form.maximumDiscount) } : {}),
        firstOrderOnly: form.firstOrderOnly,
        ...(form.usageLimit ? { usageLimit: Number(form.usageLimit) } : {}),
        ...(form.perUserLimit ? { perUserLimit: Number(form.perUserLimit) } : {}),
        ...(form.expiresAt ? { expiresAt: new Date(form.expiresAt).toISOString() } : {}),
        isActive: form.isActive,
      };
      const url = editingId ? `/api/admin/coupons/${editingId}` : "/api/admin/coupons";
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await res.json()) as { success: boolean; error?: { message: string } };
      if (!body.success) throw new Error(body.error?.message ?? "Save failed");
      setNotice(editingId ? "Coupon updated." : "Coupon created.");
      cancel();
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Save failed");
    }
  };

  const toggleActive = async (row: AdminCouponRow) => {
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/coupons/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !row.isActive }),
      });
      const body = (await res.json()) as { success: boolean; error?: { message: string } };
      if (!body.success) throw new Error(body.error?.message ?? "Update failed");
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Update failed");
    }
  };

  const removeOne = async (row: AdminCouponRow) => {
    if (!window.confirm(`Delete coupon ${row.code}? Only unused coupons can be deleted.`)) return;
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/coupons/${row.id}`, { method: "DELETE" });
      const body = (await res.json()) as { success: boolean; error?: { message: string } };
      if (!body.success) throw new Error(body.error?.message ?? "Delete failed");
      setNotice("Coupon deleted.");
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Delete failed");
    }
  };

  const inputCls = "rounded-xl border border-ink/15 bg-ivory px-3 py-2 text-sm";

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-clay">Offers</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">Coupons</h1>

      {notice && (
        <p role="status" className="mt-4 rounded-2xl border border-ink/10 bg-white/60 p-3 text-sm">
          {notice}
        </p>
      )}

      <form onSubmit={save} className="mt-6 rounded-2xl border border-ink/10 bg-white/60 p-5">
        <h2 className="font-display text-2xl">{editingId ? "Edit coupon" : "New coupon"}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            Code{editingId ? " (locked)" : ""}
            <input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              disabled={!!editingId}
              required={!editingId}
              maxLength={32}
              placeholder="WELCOME10"
              className={`${inputCls} font-mono uppercase disabled:opacity-60`}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Type
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputCls}>
              <option value="PERCENTAGE">Percentage</option>
              <option value="FIXED">Fixed (₹)</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Value{form.type === "PERCENTAGE" ? " (1–100)" : " (₹)"}
            <input type="number" min={1} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required className={inputCls} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Min order (₹)
            <input type="number" min={0} value={form.minimumOrderValue} onChange={(e) => setForm({ ...form, minimumOrderValue: e.target.value })} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Max discount (₹, % only)
            <input type="number" min={1} value={form.maximumDiscount} onChange={(e) => setForm({ ...form, maximumDiscount: e.target.value })} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Usage limit (blank = ∞)
            <input type="number" min={1} value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Per-user limit
            <input type="number" min={1} value={form.perUserLimit} onChange={(e) => setForm({ ...form, perUserLimit: e.target.value })} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Expires
            <input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className={inputCls} />
          </label>
          <span className="flex items-end gap-6 pb-2 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.firstOrderOnly} onChange={(e) => setForm({ ...form, firstOrderOnly: e.target.checked })} className="h-4 w-4 accent-[#b34a2b]" />
              First order only
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 accent-[#b34a2b]" />
              Active
            </label>
          </span>
        </div>
        <div className="mt-4 flex gap-2">
          <button type="submit" className="rounded-full bg-ink px-6 py-2 text-sm font-medium text-ivory hover:bg-clay">
            {editingId ? "Save changes" : "Create coupon"}
          </button>
          {editingId && (
            <button type="button" onClick={cancel} className="rounded-full border border-ink/20 px-6 py-2 text-sm">
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-ink/10 bg-white/60">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-ink/60">
              <th className="p-3">Code</th>
              <th className="p-3">Offer</th>
              <th className="p-3">Uses</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-ink/5 last:border-0">
                <td className="p-3 font-mono font-semibold">{r.code}</td>
                <td className="p-3">
                  {r.type === "PERCENTAGE" ? `${r.value}%` : formatINR(r.value)}
                  {r.maximumDiscount !== undefined && r.type === "PERCENTAGE" && (
                    <span className="text-ink/60"> up to {formatINR(r.maximumDiscount)}</span>
                  )}
                </td>
                <td className="p-3">
                  {r.usageCount}
                  {r.usageLimit !== undefined && <span className="text-ink/60"> / {r.usageLimit}</span>}
                </td>
                <td className="p-3">{r.isActive ? "Active" : "Disabled"}</td>
                <td className="p-3">
                  <span className="flex gap-3">
                    <button type="button" onClick={() => startEdit(r)} className="underline underline-offset-4">
                      Edit
                    </button>
                    <button type="button" onClick={() => void toggleActive(r)} className="underline underline-offset-4">
                      {r.isActive ? "Disable" : "Enable"}
                    </button>
                    <button type="button" onClick={() => void removeOne(r)} className="underline underline-offset-4 hover:text-clay">
                      Delete
                    </button>
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && !loading && (
              <tr><td colSpan={5} className="p-8 text-center text-ink/60">No coupons yet.</td></tr>
            )}
            {loading && (
              <tr><td colSpan={5} className="p-8 text-center text-ink/60">Loading…</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
