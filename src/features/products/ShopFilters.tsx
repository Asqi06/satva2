"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Icon } from "@/components/Icon";
import { analytics } from "@/lib/analytics";
import type { CategoryDTO } from "@/services/category-service";
import type { CatalogueFilters } from "@/services/product-service";
import { PRODUCT_SORTS } from "@/schemas/product";

const labels = { featured: "Featured", newest: "Newest", "price-asc": "Price: low to high", "price-desc": "Price: high to low", "best-selling": "Best selling", rating: "Top rated" };
const filterLabels: Record<string, string> = { color: "Colour", size: "Size", material: "Material", minPrice: "Minimum price", maxPrice: "Maximum price", category: "Category", inStock: "In stock", minRating: "Rating", minDiscount: "Discount", collection: "Collection", q: "Search" };

export function ShopFilters({ categories, facets }: { categories: CategoryDTO[]; facets: CatalogueFilters }) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const dialog = useRef<HTMLDialogElement>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const push = (mutate: (value: URLSearchParams) => void) => {
    const next = new URLSearchParams(params.toString()); mutate(next); next.delete("page");
    const changed = Object.keys(filterLabels).filter(key => key !== "q" && params.get(key) !== next.get(key));
    if (changed.length) analytics.filterApplied(changed, [...next.keys()].filter(key => key !== "q" && filterLabels[key]).length);
    startTransition(() => router.push(`/shop?${next}`, { scroll: false }));
  };
  const set = (key: string, value: string) => push(next => { if (value) next.set(key, value); else next.delete(key); });
  const close = () => { dialog.current?.close(); setFilterOpen(false); document.body.style.overflow = ""; };
  const active = [...params.entries()].filter(([key]) => filterLabels[key]);
  const controls = <div className="space-y-6">
    <label className="block"><span className="field-label">Category</span><select className="field" value={params.get("category") ?? ""} onChange={e => set("category", e.target.value)}><option value="">All jewellery</option>{categories.map(c => <option key={c.id} value={c.slug}>{c.name} ({c.productCount ?? 0})</option>)}</select></label>
    <fieldset><legend className="field-label">Price (₹)</legend><form key={`${params.get("minPrice")}:${params.get("maxPrice")}`} onSubmit={e => { e.preventDefault(); const values = new FormData(e.currentTarget); push(next => { for (const key of ["minPrice", "maxPrice"]) { const value = String(values.get(key) ?? ""); if (value) next.set(key, value); else next.delete(key); } }); }}><div className="flex gap-2"><label className="min-w-0 flex-1"><span className="sr-only">Minimum price</span><input type="number" min="0" name="minPrice" defaultValue={params.get("minPrice") ?? ""} placeholder="Min" className="field" /></label><label className="min-w-0 flex-1"><span className="sr-only">Maximum price</span><input type="number" min={params.get("minPrice") ?? "0"} name="maxPrice" defaultValue={params.get("maxPrice") ?? ""} placeholder="Max" className="field" /></label></div><button className="mt-2 min-h-11 text-sm underline underline-offset-4" disabled={pending}>Apply price</button></form></fieldset>
    {(["color", "size", "material"] as const).filter(key => facets[key].length > 1).map(key => <fieldset key={key}><legend className="field-label">{filterLabels[key]}</legend><div className="flex flex-wrap gap-x-5">{facets[key].map(item => <label className="flex min-h-11 items-center gap-2 text-sm" key={item.value}><input type="checkbox" checked={(params.get(key) ?? "").split("|").includes(item.value)} onChange={e => { const selected = (params.get(key) ?? "").split("|").filter(Boolean); set(key, (e.target.checked ? [...selected, item.value] : selected.filter(v => v !== item.value)).join("|")); }} className="h-4 w-4 accent-primary" />{item.value}<span className="text-xs text-muted">({item.count})</span></label>)}</div></fieldset>)}
    <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={params.get("inStock") === "true"} onChange={e => set("inStock", e.target.checked ? "true" : "")} className="h-4 w-4 accent-primary" />In stock only</label>
    <p className="text-xs leading-5 text-muted">Option counts show products in this collection before other filters.</p>
  </div>;
  return <div aria-busy={pending} className="border-b border-light-gray pb-5">
    <form aria-label="Search products" className="mb-5 flex max-w-xl gap-2" onSubmit={e => { e.preventDefault(); const q = String(new FormData(e.currentTarget).get("q") ?? "").trim(); if (q) analytics.search(q); set("q", q); }}>
      <label className="min-w-0 flex-1"><span className="sr-only">Search jewellery</span><input key={params.get("q")} id="shop-search" name="q" type="search" maxLength={100} defaultValue={params.get("q") ?? ""} placeholder="Search jewellery, jhumka or SKU" className="field" /></label><button className="btn-ghost" disabled={pending}>Search</button>
    </form>
    <div className="flex items-center justify-between gap-3">
      <button type="button" aria-expanded={filterOpen} className="btn-ghost lg:hidden" onClick={() => { dialog.current?.showModal(); setFilterOpen(true); document.body.style.overflow = "hidden"; }}><Icon name="filter" />Filters {active.length > 0 && `(${active.length})`}</button>
      <details className="hidden max-w-3xl flex-1 lg:block"><summary className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium"><Icon name="filter" />Filters<Icon name="chevron" /></summary><div className="py-5">{controls}</div></details>
      <label className="flex min-w-0 items-center gap-2 text-sm"><span className="text-muted">Sort</span><select value={params.get("sort") ?? "featured"} onChange={e => set("sort", e.target.value)} className="min-h-11 max-w-[180px] border border-light-gray bg-white px-2 text-sm" aria-label="Sort products">{PRODUCT_SORTS.map(sort => <option key={sort} value={sort}>{labels[sort]}</option>)}</select></label>
    </div>
    {active.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{active.map(([key, value]) => <button type="button" key={key} className="filter-chip" onClick={() => set(key, "")} aria-label={`Remove ${filterLabels[key]} filter`}>{filterLabels[key]}: {key === "category" ? categories.find(c => c.slug === value)?.name ?? value : value.replaceAll("|", ", ")}<Icon name="close" width="14" height="14" /></button>)}<button className="min-h-11 px-2 text-xs underline" onClick={() => push(next => { active.forEach(([key]) => next.delete(key)); })}>Clear all</button></div>}
    <dialog ref={dialog} className="menu-dialog !ml-auto !mr-0" onCancel={close} aria-labelledby="filter-title"><div className="flex items-center justify-between border-b border-light-gray p-5"><h2 id="filter-title" className="section-title text-2xl">Filters</h2><button type="button" className="icon-button" onClick={close} aria-label="Close filters"><Icon name="close" /></button></div><div className="p-5">{controls}</div><div className="sticky bottom-0 border-t border-light-gray bg-white p-5"><button type="button" disabled={pending} onClick={close} className="btn-primary w-full">{pending ? "Updating products…" : "View products"}</button></div></dialog>
    <span aria-live="polite" className="sr-only">{pending ? "Updating products" : ""}</span>
  </div>;
}
