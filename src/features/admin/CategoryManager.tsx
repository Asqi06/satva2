"use client";

import { useCallback, useEffect, useState } from "react";
import type { CategoryDTO } from "@/services/category-service";

type ApiEnvelope =
  | { success: true; data: { categories: CategoryDTO[] } | CategoryDTO }
  | { success: false; error: { code: string; message: string } };

const emptyForm = { name: "", slug: "", description: "", isPublished: true, sortOrder: 0 };

/** Category list + create/edit/delete. */
export function CategoryManager() {
  const [rows, setRows] = useState<CategoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories");
      const body = (await res.json()) as ApiEnvelope;
      if (!body.success) throw new Error(body.error.message);
      setRows((body.data as { categories: CategoryDTO[] }).categories);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Mount fetch: the canonical exception to set-state-in-effect (async load, not a render cascade).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const startEdit = (row: CategoryDTO) => {
    setEditingId(row.id);
    setForm({
      name: row.name,
      slug: row.slug,
      description: row.description ?? "",
      isPublished: row.isPublished,
      sortOrder: row.sortOrder,
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
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        description: form.description.trim() || undefined,
        isPublished: form.isPublished,
        sortOrder: Number(form.sortOrder) || 0,
      };
      const url = editingId ? `/api/admin/categories/${editingId}` : "/api/admin/categories";
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await res.json()) as ApiEnvelope;
      if (!body.success) throw new Error(body.error.message);
      setNotice(editingId ? "Category updated." : "Category created.");
      cancel();
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Save failed");
    }
  };

  const removeOne = async (row: CategoryDTO) => {
    if (!window.confirm(`Delete "${row.name}"? Only empty categories can be deleted.`)) return;
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/categories/${row.id}`, { method: "DELETE" });
      const body = (await res.json()) as { success: boolean; error?: { message: string } };
      if (!body.success) throw new Error(body.error?.message ?? "Delete failed");
      setNotice("Category deleted.");
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Delete failed");
    }
  };

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#c8a96e]">Organisation</p>
      <h1 className="mt-1 font-display italic text-4xl tracking-tight text-ivory">Categories</h1>

      {notice && (
        <p role="status" className="mt-4 border border-[#c8a96e]/30 bg-[#c8a96e]/10 p-3 text-sm text-ivory">
          {notice}
        </p>
      )}

      <form onSubmit={save} className="mt-6 border border-ivory/[0.07] bg-ivory/[0.03] p-5">
        <h2 className="font-display italic text-2xl text-ivory">{editingId ? "Edit category" : "New category"}</h2>
        <div className="mt-4 grid gap-4 text-ivory/70 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            Name
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              maxLength={120}
              className="admin-input"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Slug (optional — auto from name)
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="rings"
              className="admin-input"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            Description
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              maxLength={2000}
              className="admin-input"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Sort order
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
              className="admin-input"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
              className="h-4 w-4 accent-[#c8a96e]"
            />
            Published
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="submit" className="border border-[#c8a96e] bg-[#c8a96e]/10 px-6 py-2 text-sm font-medium text-[#c8a96e] hover:bg-[#c8a96e] hover:text-[#0a0a0a]">
            {editingId ? "Save changes" : "Create category"}
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
              <span className="truncate font-medium text-ivory">{r.name}</span>
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${r.isPublished ? "bg-emerald-400/15 text-emerald-400" : "bg-ivory/[0.07] text-ivory/40"}`}>
                {r.isPublished ? "Live" : "Hidden"}
              </span>
            </div>
            <p className="mt-0.5 font-mono text-xs text-ivory/45">/{r.slug}</p>
            <div className="mt-2 flex gap-4 text-sm text-ivory/60">
              <button type="button" onClick={() => startEdit(r)} className="underline underline-offset-4 hover:text-ivory">
                Edit
              </button>
              <button type="button" onClick={() => void removeOne(r)} className="underline underline-offset-4 hover:text-red-400">
                Delete
              </button>
            </div>
          </li>
        ))}
        {rows.length === 0 && !loading && (
          <li className="border border-ivory/[0.07] p-8 text-center text-sm text-ivory/35">
            No categories yet.
          </li>
        )}
        {loading && (
          <li className="border border-ivory/[0.07] p-8 text-center text-sm text-ivory/35">
            Loading…
          </li>
        )}
      </ul>

      <div className="mt-4 hidden overflow-x-auto border border-ivory/[0.07] md:block">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-ivory/[0.07] bg-ivory/[0.04]">
              <th className="p-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-ivory/30">Name</th>
              <th className="p-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-ivory/30">Slug</th>
              <th className="p-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-ivory/30">Status</th>
              <th className="p-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-ivory/30">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-ivory/[0.04] last:border-0 hover:bg-ivory/[0.02]">
                <td className="p-3 font-medium text-ivory">{r.name}</td>
                <td className="p-3 font-mono text-xs text-ivory/50">{r.slug}</td>
                <td className="p-3">
                  <span className={`px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${r.isPublished ? "bg-emerald-400/15 text-emerald-400" : "bg-ivory/[0.07] text-ivory/40"}`}>
                    {r.isPublished ? "Live" : "Hidden"}
                  </span>
                </td>
                <td className="p-3">
                  <span className="flex gap-3 text-ivory/55">
                    <button type="button" onClick={() => startEdit(r)} className="underline underline-offset-4 hover:text-ivory">
                      Edit
                    </button>
                    <button type="button" onClick={() => void removeOne(r)} className="underline underline-offset-4 hover:text-red-400">
                      Delete
                    </button>
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-ivory/30">
                  No categories yet.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-ivory/30">
                  Loading…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
