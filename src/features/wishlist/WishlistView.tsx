"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useBag } from "@/features/cart/CartProvider";
import type { WishlistView } from "@/services/wishlist-service";
import { formatINR } from "@/utils/format";

/** Saved pieces. Requires login (server layout + proxy enforce it). */
export function WishlistView() {
  const router = useRouter();
  const { refresh } = useBag();
  const [view, setView] = useState<WishlistView | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/wishlist");
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    const body = (await res.json()) as { success: boolean; data?: WishlistView; error?: { message: string } };
    if (body.success && body.data) setView(body.data);
    else setNotice(body.error?.message ?? "Failed to load wishlist");
  }, [router]);

  // Mount fetch of the member wishlist (async load, not a render cascade).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const remove = async (productId: string) => {
    const res = await fetch(`/api/wishlist/${productId}`, { method: "DELETE" });
    const body = (await res.json()) as { success: boolean; data?: WishlistView };
    if (body.success && body.data) setView(body.data);
  };

  const moveToBag = async (productId: string) => {
    const res = await fetch(`/api/wishlist/${productId}/move-to-cart`, { method: "POST" });
    const body = (await res.json()) as {
      success: boolean;
      data?: { wishlist: WishlistView };
      error?: { message: string };
    };
    if (body.success && body.data) {
      setView(body.data.wishlist);
      await refresh();
    } else {
      setNotice(body.error?.message ?? "Could not move to bag");
    }
  };

  if (!view) {
    return (
      <div className="min-h-full flex-1 bg-ivory px-6 py-12 text-ink sm:px-10">
        <p className="text-sm text-ink/60">{notice ?? "Loading your wishlist…"}</p>
      </div>
    );
  }

  return (
    <div className="min-h-full flex-1 bg-ivory text-ink">
      <div className="mx-auto w-full max-w-6xl px-6 py-12 sm:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-clay">Saved</p>
        <h1 className="mt-2 font-display text-5xl tracking-tight">Wishlist</h1>
        {notice && (
          <p role="status" className="mt-4 rounded-2xl border border-ink/10 bg-white/60 p-3 text-sm">
            {notice}
          </p>
        )}
        {view.items.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-ink/10 bg-white/60 p-12 text-center">
            <p className="font-display text-2xl">Nothing saved yet.</p>
            <Link href="/shop" className="mt-4 inline-block rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-ivory hover:bg-clay">
              Find something to love
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {view.items.map((item) => (
              <article key={item.productId} className="overflow-hidden rounded-2xl border border-ink/10 bg-white/60">
                <Link href={`/products/${item.slug}`} aria-label={item.name}>
                  <span className="relative block aspect-[4/5] overflow-hidden bg-ivory">
                    {item.image ? (
                      <Image src={item.image.secureUrl} alt="" fill sizes="25vw" className="object-cover" />
                    ) : (
                      <span className="flex h-full items-center justify-center font-display text-4xl text-ink/30">S</span>
                    )}
                  </span>
                </Link>
                <div className="p-4">
                  <h2 className="font-display text-lg leading-snug">
                    <Link href={`/products/${item.slug}`} className="hover:underline underline-offset-4">
                      {item.name}
                    </Link>
                  </h2>
                  <p className="mt-1 font-semibold">{formatINR(item.price)}</p>
                  {!item.available && <p className="text-xs text-clay">Currently unavailable</p>}
                  <span className="mt-2 flex flex-wrap gap-2 text-sm">
                    <button
                      type="button"
                      disabled={!item.available}
                      onClick={() => void moveToBag(item.productId)}
                      className="rounded-full bg-ink px-4 py-1.5 text-ivory hover:bg-clay disabled:opacity-40"
                    >
                      Move to bag
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove(item.productId)}
                      className="underline underline-offset-4 text-ink/70 hover:text-clay"
                    >
                      Remove
                    </button>
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
