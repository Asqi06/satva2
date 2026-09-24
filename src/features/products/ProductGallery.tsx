"use client";

import Image from "next/image";
import { useState } from "react";
import { cloudinaryLoader } from "@/utils/cloudinary-url";

/** Product image gallery. */
export function ProductGallery({
  images,
  productName,
}: {
  images: { secureUrl: string; alt: string }[];
  productName: string;
}) {
  const [active, setActive] = useState(0);
  const current = images[Math.min(active, images.length - 1)];

  if (!current) {
    return (
      <div className="flex aspect-[4/5] items-center justify-center rounded-2xl bg-cream font-display text-8xl text-maroon/30">
        S
      </div>
    );
  }

  return (
    <div>
      {/* Main image */}
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-light-gray bg-cream">
        {images.map((img, i) => (
          <div
            key={img.secureUrl}
            className={`absolute inset-0 transition-opacity duration-500 ${
              i === active ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <Image
              src={img.secureUrl}
              loader={cloudinaryLoader}
              alt={img.alt || productName}
              fill
              priority={i === 0}
              fetchPriority={i === 0 ? "high" : "auto"}
              sizes="(min-width: 1280px) 576px, (min-width: 1024px) calc((100vw - 128px) / 2), calc(100vw - 32px)"
              className="object-cover"
            />
          </div>
        ))}
        {images.length > 1 && (
          <span className="absolute bottom-4 right-4 rounded-full bg-ink/70 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-sm" aria-hidden="true">
            {active + 1} / {images.length}
          </span>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div
          className="mt-4 grid gap-3"
          style={{ gridTemplateColumns: `repeat(${Math.min(images.length, 6)}, 1fr)` }}
          role="group"
          aria-label="Product images"
        >
          {images.map((img, i) => (
            <button
              key={img.secureUrl}
              type="button"
              onClick={() => setActive(i)}
              aria-pressed={i === active}
              aria-label={`View image ${i + 1}`}
              className={`relative aspect-square overflow-hidden rounded-xl border-2 transition-colors ${
                i === active
                  ? "border-primary opacity-100"
                  : "border-transparent opacity-65 hover:opacity-100"
              }`}
            >
            <Image
              src={img.secureUrl}
              loader={cloudinaryLoader}
              alt=""
              fill
              sizes={`(min-width: 1280px) ${Math.floor(576 / Math.min(images.length, 6))}px, (min-width: 1024px) calc((100vw - 128px) / ${Math.min(images.length, 6) * 2}), calc((100vw - 44px) / ${Math.min(images.length, 6)})`}
              loading="lazy"
              decoding="async"
              className="object-cover"
            />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
