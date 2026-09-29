import { requireUserId } from "@/lib/require-user";
import { errorResponse, successResponse } from "@/lib/errors";
import { limitOrThrow } from "@/lib/rate-limit";
import { createGarbaPayment, getGarbaStatus } from "@/services/garba-service";

export async function GET(req: Request) {
  try {
    const userId = await requireUserId();
    limitOrThrow(req, "garba-status", 30, 60_000, userId);
    return successResponse(await getGarbaStatus(userId));
  } catch (error) { return errorResponse(error); }
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    limitOrThrow(req, "garba-payment", 5, 60_000, userId);
    return successResponse(await createGarbaPayment(userId));
  } catch (error) { return errorResponse(error); }
}
