/**
 * Build a lightweight Cloudinary delivery URL.
 *
 * Stored `secureUrl`s point at the original upload (often multi-MB).
 * Injecting `f_auto,q_auto,w_<width>` after `/upload/` lets Cloudinary
 * serve a correctly-sized, auto-format/compressed variant.
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

/** Let next/image generate a responsive srcset without routing Cloudinary images through /_next/image. */
export function cloudinaryLoader({ src, width }: { src: string; width: number }): string {
  return cloudinaryResize(src, width);
}
