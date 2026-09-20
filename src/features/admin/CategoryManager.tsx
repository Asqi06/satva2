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
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-clay">Organisation</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">Categories</h1>

      {notice && (
        <p role="status" className="mt-4 rounded-2xl border border-ink/10 bg-white/60 p-3 text-sm">
          {notice}
        </p>
      )}

      <form onSubmit={save} className="mt-6 rounded-2xl border border-ink/10 bg-white/60 p-5">
        <h2 className="font-display text-2xl">{editingId ? "Edit category" : "New category"}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            Name
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              maxLength={120}
              className="rounded-xl border border-ink/15 bg-ivory px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Slug (optional — auto from name)
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="rings"
              className="rounded-xl border border-ink/15 bg-ivory px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            Description
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              maxLength={2000}
              className="rounded-xl border border-ink/15 bg-ivory px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Sort order
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
              className="rounded-xl border border-ink/15 bg-ivory px-3 py-2"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
              className="h-4 w-4 accent-[#b34a2b]"
            />
            Published
          </label>
        </div>
        <div className="mt-4 flex gap-2">
          <button type="submit" className="rounded-full bg-ink px-6 py-2 text-sm font-medium text-ivory hover:bg-clay">
            {editingId ? "Save changes" : "Create category"}
          </button>
          {editingId && (
            <button type="button" onClick={cancel} className="rounded-full border border-ink/20 px-6 py-2 text-sm">
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-ink/10 bg-white/60">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-ink/60">
              <th className="p-3">Name</th>
              <th className="p-3">Slug</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-ink/5 last:border-0">
                <td className="p-3 font-medium">{r.name}</td>
                <td className="p-3 font-mono text-xs">{r.slug}</td>
                <td className="p-3">{r.isPublished ? "Live" : "Hidden"}</td>
                <td className="p-3">
                  <span className="flex gap-3">
                    <button type="button" onClick={() => startEdit(r)} className="underline underline-offset-4">
                      Edit
                    </button>
                    <button type="button" onClick={() => void removeOne(r)} className="underline underline-offset-4 hover:text-clay">
                      Delete
                    </button>
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-ink/60">
                  No categories yet.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-ink/60">
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
