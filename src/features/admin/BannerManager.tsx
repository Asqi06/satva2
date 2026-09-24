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
      if (file.size > 4 * 1024 * 1024) {
        throw new Error(`${file.name}: too large — use JPG/PNG/WebP under 4MB.`);
      }
      const data = new FormData();
      data.append("file", file);
      const res = await fetch("/api/admin/uploads", { method: "POST", body: data });
      let body: unknown;
      try {
        body = await res.json();
      } catch {
        throw new Error(`Upload failed (server ${res.status}) — check Cloudinary keys on Vercel and use JPG/PNG/WebP under 4MB.`);
      }
      const parsed = body as {
        success: boolean;
        data?: { publicId: string; secureUrl: string };
        error?: { message: string };
      };
      if (!parsed.success || !parsed.data) throw new Error(parsed.error?.message ?? "Upload failed");
      setImage({ publicId: parsed.data.publicId, secureUrl: parsed.data.secureUrl, alt: form.title || "Banner" });
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

  const inputCls = "admin-input";

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold">Homepage</p>
      <h1 className="mt-1 font-display italic text-4xl tracking-tight text-ivory">Hero banners</h1>
      <p className="mt-2 max-w-xl text-sm text-ivory/45">
        Upload a wide image without text; the title and subtitle stay editable over it. Lowest Sort order shows
        as the main hero; the 2nd banner shows as the sale strip below the viral
        products. Toggle Active to hide without deleting.
      </p>

      {notice && (
        <p role="status" className="mt-4 border border-gold/30 bg-gold/10 p-3 text-sm text-ivory">
          {notice}
        </p>
      )}

      <form onSubmit={save} className="mt-6 border border-ivory/[0.07] bg-ivory/[0.03] p-5">
        <h2 className="font-display italic text-2xl text-ivory">{editingId ? "Edit banner" : "New banner"}</h2>
        <div className="mt-4 grid gap-4 text-ivory/70 sm:grid-cols-2">
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
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 accent-gold" />
            Active
          </label>
        </div>
        <div className="mt-4">
          <label className="block border border-dashed border-ivory/25 p-4 text-center text-sm text-ivory/50 hover:border-gold/60 hover:text-ivory">
            {uploading ? "Uploading…" : image ? "Replace image (JPG/WebP ≤ 4MB)" : "Upload banner image (wide, JPG/WebP ≤ 4MB)"}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={uploading} onChange={(e) => void uploadImage(e.target.files)} className="sr-only" />
          </label>
          {image && (
            <>
              <span className="relative mt-3 block h-32 w-full overflow-hidden rounded-xl border border-ivory/10">
                <Image src={image.secureUrl} alt="" fill sizes="50vw" className="object-cover" />
              </span>
              <label className="mt-3 flex flex-col gap-1 text-sm text-ivory/70">Image alt text
                <input value={image.alt} onChange={(e) => setImage({ ...image, alt: e.target.value })} required maxLength={200} className={inputCls} />
              </label>
            </>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="submit" disabled={uploading} className="border border-gold bg-gold/10 px-6 py-2 text-sm font-medium text-gold hover:bg-gold hover:text-ink disabled:opacity-60">
            {editingId ? "Save changes" : "Create banner"}
          </button>
          {editingId && (
            <button type="button" onClick={cancel} className="border border-ivory/20 px-6 py-2 text-sm text-ivory/60 hover:border-ivory/40 hover:text-ivory">
              Cancel
            </button>
          )}
        </div>
      </form>

      <ul className="mt-4 space-y-3">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-col gap-3 border border-ivory/[0.07] bg-ivory/[0.03] p-3 text-sm sm:flex-row sm:items-center sm:gap-4">
            <span className="relative block h-20 w-full shrink-0 overflow-hidden rounded-lg bg-ivory/10 sm:h-14 sm:w-24">
              <Image src={r.image.secureUrl} alt="" fill sizes="(min-width: 640px) 96px, 100vw" loading="lazy" className="object-cover" />
            </span>
            <span className="min-w-0 flex-1">
              <strong className="text-ivory">{r.title}</strong>
              <span className="block truncate text-ivory/50">{r.isActive ? "Active" : "Hidden"} → {r.link}</span>
            </span>
            <span className="flex gap-4 text-ivory/60">
              <button type="button" onClick={() => startEdit(r)} className="underline underline-offset-4 hover:text-ivory">Edit</button>
              <button type="button" onClick={() => void removeOne(r)} className="underline underline-offset-4 hover:text-red-400">Delete</button>
            </span>
          </li>
        ))}
        {rows.length === 0 && !loading && (
          <li className="border border-ivory/[0.07] p-8 text-center text-sm text-ivory/35">
            No banners — the homepage shows the brand hero instead.
          </li>
        )}
        {loading && <li className="p-8 text-center text-sm text-ivory/35">Loading…</li>}
      </ul>
    </div>
  );
}
