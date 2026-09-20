import { auth } from "@/lib/auth";
import { AppError, errorResponse, successResponse } from "@/lib/errors";

/** Session-dependent — never prerender. */
export const dynamic = "force-dynamic";

/** Current session profile (safe fields only). 401 when logged out. */
export async function GET(): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AppError("UNAUTHORIZED", "Login required", 401);
    }
    return successResponse({
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
      role: session.user.role,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
