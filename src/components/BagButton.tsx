"use client";

import { useBag } from "@/features/cart/CartProvider";

/** Header bag button with live count. Opens the drawer. */
export function BagButton() {
  const { count, setDrawerOpen } = useBag();
  return (
    <button
      type="button"
      onClick={() => setDrawerOpen(true)}
      aria-label={`Open shopping bag, ${count} item${count === 1 ? "" : "s"}`}
      className="relative flex h-9 w-9 items-center justify-center rounded-full border border-ink/15 transition-colors hover:border-gold hover:text-gold"
    >
      {/* Bag icon */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>

      {/* Count badge */}
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] font-semibold text-ink"
        >
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}
