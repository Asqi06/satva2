import { AppError, errorResponse, successResponse } from "@/lib/errors";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { contactSchema } from "@/schemas/content";
import { saveContactMessage } from "@/services/content-service";

/** Contact inbox: validated, honeypotted, rate-limited. */
export async function POST(req: Request): Promise<Response> {
  try {
    const gate = rateLimit(`contact:${clientIp(req)}`, 3, 60_000);
    if (!gate.ok) {
      throw new AppError("RATE_LIMITED", "Too many messages — try again in a minute", 429);
    }
    const input = contactSchema.parse(await req.json());
    const result = await saveContactMessage(input);
    return successResponse({ received: true, id: result.id });
  } catch (error) {
    return errorResponse(error);
  }
}
