import { requireUserId } from "@/lib/require-user";
import { errorResponse, successResponse } from "@/lib/errors";
import { limitOrThrow } from "@/lib/rate-limit";
import { verifyPaymentSchema } from "@/schemas/checkout";
import { verifyGarbaPayment } from "@/services/garba-service";

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    limitOrThrow(req, "garba-verify", 15, 60_000, userId);
    return successResponse({ reward: await verifyGarbaPayment(userId, verifyPaymentSchema.parse(await req.json())) });
  } catch (error) { return errorResponse(error); }
}
