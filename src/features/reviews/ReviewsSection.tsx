import Image from "next/image";
import { auth } from "@/lib/auth";
import { listProductReviews } from "@/services/review-service";
import { ReviewForm } from "./ReviewForm";

/** Product reviews: aggregate header, verified list, write/edit form. */
export async function ReviewsSection({ slug }: { slug: string }) {
  const session = await auth().catch(() => null);
  const viewerId = session?.user?.id;
  let list;
  try {
    list = await listProductReviews(slug, viewerId);
  } catch {
    return null;
  }
  const mine = list.reviews.find((r) => r.mine);

  return (
    <section aria-label="Customer reviews" className="mt-16">
      <p className="eyebrow">Verified reviews</p>
      <h2 className="section-title mt-1 text-3xl">Worn & loved across India</h2>
      {list.count > 0 ? (
        <p className="mt-1 text-sm text-ink/70">
          ★ {list.average.toFixed(1)} · {list.count} verified review{list.count === 1 ? "" : "s"} · Only buyers can review
        </p>
      ) : (
        <p className="mt-1 text-sm text-ink/70">No reviews yet — bought this piece? Yours could be first.</p>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        <ul className="space-y-4">
          {list.reviews.map((r) => (
            <li key={r.id} className="rounded-2xl border border-ink/10 bg-white/60 p-4">
              <p className="flex items-center gap-2 text-sm">
                <span aria-label={`${r.rating} out of 5 stars`} className="text-clay">
                  {"★".repeat(r.rating)}
                  <span className="text-ink/25">{"★".repeat(5 - r.rating)}</span>
                </span>
                {r.isVerifiedPurchase && (
                  <span className="rounded-full bg-green-800/10 px-2 py-0.5 text-xs font-semibold text-green-800">
                    Verified purchase
                  </span>
                )}
              </p>
              {r.title && <p className="mt-1 font-semibold">{r.title}</p>}
              {r.comment && <p className="mt-1 text-sm leading-6 text-ink/80">{r.comment}</p>}
              {r.images.length > 0 && (
                <ul aria-label="Review photos" className="mt-2 flex gap-2">
                  {r.images.map((img) => (
                    <li key={img.publicId} className="relative h-16 w-16 overflow-hidden rounded-lg bg-ivory">
                      <Image src={img.secureUrl} alt="" fill sizes="64px" className="object-cover" />
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-2 text-xs text-ink/60">
                {r.authorName} · {new Date(r.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
              </p>
              {r.mine && (
                <div className="mt-2">
                  <ReviewForm slug={slug} existing={{ id: r.id, rating: r.rating, title: r.title, comment: r.comment, images: r.images }} />
                </div>
              )}
            </li>
          ))}
          {list.reviews.length === 0 && (
            <li className="rounded-2xl border border-ink/10 bg-white/30 p-6 text-sm text-ink/60">
              Nothing here yet.
            </li>
          )}
        </ul>
        <div>
          {viewerId ? (
            !mine && <ReviewForm slug={slug} />
          ) : (
            <div className="rounded-2xl border border-ink/10 bg-white/60 p-4 text-sm">
              <a href="/login" className="underline underline-offset-4">
                Log in
              </a>{" "}
              to write a review.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
