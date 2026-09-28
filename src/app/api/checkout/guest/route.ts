import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { AppError, errorResponse, successResponse } from "@/lib/errors";
import { limitOrThrow } from "@/lib/rate-limit";
import { createGuestToken, GUEST_COOKIE, GUEST_MAX_AGE, readGuestToken } from "@/lib/guest-token";
import { cartMergeSchema } from "@/schemas/cart";
import { replaceGuestCart } from "@/services/cart-service";

export async function POST(req: Request): Promise<Response> {
  try {
    if (req.headers.get("origin") && req.headers.get("origin") !== new URL(req.url).origin) throw new AppError("FORBIDDEN", "Request origin not allowed", 403);
    limitOrThrow(req, "guest-checkout", 15, 60_000);
    if ((await auth())?.user?.id) throw new AppError("CONFLICT", "You are signed in. Use your account cart.", 409);
    const input = cartMergeSchema.parse(await req.json());
    const jar = await cookies();
    let id = await readGuestToken(jar.get(GUEST_COOKIE)?.value);
    if (!id) {
      const created = await createGuestToken(); id = created.id;
      jar.set(GUEST_COOKIE, created.token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: GUEST_MAX_AGE });
    }
    return successResponse(await replaceGuestCart(id, input));
  } catch (error) { return errorResponse(error); }
}
