import { errorResponse, successResponse } from "@/lib/errors";
import { limitOrThrow } from "@/lib/rate-limit";
import { requireUserId } from "@/lib/require-user";
import { couponValidateSchema } from "@/schemas/checkout";
import { getCartView } from "@/services/cart-service";
import { validateCoupon } from "@/services/coupon-service";

/** Validate a coupon against the member's current server bag. */
export async function POST(req: Request): Promise<Response> {
  try {
    const userId = await requireUserId();
    limitOrThrow(req, "coupons-validate", 10, 60_000, userId);
    const { code } = couponValidateSchema.parse(await req.json());
    const cart = await getCartView(userId);
    const lines = cart.items
      .filter((i) => i.available)
      .map((i) => ({
        productId: i.productId,
        categoryId: i.categoryId,
        qty: i.qty,
        unitPrice: i.price,
      }));
    const subtotal = lines.reduce((n, l) => n + l.qty * l.unitPrice, 0);
    const check = await validateCoupon(code, userId, lines, subtotal);
    return successResponse({ ...check, subtotal });
  } catch (error) {
    return errorResponse(error);
  }
}
