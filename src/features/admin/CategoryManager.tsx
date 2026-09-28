"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type { CategoryDTO } from "@/services/category-service";

type ApiEnvelope =
  | { success: true; data: { categories: CategoryDTO[] } | CategoryDTO }
  | { success: false; error: { code: string; message: string } };

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  searchTerms: "",
  seoTitle: "",
  seoDescription: "",
  parentId: "",
  isPublished: true,
  sortOrder: 0,
};

/** Category list + create/edit/delete. */
export function CategoryManager() {
  const [rows, setRows] = useState<CategoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [image, setImage] = useState<CategoryDTO["image"]>();
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (file?: File) => {
    if (!file) return;
    setNotice(null);
    if (file.size > 4 * 1024 * 1024)
      return setNotice("Use a JPG, PNG, WebP or AVIF image under 4 MB.");
    setUploading(true);
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await fetch("/api/admin/uploads", {
        method: "POST",
        body: data,
      });
      const body = (await res.json()) as {
        success: boolean;
        data?: { publicId: string; secureUrl: string };
        error?: { message: string };
      };
      if (!body.success || !body.data)
        throw new Error(body.error?.message ?? "Upload failed");
      setImage({ ...body.data, alt: `${form.name || "Jewellery"} category` });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories");
      const body = (await res.json()) as ApiEnvelope;
      if (!body.success) throw new Error(body.error.message);
      setRows((body.data as { categories: CategoryDTO[] }).categories);
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Failed to load categories",
      );
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
      searchTerms: (row.searchTerms ?? []).join(", "),
      seoTitle: row.seo.title ?? "",
      seoDescription: row.seo.description ?? "",
      parentId: row.parentId ?? "",
      isPublished: row.isPublished,
      sortOrder: row.sortOrder,
    });
    setImage(row.image);
    const editor = document.getElementById("category-editor");
    editor?.scrollIntoView({ block: "start", behavior: "auto" });
    editor
      ?.querySelector<HTMLInputElement>("input")
      ?.focus({ preventScroll: true });
  };

  const cancel = () => {
    setEditingId(null);
    setForm(emptyForm);
    setImage(undefined);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        description: form.description.trim(),
        searchTerms: [
          ...new Set(
            form.searchTerms
              .split(",")
              .map((term) => term.trim())
              .filter(Boolean),
          ),
        ],
        seoTitle: form.seoTitle.trim(),
        seoDescription: form.seoDescription.trim(),
        image: image
          ? {
              ...image,
              alt: image.alt.trim() || `${form.name.trim()} category`,
            }
          : null,
        parentId: form.parentId || null,
        isPublished: form.isPublished,
        sortOrder: Number(form.sortOrder) || 0,
      };
      const url = editingId
        ? `/api/admin/categories/${editingId}`
        : "/api/admin/categories";
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
    } finally {
      setSaving(false);
    }
  };

  const removeOne = async (row: CategoryDTO) => {
    if (
      !window.confirm(
        `Delete "${row.name}"? Only empty categories can be deleted.`,
      )
    )
      return;
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/categories/${row.id}`, {
        method: "DELETE",
      });
      const body = (await res.json()) as {
        success: boolean;
        error?: { message: string };
      };
      if (!body.success)
        throw new Error(body.error?.message ?? "Delete failed");
      setNotice("Category deleted.");
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Delete failed");
    }
  };

  return (
    <div>
      <p className="admin-eyebrow">Organisation</p>
      <h1 className="admin-title">Categories</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Up to six published categories appear in the homepage “Shop by category”
        row. Upload each image here, add a descriptive alt, and set the sort
        order. The description and SEO fields also shape the category shop page.
      </p>

      {notice && (
        <p
          role="status"
          className="mt-4 border border-primary/30 bg-primary/10 p-3 text-sm text-ink"
        >
          {notice}
        </p>
      )}

      <form
        id="category-editor"
        onSubmit={save}
        className="admin-card mt-6 p-5"
      >
        <h2 className="text-base font-semibold text-ink">
          {editingId ? "Edit category" : "New category"}
        </h2>
        <fieldset
          disabled={saving}
          className="mt-4 grid gap-4 text-ink sm:grid-cols-2"
        >
          <legend className="sr-only">Category details</legend>
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
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              maxLength={2000}
              rows={3}
              className="admin-input"
            />
          </label>
          <details className="admin-disclosure sm:col-span-2">
            <summary>Search appearance & aliases</summary>
            <div className="space-y-4 pt-3">
              {" "}
              <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                Search words and Hinglish aliases (comma separated)
                <input
                  value={form.searchTerms}
                  onChange={(e) =>
                    setForm({ ...form, searchTerms: e.target.value })
                  }
                  placeholder="Alternate names shoppers use for this category"
                  className="admin-input"
                />
                <span className="text-xs text-muted">
                  Use words shoppers actually use for this category. Maximum 20.
                </span>
              </label>
              <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                Search result title
                <input
                  value={form.seoTitle}
                  onChange={(e) =>
                    setForm({ ...form, seoTitle: e.target.value })
                  }
                  maxLength={160}
                  placeholder={`Buy ${form.name || "Category"} Online in India | SatvaStones`}
                  className="admin-input"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                Search result description
                <textarea
                  value={form.seoDescription}
                  onChange={(e) =>
                    setForm({ ...form, seoDescription: e.target.value })
                  }
                  maxLength={320}
                  rows={2}
                  className="admin-input"
                />
              </label>
            </div>
          </details>
          <div className="sm:col-span-2">
            <label className="block cursor-pointer border border-dashed border-light-gray p-4 text-center text-sm hover:border-primary/60">
              {uploading
                ? "Uploading…"
                : image
                  ? "Replace category image"
                  : "Upload category image (square crop works best, up to 4 MB)"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                disabled={uploading}
                onChange={(e) => void uploadImage(e.target.files?.[0])}
                className="sr-only"
              />
            </label>
            {image && (
              <div className="mt-3 flex items-center gap-3">
                <span className="relative h-20 w-20 overflow-hidden rounded-lg">
                  <Image
                    src={image.secureUrl}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </span>
                <label className="flex flex-1 flex-col gap-1 text-sm">
                  Image alt text
                  <input
                    value={image.alt}
                    onChange={(e) =>
                      setImage({ ...image, alt: e.target.value })
                    }
                    maxLength={200}
                    required
                    className="admin-input"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setImage(undefined)}
                  className="text-xs underline"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
          <label className="flex flex-col gap-1 text-sm">
            Parent category
            <select
              value={form.parentId}
              onChange={(e) => setForm({ ...form, parentId: e.target.value })}
              className="admin-input"
            >
              <option value="">None</option>
              {rows
                .filter((row) => row.id !== editingId)
                .map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Sort order
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) =>
                setForm({ ...form, sortOrder: Number(e.target.value) })
              }
              className="admin-input"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) =>
                setForm({ ...form, isPublished: e.target.checked })
              }
              className="h-4 w-4 accent-primary"
            />
            Published
          </label>
        </fieldset>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={saving || uploading}
            className="btn-primary"
          >
            {saving
              ? "Saving…"
              : editingId
                ? "Save changes"
                : "Create category"}
          </button>
          {editingId && (
            <button
              type="button"
              disabled={saving}
              onClick={cancel}
              className="border border-light-gray px-6 py-2 text-sm text-muted hover:border-light-gray hover:text-ink"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Mobile cards — no horizontal scroll */}
      <ul className="mt-4 space-y-3 md:hidden">
        {rows.map((r) => (
          <li key={r.id} className="admin-card p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-medium text-ink">{r.name}</span>
              <span
                className={`shrink-0 rounded-md px-2.5 py-0.5 text-[11px] font-semibold ${r.isPublished ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-muted"}`}
              >
                {r.isPublished ? "Live" : "Hidden"}
              </span>
            </div>
            <p className="mt-0.5 font-mono text-xs text-muted">/{r.slug}</p>
            <div className="mt-2 flex gap-4 text-sm text-muted">
              <button
                type="button"
                onClick={() => startEdit(r)}
                className="underline underline-offset-4 hover:text-ink"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => void removeOne(r)}
                className="underline underline-offset-4 hover:text-red-700"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
        {rows.length === 0 && !loading && (
          <li className="border border-light-gray p-8 text-center text-sm text-muted">
            No categories yet.
          </li>
        )}
        {loading && (
          <li className="border border-light-gray p-8 text-center text-sm text-muted">
            Loading…
          </li>
        )}
      </ul>

      <div className="mt-4 hidden overflow-x-auto rounded-lg border border-light-gray md:block">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-light-gray bg-slate-50">
              <th className="p-3 text-xs font-medium text-muted">Name</th>
              <th className="p-3 text-xs font-medium text-muted">Slug</th>
              <th className="p-3 text-xs font-medium text-muted">Status</th>
              <th className="p-3 text-xs font-medium text-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-b border-light-gray last:border-0 hover:bg-slate-50"
              >
                <td className="p-3 font-medium text-ink">{r.name}</td>
                <td className="p-3 font-mono text-xs text-muted">{r.slug}</td>
                <td className="p-3">
                  <span
                    className={`px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${r.isPublished ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-muted"}`}
                  >
                    {r.isPublished ? "Live" : "Hidden"}
                  </span>
                </td>
                <td className="p-3">
                  <span className="flex gap-3 text-muted">
                    <button
                      type="button"
                      onClick={() => startEdit(r)}
                      className="underline underline-offset-4 hover:text-ink"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeOne(r)}
                      className="underline underline-offset-4 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-muted">
                  No categories yet.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-muted">
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
