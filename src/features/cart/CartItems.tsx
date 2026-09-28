"use client";
import Link from "next/link";
import { useState } from "react";
import { CloudinaryImage as Image } from "@/components/CloudinaryImage";
import { useBag } from "./CartProvider";
import { formatINR } from "@/utils/format";

export function CartItems({ onNavigate }: { onNavigate?: () => void }) {
  const { lines, setQty, remove } = useBag();
  const [busy, setBusy] = useState<string | null>(null);
  const update = async (key: string, qty: number) => { setBusy(key); try { await setQty(key, qty); } finally { setBusy(null); } };
  return <ul className="divide-y divide-light-gray">{lines.map(line => <li key={line.key} className="flex gap-4 py-5">
    <Link href={`/products/${line.slug}${line.variantSku ? `?variant=${encodeURIComponent(line.variantSku)}` : ""}`} onClick={onNavigate} tabIndex={-1} aria-hidden="true" className="relative h-28 w-20 shrink-0 bg-cream">{line.image && <Image src={line.image.secureUrl} alt="" fill sizes="80px" className="object-cover" />}</Link>
    <div className="min-w-0 flex-1"><Link href={`/products/${line.slug}${line.variantSku ? `?variant=${encodeURIComponent(line.variantSku)}` : ""}`} onClick={onNavigate} className="clamp-2 text-sm font-medium hover:underline">{line.name}</Link>
      {line.variantSku && <p className="mt-1 text-xs text-muted">{line.variantLabel || line.variantSku}</p>}
      <p className="mt-2 text-sm font-semibold">{formatINR(line.price * line.qty)}{line.qty > 1 && <span className="ml-2 text-xs font-normal text-muted">{formatINR(line.price)} each</span>}</p>
      {line.available === false && <p className="mt-2 text-xs text-primary">Unavailable. Remove this item to continue.</p>}{line.adjusted && <p className="mt-2 text-xs text-primary">Quantity adjusted to available stock.</p>}
      <div className="mt-3 flex flex-wrap items-center gap-x-4"><div role="group" aria-label={`Quantity for ${line.name}`} className="flex items-center border border-light-gray"><button type="button" aria-label="Decrease quantity" disabled={busy === line.key || line.qty <= 1} className="icon-button" onClick={() => void update(line.key, line.qty - 1)}>−</button><span className="min-w-6 text-center text-sm" aria-live="polite">{line.qty}</span><button type="button" aria-label="Increase quantity" disabled={busy === line.key || line.qty >= 99 || line.available === false} className="icon-button" onClick={() => void update(line.key, line.qty + 1)}>+</button></div><button type="button" disabled={busy === line.key} className="min-h-11 text-xs text-muted underline underline-offset-4" onClick={async () => { setBusy(line.key); try { await remove(line.key); } finally { setBusy(null); } }}>Remove</button></div>
    </div>
  </li>)}</ul>;
}
