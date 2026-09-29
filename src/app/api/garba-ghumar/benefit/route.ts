import { requireUserId } from "@/lib/require-user";
import { errorResponse, successResponse } from "@/lib/errors";
import { limitOrThrow } from "@/lib/rate-limit";
import { getGarbaBenefit } from "@/services/garba-benefit-service";

export async function GET(req: Request) {
  try {
    const userId = await requireUserId();
    limitOrThrow(req, "garba-benefit", 60, 60_000, userId);
    return successResponse({ benefit: await getGarbaBenefit(userId) });
  } catch (error) { return errorResponse(error); }
}
