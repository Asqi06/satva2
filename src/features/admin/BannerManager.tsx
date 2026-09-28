"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type { BannerDTO } from "@/services/banner-service";

const emptyForm = {
  title: "",
  subtitle: "",
  link: "/shop",
  sortOrder: 0,
  isActive: true,
};

/** Hero banner list + create/edit/delete. Images upload via the product uploader. */
export function BannerManager() {
  const [rows, setRows] = useState<BannerDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [image, setImage] = useState<{
    publicId: string;
    secureUrl: string;
    alt: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/banners");
      const body = (await res.json()) as {
        success: boolean;
        data?: { banners: BannerDTO[] };
        error?: { message: string };
      };
      if (!body.success || !body.data)
        throw new Error(body.error?.message ?? "Load failed");
      setRows(body.data.banners);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  // Mount fetch of the banner list (async load, not a render cascade).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const uploadImage = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    setNotice(null);
    try {
      if (file.size > 4 * 1024 * 1024) {
        throw new Error(
          `${file.name}: too large — use JPG/PNG/WebP under 4MB.`,
        );
      }
      const data = new FormData();
      data.append("file", file);
      const res = await fetch("/api/admin/uploads", {
        method: "POST",
        body: data,
      });
      let body: unknown;
      try {
        body = await res.json();
      } catch {
        throw new Error(
          `Upload failed (server ${res.status}) — check Cloudinary keys on Vercel and use JPG/PNG/WebP under 4MB.`,
        );
      }
      const parsed = body as {
        success: boolean;
        data?: { publicId: string; secureUrl: string };
        error?: { message: string };
      };
      if (!parsed.success || !parsed.data)
        throw new Error(parsed.error?.message ?? "Upload failed");
      setImage({
        publicId: parsed.data.publicId,
        secureUrl: parsed.data.secureUrl,
        alt: form.title || "Banner",
      });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const startEdit = (row: BannerDTO) => {
    setEditingId(row.id);
    setForm({
      title: row.title,
      subtitle: row.subtitle ?? "",
      link: row.link,
      sortOrder: row.sortOrder,
      isActive: row.isActive,
    });
    setImage(row.image);
    const editor = document.getElementById("banner-editor");
    editor?.scrollIntoView({ block: "start", behavior: "auto" });
    editor
      ?.querySelector<HTMLInputElement>("input")
      ?.focus({ preventScroll: true });
  };

  const cancel = () => {
    setEditingId(null);
    setForm(emptyForm);
    setImage(null);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    if (!image && !editingId) {
      setNotice("Upload a banner image first.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || undefined,
        ...(image ? { image: { ...image, alt: image.alt || form.title } } : {}),
        link: form.link.trim(),
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
      };
      const url = editingId
        ? `/api/admin/banners/${editingId}`
        : "/api/admin/banners";
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await res.json()) as {
        success: boolean;
        error?: { message: string };
      };
      if (!body.success) throw new Error(body.error?.message ?? "Save failed");
      setNotice(editingId ? "Banner updated." : "Banner created.");
      cancel();
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const removeOne = async (row: BannerDTO) => {
    if (!window.confirm(`Delete banner "${row.title}"?`)) return;
    const res = await fetch(`/api/admin/banners/${row.id}`, {
      method: "DELETE",
    });
    const body = (await res.json()) as {
      success: boolean;
      error?: { message: string };
    };
    if (!body.success) setNotice(body.error?.message ?? "Delete failed");
    else await load();
  };

  const inputCls = "admin-input";

  return (
    <div>
      <p className="admin-eyebrow">Homepage</p>
      <h1 className="admin-title">Hero banners</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        The first active banner by sort order supplies the homepage photo,
        title, subtitle and link. Use a clear image without embedded text; the
        storefront crops it to fit. Hide a banner by switching off Active.
      </p>

      {notice && (
        <p
          role="status"
          className="mt-4 border border-primary/30 bg-primary/10 p-3 text-sm text-ink"
        >
          {notice}
        </p>
      )}

      <form id="banner-editor" onSubmit={save} className="admin-card mt-6 p-5">
        <h2 className="text-base font-semibold text-ink">
          {editingId ? "Edit banner" : "New banner"}
        </h2>
        <fieldset disabled={saving} className="mt-4 text-ink">
          <legend className="sr-only">Banner details</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              Title
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                maxLength={120}
                className={inputCls}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Link (e.g. /shop?category=rings)
              <input
                value={form.link}
                onChange={(e) => setForm({ ...form, link: e.target.value })}
                required
                maxLength={512}
                className={inputCls}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              Subtitle
              <input
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                maxLength={280}
                className={inputCls}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Sort order
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm({ ...form, sortOrder: Number(e.target.value) })
                }
                className={inputCls}
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  setForm({ ...form, isActive: e.target.checked })
                }
                className="h-4 w-4 accent-primary"
              />
              Active
            </label>
          </div>
          <div className="mt-4">
            <label className="block border border-dashed border-light-gray p-4 text-center text-sm text-muted hover:border-primary/60 hover:text-ink">
              {uploading
                ? "Uploading…"
                : image
                  ? "Replace image (JPG/WebP ≤ 4MB)"
                  : "Upload banner image (wide, JPG/WebP ≤ 4MB)"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                disabled={uploading}
                onChange={(e) => void uploadImage(e.target.files)}
                className="sr-only"
              />
            </label>
            {image && (
              <>
                <span className="relative mt-3 block h-32 w-full overflow-hidden rounded-lg border border-light-gray">
                  <Image
                    src={image.secureUrl}
                    alt=""
                    fill
                    sizes="50vw"
                    className="object-cover"
                  />
                </span>
                <label className="mt-3 flex flex-col gap-1 text-sm text-ink">
                  Image alt text
                  <input
                    value={image.alt}
                    onChange={(e) =>
                      setImage({ ...image, alt: e.target.value })
                    }
                    required
                    maxLength={200}
                    className={inputCls}
                  />
                </label>
              </>
            )}
          </div>
        </fieldset>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={saving || uploading}
            className="btn-primary"
          >
            {saving ? "Saving…" : editingId ? "Save changes" : "Create banner"}
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

      <ul className="mt-4 space-y-3">
        {rows.map((r) => (
          <li
            key={r.id}
            className="admin-card flex flex-col gap-3 p-3 text-sm sm:flex-row sm:items-center sm:gap-4"
          >
            <span className="relative block h-20 w-full shrink-0 overflow-hidden rounded-lg bg-slate-50 sm:h-14 sm:w-24">
              <Image
                src={r.image.secureUrl}
                alt=""
                fill
                sizes="(min-width: 640px) 96px, 100vw"
                loading="lazy"
                className="object-cover"
              />
            </span>
            <span className="min-w-0 flex-1">
              <strong className="text-ink">{r.title}</strong>
              <span className="block truncate text-muted">
                {r.isActive ? "Active" : "Hidden"} → {r.link}
              </span>
            </span>
            <span className="flex gap-4 text-muted">
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
          </li>
        ))}
        {rows.length === 0 && !loading && (
          <li className="border border-light-gray p-8 text-center text-sm text-muted">
            No banners — the homepage shows the brand hero instead.
          </li>
        )}
        {loading && (
          <li className="p-8 text-center text-sm text-muted">Loading…</li>
        )}
      </ul>
    </div>
  );
}
