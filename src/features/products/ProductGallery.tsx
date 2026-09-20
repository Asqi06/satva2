"use client";

import Image from "next/image";
import { useState } from "react";
import { cloudinaryResize } from "@/utils/cloudinary-url";

/** Editorial product gallery — fade transition between images, thumbnail strip at bottom. */
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
      <div className="flex aspect-[4/5] items-center justify-center border border-ink/[0.08] bg-[#f0ebe3] font-display italic text-8xl text-ink/20">
        S
      </div>
    );
  }

  return (
    <div className="lg:sticky lg:top-[76px]">
      {/* Main image */}
      <div className="relative aspect-[4/5] overflow-hidden bg-[#f0ebe3]">
        {images.map((img, i) => (
          <div
            key={img.secureUrl}
            className={`absolute inset-0 transition-opacity duration-400 ${
              i === active ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <Image
              src={cloudinaryResize(img.secureUrl, 1000)}
              alt={img.alt || productName}
              fill
              priority={i === 0}
              fetchPriority={i === 0 ? "high" : "auto"}
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        ))}
        {images.length > 1 && (
          <span className="absolute bottom-3 right-3 bg-[#0a0a0a]/70 px-2.5 py-1 font-mono text-[11px] text-ivory" aria-hidden="true">
            {active + 1} / {images.length}
          </span>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div
          className="mt-3 grid gap-2"
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
              className={`relative aspect-square overflow-hidden border transition-all ${
                i === active
                  ? "border-[#c8a96e] opacity-100"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
            <Image
              src={cloudinaryResize(img.secureUrl, 200)}
              alt=""
              fill
              sizes="15vw"
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
