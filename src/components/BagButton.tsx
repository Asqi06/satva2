"use client";
import { useBag } from "@/features/cart/CartProvider";
import { Icon } from "./Icon";

export function BagButton() {
  const { count, setDrawerOpen } = useBag();
  return <button type="button" onClick={() => setDrawerOpen(true)} aria-label={`Open shopping bag, ${count} item${count === 1 ? "" : "s"}`} className="icon-button relative">
    <Icon name="bag" />
    {count > 0 && <span aria-hidden="true" className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">{count > 99 ? "99+" : count}</span>}
  </button>;
}
