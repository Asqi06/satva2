import type { Metadata } from "next";

/** Keep public information pages' search and share descriptions in sync. */
export function pageMetadata(path: string, title: string, description: string): Metadata {
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", siteName: "SatvaStones", locale: "en_IN", url: path, title, description },
    twitter: { card: "summary_large_image", title, description },
  };
}
