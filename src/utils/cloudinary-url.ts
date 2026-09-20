/**
 * Build a lightweight Cloudinary delivery URL.
 *
 * Stored `secureUrl`s point at the original upload (often multi-MB).
 * Injecting `f_auto,q_auto,w_<width>` after `/upload/` lets Cloudinary
 * serve a correctly-sized, auto-format/compressed variant instead —
 * the single biggest homepage LCP win.
 *
 * Non-Cloudinary URLs (or ones already carrying transforms) pass through.
 */
export function cloudinaryResize(url: string, width: number): string {
  if (!url || !url.includes("res.cloudinary.com")) return url;
  if (!url.includes("/image/upload/")) return url;
  if (url.includes("f_auto")) return url;
  const w = Math.max(1, Math.round(width));
  return url.replace("/image/upload/", `/image/upload/f_auto,q_auto,w_${w}/`);
}
