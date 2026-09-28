"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CategoryDTO } from "@/services/category-service";
import type { ProductListItem } from "@/services/product-service";
import { CloudinaryImage } from "@/components/CloudinaryImage";
import { Icon } from "@/components/Icon";
import { analytics } from "@/lib/analytics";
import { formatINR } from "@/utils/format";

export function SearchDialog({ open, onClose, categories }: { open: boolean; onClose: () => void; categories: CategoryDTO[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const results = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) dialog.current?.showModal(); else dialog.current?.close();
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);
  useEffect(() => {
    if (!open || !query.trim()) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setPending(true); setError("");
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}&limit=6`, { signal: controller.signal });
        const body = await response.json();
        if (!response.ok || !body.success) throw new Error("Search is unavailable. Try viewing all results.");
        if (!controller.signal.aborted) setProducts(body.data.products);
      } catch {
        if (!controller.signal.aborted) setError("Search is unavailable. Try viewing all results.");
      } finally { if (!controller.signal.aborted) setPending(false); }
    }, 200);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [open, query]);

  const term = query.trim().toLowerCase();
  const matches = categories.filter(category => [category.name, ...(category.searchTerms ?? [])].some(value => value.toLowerCase().includes(term))).slice(0, 6);
  const close = () => { onClose(); setError(""); };
  const navigateResult = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowDown", "ArrowUp"].includes(event.key)) return;
    const links = Array.from(results.current?.querySelectorAll<HTMLAnchorElement>("a") ?? []);
    const index = links.indexOf(document.activeElement as HTMLAnchorElement);
    const next = event.key === "ArrowDown" ? index + 1 : index - 1;
    if (links.length) { event.preventDefault(); links[(next + links.length) % links.length]?.focus(); }
  };

  return <dialog ref={dialog} onCancel={close} onClick={event => { if (event.target === dialog.current) close(); }} aria-label="Search jewellery" className="search-dialog">
    <div className="p-5 sm:p-8">
      <div className="mb-5 flex items-center justify-between"><h2 className="section-title text-2xl">Find your next piece</h2><button className="icon-button" type="button" aria-label="Close search" onClick={close}><Icon name="close" /></button></div>
      <form action="/shop" role="search" onSubmit={() => { if (term) analytics.search(query.trim()); close(); }} className="flex border-b border-ink pb-3">
        <label className="flex flex-1 items-center gap-3"><Icon name="search" /><span className="sr-only">Search products and categories</span><input autoFocus name="q" type="search" maxLength={100} value={query} onChange={event => { setQuery(event.target.value); setProducts([]); setPending(!!event.target.value.trim()); setError(""); }} onKeyDown={event => { if (event.key === "ArrowDown") { event.preventDefault(); results.current?.querySelector<HTMLAnchorElement>("a")?.focus(); } }} placeholder="Try rings, jhumka or a product name" autoComplete="off" className="min-w-0 flex-1 border-0 bg-transparent py-2 outline-none" /></label>
        <button type="submit" className="icon-button" aria-label="View search results"><Icon name="arrow" /></button>
      </form>
      <div ref={results} onKeyDown={navigateResult} className="mt-6">
        <p className="eyebrow">{term ? "Matching categories" : "Shop by category"}</p>
        <div className="mt-3 flex flex-wrap gap-2">{(term ? matches : categories.slice(0, 6)).map(category => <Link key={category.id} onClick={close} href={`/shop?category=${category.slug}`} className="filter-chip">{category.name}</Link>)}</div>
        {term && <div aria-live="polite" className="mt-6">
          <p className="mb-3 text-sm text-muted">{pending ? "Searching…" : error || (products.length ? "Products" : "No exact match yet. Try earrings, rings or necklaces.")}</p>
          <ul className="divide-y divide-light-gray">{products.map(product => <li key={product.id}><Link onClick={close} href={`/products/${product.slug}`} className="flex items-center gap-4 py-3">
            <span className="relative h-16 w-14 shrink-0 bg-cream">{product.images[0] && <CloudinaryImage src={product.images[0].secureUrl} alt="" fill sizes="56px" className="object-cover" />}</span>
            <span className="min-w-0 flex-1"><span className="clamp-2 text-sm">{product.name}</span><span className="mt-1 block text-sm font-semibold">{product.priceFrom ? "From " : ""}{formatINR(product.price)}</span></span><Icon name="chevron" />
          </Link></li>)}</ul>
          <Link onClick={() => { analytics.search(query.trim()); close(); }} href={`/shop?q=${encodeURIComponent(query.trim())}`} className="mt-5 flex min-h-11 items-center justify-between border-t border-light-gray pt-3 text-sm font-semibold">View all results for “{query.trim()}”<Icon name="arrow" /></Link>
        </div>}
      </div>
    </div>
  </dialog>;
}
