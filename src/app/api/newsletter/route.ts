import { AppError, errorResponse, successResponse } from "@/lib/errors";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { newsletterSchema } from "@/schemas/content";
import { subscribeNewsletter } from "@/services/content-service";

/** Newsletter signup: validated, honeypotted, rate-limited, idempotent. */
export async function POST(req: Request): Promise<Response> {
  try {
    const gate = rateLimit(`newsletter:${clientIp(req)}`, 5, 60_000);
    if (!gate.ok) {
      throw new AppError("RATE_LIMITED", "Too many signups — try again in a minute", 429);
    }
    const input = newsletterSchema.parse(await req.json());
    if ((input.company ?? "").trim() !== "") {
      return successResponse({ subscribed: true });
    }
    return successResponse(await subscribeNewsletter(input));
  } catch (error) {
    return errorResponse(error);
  }
}
