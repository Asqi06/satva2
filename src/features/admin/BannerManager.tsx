"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type { BannerDTO } from "@/services/banner-service";

const emptyForm = { title: "", subtitle: "", link: "/shop", sortOrder: 0, isActive: true };

/** Hero banner list + create/edit/delete. Images upload via the product uploader. */
export function BannerManager() {
  const [rows, setRows] = useState<BannerDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [image, setImage] = useState<{ publicId: string; secureUrl: string; alt: string } | null>(null);
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
      if (!body.success || !body.data) throw new Error(body.error?.message ?? "Load failed");
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
      const data = new FormData();
      data.append("file", file);
      const res = await fetch("/api/admin/uploads", { method: "POST", body: data });
      const body = (await res.json()) as {
        success: boolean;
        data?: { publicId: string; secureUrl: string };
        error?: { message: string };
      };
      if (!body.success || !body.data) throw new Error(body.error?.message ?? "Upload failed");
      setImage({ publicId: body.data.publicId, secureUrl: body.data.secureUrl, alt: form.title || "Banner" });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const startEdit = (row: BannerDTO) => {
    setEditingId(row.id);
    setForm({ title: row.title, subtitle: row.subtitle ?? "", link: row.link, sortOrder: row.sortOrder, isActive: row.isActive });
    setImage(row.image);
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
    try {
      const payload = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || undefined,
        ...(image ? { image: { ...image, alt: image.alt || form.title } } : {}),
        link: form.link.trim(),
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
      };
      const url = editingId ? `/api/admin/banners/${editingId}` : "/api/admin/banners";
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await res.json()) as { success: boolean; error?: { message: string } };
      if (!body.success) throw new Error(body.error?.message ?? "Save failed");
      setNotice(editingId ? "Banner updated." : "Banner created.");
      cancel();
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Save failed");
    }
  };

  const removeOne = async (row: BannerDTO) => {
    if (!window.confirm(`Delete banner "${row.title}"?`)) return;
    const res = await fetch(`/api/admin/banners/${row.id}`, { method: "DELETE" });
    const body = (await res.json()) as { success: boolean; error?: { message: string } };
    if (!body.success) setNotice(body.error?.message ?? "Delete failed");
    else await load();
  };

  const inputCls = "rounded-xl border border-ink/15 bg-ivory px-3 py-2 text-sm";

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-clay">Homepage</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">Hero banners</h1>

      {notice && (
        <p role="status" className="mt-4 rounded-2xl border border-ink/10 bg-white/60 p-3 text-sm">
          {notice}
        </p>
      )}

      <form onSubmit={save} className="mt-6 rounded-2xl border border-ink/10 bg-white/60 p-5">
        <h2 className="font-display text-2xl">{editingId ? "Edit banner" : "New banner"}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            Title
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required maxLength={120} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Link (e.g. /shop?category=rings)
            <input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} required maxLength={512} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            Subtitle
            <input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} maxLength={280} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Sort order
            <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} className={inputCls} />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 accent-[#b34a2b]" />
            Active
          </label>
        </div>
        <div className="mt-4">
          <label className="block rounded-2xl border border-dashed border-ink/25 p-4 text-center text-sm hover:border-ink">
            {uploading ? "Uploading…" : image ? "Replace image" : "Upload banner image (wide, JPG/WebP)"}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={uploading} onChange={(e) => void uploadImage(e.target.files)} className="sr-only" />
          </label>
          {image && (
            <span className="relative mt-3 block h-32 w-full overflow-hidden rounded-xl">
              <Image src={image.secureUrl} alt="" fill sizes="50vw" className="object-cover" />
            </span>
          )}
        </div>
        <div className="mt-4 flex gap-2">
          <button type="submit" disabled={uploading} className="rounded-full bg-ink px-6 py-2 text-sm font-medium text-ivory hover:bg-clay disabled:opacity-60">
            {editingId ? "Save changes" : "Create banner"}
          </button>
          {editingId && (
            <button type="button" onClick={cancel} className="rounded-full border border-ink/20 px-6 py-2 text-sm">
              Cancel
            </button>
          )}
        </div>
      </form>

      <ul className="mt-4 space-y-3">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center gap-4 rounded-2xl border border-ink/10 bg-white/60 p-3 text-sm">
            <span className="relative block h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-ivory">
              <Image src={r.image.secureUrl} alt="" fill sizes="96px" className="object-cover" />
            </span>
            <span className="flex-1">
              <strong>{r.title}</strong>
              <span className="block text-ink/60">{r.isActive ? "Active" : "Hidden"} → {r.link}</span>
            </span>
            <button type="button" onClick={() => startEdit(r)} className="underline underline-offset-4">Edit</button>
            <button type="button" onClick={() => void removeOne(r)} className="underline underline-offset-4 hover:text-clay">Delete</button>
          </li>
        ))}
        {rows.length === 0 && !loading && (
          <li className="rounded-2xl border border-ink/10 bg-white/30 p-8 text-center text-sm text-ink/60">
            No banners — the homepage shows the brand hero instead.
          </li>
        )}
        {loading && <li className="p-8 text-center text-sm text-ink/60">Loading…</li>}
      </ul>
    </div>
  );
}
