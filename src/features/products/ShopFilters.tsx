"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { analytics } from "@/lib/analytics";
import type { CategoryDTO } from "@/services/category-service";
import { PRODUCT_SORTS } from "@/schemas/product";

const SORT_LABELS: Record<(typeof PRODUCT_SORTS)[number], string> = {
  featured: "Featured",
  newest: "Newest",
  "price-asc": "Price ↑",
  "price-desc": "Price ↓",
  "best-selling": "Best selling",
  rating: "Top rated",
};

function setParam(params: URLSearchParams, key: string, value: string): void {
  params.set(key, value);
  params.delete("page");
}

/** Bold & playful filter bar — pill buttons, rounded search, bouncy toggles. */
export function ShopFilters({ categories }: { categories: CategoryDTO[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const currentCategory = searchParams.get("category") ?? "";
  const currentSort = searchParams.get("sort") ?? "featured";
  const inStockOnly = searchParams.get("inStock") === "true";

  const push = (mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    startTransition(() => router.push(`/shop?${params.toString()}`));
  };

  return (
    <div className="space-y-4">
      {/* Search row */}
      <form
        aria-label="Search products"
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim()) analytics.search(query.trim());
          push((p) => {
            if (query.trim()) p.set("q", query.trim());
            else p.delete("q");
            p.delete("page");
          });
        }}
      >
        <label className="relative flex-1">
          <span className="sr-only">Search jewellery</span>
          <svg
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="search"
            name="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search rings, jhumkas, oxidised, gifts under ₹499…"
            className="w-full rounded-full border-2 border-light-gray bg-white py-3 pl-11 pr-4 text-sm placeholder:text-muted focus:border-primary focus:outline-none transition-colors"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="btn-primary disabled:opacity-50"
        >
          {pending ? "…" : "Search"}
        </button>
      </form>

      {/* Filter pills row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Category pills */}
        <button
          type="button"
          onClick={() =>
            push((p) => {
              p.delete("category");
              p.delete("page");
            })
          }
          className={`rounded-full border-2 px-5 py-2 text-xs font-bold uppercase tracking-[0.12em] transition-all hover:scale-105 ${
            currentCategory === ""
              ? "border-ink bg-ink text-white shadow-lg"
              : "border-light-gray bg-white text-muted hover:border-primary hover:text-primary"
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() =>
              push((p) => setParam(p, "category", c.slug))
            }
            className={`rounded-full border-2 px-5 py-2 text-xs font-bold uppercase tracking-[0.12em] transition-all hover:scale-105 ${
              currentCategory === c.slug
                ? "border-primary bg-primary text-white shadow-lg shadow-primary/30"
                : "border-light-gray bg-white text-muted hover:border-primary hover:text-primary"
            }`}
          >
            {c.name}
          </button>
        ))}

        {/* Sort */}
        <select
          value={currentSort}
          onChange={(e) => push((p) => setParam(p, "sort", e.target.value))}
          aria-label="Sort products"
          className="ml-auto cursor-pointer rounded-full border-2 border-light-gray bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-warm-gray focus:border-primary focus:outline-none transition-colors"
        >
          {PRODUCT_SORTS.map((s) => (
            <option key={s} value={s}>
              {SORT_LABELS[s]}
            </option>
          ))}
        </select>

        {/* In stock toggle */}
        <label className="flex cursor-pointer items-center gap-2 rounded-full border-2 border-light-gray bg-white px-4 py-2 transition-colors hover:border-primary">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) =>
              push((p) => {
                if (e.target.checked) setParam(p, "inStock", "true");
                else {
                  p.delete("inStock");
                  p.delete("page");
                }
              })
            }
            className="sr-only"
          />
          <span
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              inStockOnly ? "bg-primary" : "bg-light-gray"
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                inStockOnly ? "translate-x-4" : "translate-x-1"
              }`}
            />
          </span>
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
            In stock
          </span>
        </label>
      </div>

      <span aria-live="polite" className="sr-only">
        {pending ? "Loading products" : ""}
      </span>
    </div>
  );
}
