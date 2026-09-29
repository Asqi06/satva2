"use client";
import { useState } from "react";
import { useBag } from "@/features/cart/CartProvider";
import { ProductCard } from "@/features/products/ProductCard";
import type { ProductListItem } from "@/services/product-service";

export function GarbaCollectionPicker({ products }: { products: ProductListItem[] }) {
  const { add, setDrawerOpen, lines, notice } = useBag();
  const [adding, setAdding] = useState<string | null>(null);
  async function choose(product: ProductListItem) {
    setAdding(product.id);
    await add({ productId: product.id, qty: 1, name: product.name, slug: product.slug, price: product.price, image: product.images[0] });
    setDrawerOpen(false); setAdding(null);
  }
  return <>{notice && <p role="status" className="mt-4 text-sm text-primary">{notice}</p>}<div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">{products.map(product => {
    const quantity = lines.filter(l => l.productId === product.id).reduce((n, l) => n + l.qty, 0);
    return <div key={product.id} className="flex flex-col"><ProductCard product={product} /><button className="btn-primary mt-4 w-full !px-2 !text-xs" disabled={adding !== null || !product.inStock} onClick={() => void choose(product)}>{adding === product.id ? "Adding…" : quantity ? `Add another · ${quantity} in bag` : "Add to my selection +"}</button></div>;
  })}</div></>;
}
