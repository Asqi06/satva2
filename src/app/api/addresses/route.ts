import { errorResponse, successResponse } from "@/lib/errors";
import { requireUserId } from "@/lib/require-user";
import { addressInputSchema } from "@/schemas/checkout";
import { addAddress, listAddresses } from "@/services/address-service";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    const userId = await requireUserId();
    return successResponse({ addresses: await listAddresses(userId) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    const userId = await requireUserId();
    const input = addressInputSchema.parse(await req.json());
    return successResponse(await addAddress(userId, input), 201);
  } catch (error) {
    return errorResponse(error);
  }
}
