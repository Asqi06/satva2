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
      expiresAt: row.expiresAt ? new Date(row.expiresAt).toLocaleString("sv-SE").replace(" ", "T").slice(0, 16) : "",
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
        ...(editingId || form.maximumDiscount ? { maximumDiscount: form.maximumDiscount ? Number(form.maximumDiscount) : null } : {}),
        firstOrderOnly: form.firstOrderOnly,
        ...(editingId || form.usageLimit ? { usageLimit: form.usageLimit ? Number(form.usageLimit) : null } : {}),
        ...(editingId || form.perUserLimit ? { perUserLimit: form.perUserLimit ? Number(form.perUserLimit) : null } : {}),
        ...(editingId || form.expiresAt ? { expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null } : {}),
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

  const inputCls = "admin-input";

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold">Offers</p>
      <h1 className="mt-1 font-display italic text-4xl tracking-tight text-ivory">Coupons</h1>

      {notice && (
        <p role="status" className="mt-4 border border-gold/30 bg-gold/10 p-3 text-sm text-ivory">
          {notice}
        </p>
      )}

      <form onSubmit={save} className="mt-6 border border-ivory/[0.07] bg-ivory/[0.03] p-5">
        <h2 className="font-display italic text-2xl text-ivory">{editingId ? "Edit coupon" : "New coupon"}</h2>
        <div className="mt-4 grid gap-4 text-ivory/70 sm:grid-cols-3">
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
              <input type="checkbox" checked={form.firstOrderOnly} onChange={(e) => setForm({ ...form, firstOrderOnly: e.target.checked })} className="h-4 w-4 accent-gold" />
              First order only
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 accent-gold" />
              Active
            </label>
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="submit" className="border border-gold bg-gold/10 px-6 py-2 text-sm font-medium text-gold hover:bg-gold hover:text-ink">
            {editingId ? "Save changes" : "Create coupon"}
          </button>
          {editingId && (
            <button type="button" onClick={cancel} className="border border-ivory/20 px-6 py-2 text-sm text-ivory/60 hover:border-ivory/40 hover:text-ivory">
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Mobile cards — no horizontal scroll */}
      <ul className="mt-4 space-y-3 md:hidden">
        {rows.map((r) => (
          <li key={r.id} className="border border-ivory/[0.07] bg-ivory/[0.03] p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono font-semibold text-ivory">{r.code}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${r.isActive ? "bg-emerald-400/15 text-emerald-400" : "bg-ivory/[0.07] text-ivory/40"}`}>
                {r.isActive ? "Active" : "Disabled"}
              </span>
            </div>
            <p className="mt-1 text-sm text-ivory/70">
              {r.type === "PERCENTAGE" ? `${r.value}%` : formatINR(r.value)}
              {r.maximumDiscount !== undefined && r.type === "PERCENTAGE" && (
                <span> up to {formatINR(r.maximumDiscount)}</span>
              )}
              <span className="text-ivory/45"> · {r.usageCount}{r.usageLimit !== undefined && ` / ${r.usageLimit}`} used</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ivory/60">
              <button type="button" onClick={() => startEdit(r)} className="underline underline-offset-4 hover:text-ivory">
                Edit
              </button>
              <button type="button" onClick={() => void toggleActive(r)} className="underline underline-offset-4 hover:text-ivory">
                {r.isActive ? "Disable" : "Enable"}
              </button>
              <button type="button" onClick={() => void removeOne(r)} className="underline underline-offset-4 hover:text-red-400">
                Delete
              </button>
            </div>
          </li>
        ))}
        {rows.length === 0 && !loading && (
          <li className="border border-ivory/[0.07] p-8 text-center text-sm text-ivory/35">
            No coupons yet.
          </li>
        )}
        {loading && (
          <li className="border border-ivory/[0.07] p-8 text-center text-sm text-ivory/35">
            Loading…
          </li>
        )}
      </ul>

      <div className="mt-4 hidden overflow-x-auto border border-ivory/[0.07] md:block">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead>
            <tr className="border-b border-ivory/[0.07] bg-ivory/[0.04]">
              <th className="p-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-ivory/30">Code</th>
              <th className="p-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-ivory/30">Offer</th>
              <th className="p-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-ivory/30">Uses</th>
              <th className="p-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-ivory/30">Status</th>
              <th className="p-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-ivory/30">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-ivory/[0.04] last:border-0 hover:bg-ivory/[0.02]">
                <td className="p-3 font-mono font-semibold text-ivory">{r.code}</td>
                <td className="p-3 text-ivory/70">
                  {r.type === "PERCENTAGE" ? `${r.value}%` : formatINR(r.value)}
                  {r.maximumDiscount !== undefined && r.type === "PERCENTAGE" && (
                    <span className="text-ivory/45"> up to {formatINR(r.maximumDiscount)}</span>
                  )}
                </td>
                <td className="p-3 text-ivory/70">
                  {r.usageCount}
                  {r.usageLimit !== undefined && <span className="text-ivory/45"> / {r.usageLimit}</span>}
                </td>
                <td className="p-3">
                  <span className={`px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${r.isActive ? "bg-emerald-400/15 text-emerald-400" : "bg-ivory/[0.07] text-ivory/40"}`}>
                    {r.isActive ? "Active" : "Disabled"}
                  </span>
                </td>
                <td className="p-3">
                  <span className="flex gap-3 text-ivory/55">
                    <button type="button" onClick={() => startEdit(r)} className="underline underline-offset-4 hover:text-ivory">
                      Edit
                    </button>
                    <button type="button" onClick={() => void toggleActive(r)} className="underline underline-offset-4 hover:text-ivory">
                      {r.isActive ? "Disable" : "Enable"}
                    </button>
                    <button type="button" onClick={() => void removeOne(r)} className="underline underline-offset-4 hover:text-red-400">
                      Delete
                    </button>
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && !loading && (
              <tr><td colSpan={5} className="p-8 text-center text-ivory/30">No coupons yet.</td></tr>
            )}
            {loading && (
              <tr><td colSpan={5} className="p-8 text-center text-ivory/30">Loading…</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
