import { errorResponse, successResponse } from "@/lib/errors";
import { limitOrThrow } from "@/lib/rate-limit";
import { getCheckoutIdentity, getCheckoutOrderOwner } from "@/lib/checkout-identity";
import { Order } from "@/models/Order";
import { connectDb } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { verifyPaymentSchema } from "@/schemas/checkout";
import { verifyPayment } from "@/services/order-service";

/** Browser callback after Razorpay Checkout. Signature verified server-side. */
export async function POST(req: Request): Promise<Response> {
  try {
    await getCheckoutIdentity();
    const input = verifyPaymentSchema.parse(await req.json());
    await connectDb();
    const order = await Order.findOne({ razorpayOrderId: input.razorpayOrderId }).select("_id").lean();
    if (!order) throw new AppError("NOT_FOUND", "Order not found", 404);
    const userId = await getCheckoutOrderOwner(order._id.toString());
    limitOrThrow(req, "payments", 15, 60_000, userId);
    return successResponse({ order: await verifyPayment(userId, input) });
  } catch (error) {
    return errorResponse(error);
  }
}
