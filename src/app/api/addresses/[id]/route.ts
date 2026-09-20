import { errorResponse, successResponse } from "@/lib/errors";
import { requireUserId } from "@/lib/require-user";
import { addressInputSchema } from "@/schemas/checkout";
import { deleteAddress, updateAddress } from "@/services/address-service";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx): Promise<Response> {
  try {
    const userId = await requireUserId();
    const { id } = await ctx.params;
    const input = addressInputSchema.partial().parse(await req.json());
    return successResponse(await updateAddress(userId, id, input));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_req: Request, ctx: Ctx): Promise<Response> {
  try {
    const userId = await requireUserId();
    const { id } = await ctx.params;
    await deleteAddress(userId, id);
    return successResponse({ deleted: true });
  } catch (error) {
    return errorResponse(error);
  }
}
