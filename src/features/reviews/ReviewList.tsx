"use client";
import Image from "next/image";
import { useState } from "react";
import type { ReviewDTO } from "@/services/review-service";
import { ReviewForm } from "./ReviewForm";

export function ReviewList({ reviews, slug, viewerId }: { reviews: ReviewDTO[]; slug: string; viewerId?: string }) {
  const [sort, setSort] = useState("newest");
  const mine = reviews.find(r => r.mine);
  const sorted = [...reviews].sort((a,b) => sort === "highest" ? b.rating - a.rating : sort === "lowest" ? a.rating - b.rating : Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return <>
    {reviews.length > 1 && <label className="mt-5 flex items-center gap-3 text-sm">Sort reviews<select value={sort} onChange={e => setSort(e.target.value)} className="min-h-11 border border-light-gray bg-white px-3"><option value="newest">Newest</option><option value="highest">Highest rating</option><option value="lowest">Lowest rating</option></select></label>}
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        <ul className="space-y-4">
          {sorted.map((r) => (
            <li key={r.id} className="border-t border-light-gray py-5">
              <p className="flex items-center gap-2 text-sm">
                <span aria-label={`${r.rating} out of 5 stars`} className="text-clay">
                  {"★".repeat(r.rating)}
                  <span className="text-ink/25">{"★".repeat(5 - r.rating)}</span>
                </span>
                {r.isVerifiedPurchase && (
                  <span className="px-2 py-0.5 text-xs font-semibold text-green-800">
                    Verified purchase
                  </span>
                )}
              </p>
              {r.title && <p className="mt-1 font-semibold">{r.title}</p>}
              {r.comment && <p className="mt-1 text-sm leading-6 text-warm-gray">{r.comment}</p>}
              {r.images.length > 0 && (
                <ul aria-label="Review photos" className="mt-2 flex gap-2">
                  {r.images.map((img) => (
                    <li key={img.publicId} className="relative h-16 w-16 overflow-hidden rounded-lg bg-ivory">
                      <Image src={img.secureUrl} alt="" fill sizes="64px" className="object-cover" />
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-2 text-xs text-warm-gray">
                {r.authorName} · {new Date(r.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
              </p>
              {r.mine && (
                <div className="mt-2">
                  <ReviewForm slug={slug} existing={{ id: r.id, rating: r.rating, title: r.title, comment: r.comment, images: r.images }} />
                </div>
              )}
            </li>
          ))}
        </ul>
        <div>
          {viewerId ? (
            !mine && <ReviewForm slug={slug} />
          ) : (
            <div className="border-t border-light-gray py-5 text-sm">
              <a href="/login" className="underline underline-offset-4">
                Log in
              </a>{" "}
              to write a review.
            </div>
          )}
        </div>
      </div>
  </>;
}
