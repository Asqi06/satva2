import { auth } from "@/lib/auth";
import { listProductReviews } from "@/services/review-service";
import { ReviewList } from "./ReviewList";

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

  return (
    <section id="reviews" aria-label="Customer reviews" className="mt-16">
      <p className="eyebrow">Customer reviews</p>
      <h2 className="section-title mt-1 text-2xl sm:text-3xl">Customer reviews</h2>
      {list.count > 0 ? (
        <p className="mt-1 text-sm text-warm-gray">
          ★ {list.average.toFixed(1)} · {list.count} review{list.count === 1 ? "" : "s"} · Verified purchases are labelled
        </p>
      ) : (
        <p className="mt-1 text-sm text-warm-gray">No reviews yet — bought this piece? Yours could be first.</p>
      )}

      <ReviewList reviews={list.reviews} slug={slug} viewerId={viewerId} />
    </section>
  );
}
