"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ReviewImage {
  publicId: string;
  secureUrl: string;
}

/** Write/edit a review, photos included. Guests are sent to login on submit. */
export function ReviewForm({
  slug,
  existing,
}: {
  slug: string;
  existing?: { id: string; rating: number; title?: string; comment?: string; images?: ReviewImage[] };
}) {
  const router = useRouter();
  const [rating, setRating] = useState(existing?.rating ?? 5);
  const [title, setTitle] = useState(existing?.title ?? "");
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [images, setImages] = useState<ReviewImage[]>(existing?.images ?? []);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(!existing);

  const uploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (images.length + files.length > 4) {
      setError("At most 4 photos per review.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const data = new FormData();
        data.append("file", file);
        const res = await fetch("/api/uploads", { method: "POST", body: data });
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        const body = (await res.json()) as {
          success: boolean;
          data?: { publicId: string; secureUrl: string };
          error?: { message: string };
        };
        if (!body.success || !body.data) throw new Error(body.error?.message ?? "Upload failed");
        const { publicId, secureUrl } = body.data;
        setImages((prev) => [...prev, { publicId, secureUrl }]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const url = existing ? `/api/reviews/${existing.id}` : `/api/products/${slug}/reviews`;
      const res = await fetch(url, {
        method: existing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, title: title.trim() || undefined, comment: comment.trim() || undefined, images }),
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const body = (await res.json()) as { success: boolean; error?: { message: string } };
      if (!body.success) throw new Error(body.error?.message ?? "Could not save review");
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save review");
    } finally {
      setBusy(false);
    }
  };

  if (existing && !editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-sm underline underline-offset-4"
      >
        Edit your review
      </button>
    );
  }

  const inputCls = "w-full rounded-xl border border-ink/15 bg-ivory px-3 py-2 text-sm";
  return (
    <form onSubmit={submit} className="rounded-2xl border border-ink/10 bg-white/60 p-4">
      <fieldset>
        <legend className="text-sm font-medium">Your rating</legend>
        <div className="mt-1 flex gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n === 1 ? "" : "s"}`}
              onClick={() => setRating(n)}
              className={`px-1 text-2xl ${n <= rating ? "text-clay" : "text-ink/25"}`}
            >
              ★
            </button>
          ))}
        </div>
      </fieldset>
      <label className="mt-3 flex flex-col gap-1 text-sm">
        Headline (optional)
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} className={inputCls} />
      </label>
      <label className="mt-3 flex flex-col gap-1 text-sm">
        Review (optional)
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} maxLength={2000} className={inputCls} />
      </label>
      <div className="mt-3">
        <label className="block rounded-xl border border-dashed border-ink/25 p-3 text-center text-sm hover:border-ink">
          {uploading ? "Uploading…" : images.length === 0 ? "Add photos (optional, up to 4)" : "Add more photos"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            disabled={uploading || images.length >= 4}
            onChange={(e) => void uploadFiles(e.target.files)}
            className="sr-only"
          />
        </label>
        {images.length > 0 && (
          <ul className="mt-2 flex gap-2">
            {images.map((img) => (
              <li key={img.publicId} className="relative h-16 w-16 overflow-hidden rounded-lg bg-ivory">
                <Image src={img.secureUrl} alt="" fill sizes="64px" className="object-cover" />
                <button
                  type="button"
                  aria-label="Remove photo"
                  onClick={() => setImages((prev) => prev.filter((p) => p.publicId !== img.publicId))}
                  className="absolute right-0.5 top-0.5 rounded-full bg-ink/70 px-1.5 text-xs text-ivory"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-clay">
          {error}
        </p>
      )}
      <div className="mt-3 flex gap-2">
        <button type="submit" disabled={busy} className="rounded-full bg-ink px-6 py-2 text-sm font-medium text-ivory hover:bg-clay disabled:opacity-60">
          {busy ? "Saving…" : existing ? "Save changes" : "Post review"}
        </button>
        {existing && (
          <button type="button" onClick={() => setEditing(false)} className="rounded-full border border-ink/20 px-6 py-2 text-sm">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
