"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatINR } from "@/utils/format";

export interface RecentPiece {
  slug: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  image?: { secureUrl: string; alt: string };
}

const KEY = "satvastones:recently-viewed:v1";
const MAX = 8;

export function readRecent(): RecentPiece[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as RecentPiece[]).slice(0, MAX) : [];
  } catch {
    return [];
  }
}

/**
 * Records this product view and renders other recently viewed pieces
 * (snapshot-based, no API needed). Rendered below the details section.
 */
export function RecentlyViewed({ current }: { current: RecentPiece }) {
  const [items, setItems] = useState<RecentPiece[]>([]);

  // Mount sync from localStorage (external store) — canonical exception.
  useEffect(() => {
    const previous = readRecent().filter((p) => p.slug !== current.slug);
    try {
      window.localStorage.setItem(KEY, JSON.stringify([current, ...previous].slice(0, MAX)));
    } catch {
      // Private mode etc. — viewing still works, history just isn't kept.
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(previous.slice(0, 4));
  }, [current]);

  if (items.length === 0) return null;

  return (
    <section aria-label="Recently viewed" className="mt-16">
      <h2 className="section-title text-2xl sm:text-3xl">Recently viewed</h2>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {items.map((p) => (
          <article key={p.slug} className="overflow-hidden">
            <Link href={`/products/${p.slug}`} aria-label={p.name}>
              <span className="relative block aspect-[4/5] overflow-hidden bg-ivory">
                {p.image ? (
                  <Image src={p.image.secureUrl} alt="" fill sizes="(min-width: 1280px) 286px, (min-width: 1024px) 23vw, 46vw" className="object-cover" />
                ) : (
                  <span className="flex h-full items-center justify-center font-display text-4xl text-ink/30">S</span>
                )}
              </span>
            </Link>
            <div className="pt-3">
              <h3 className="clamp-2 min-h-[2.8em] text-sm font-medium leading-[1.4]">
                <Link href={`/products/${p.slug}`} className="hover:underline underline-offset-4">
                  {p.name}
                </Link>
              </h3>
              <p className="mt-1 font-semibold">{formatINR(p.price)}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
