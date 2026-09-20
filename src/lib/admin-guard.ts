import { auth } from "./auth";
import { AppError } from "./errors";

/**
 * Admin authorization for /api/admin/* routes. Throws 401 (logged out)
 * or 403 (non-admin). Never trust client-supplied role flags.
 */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    throw new AppError("UNAUTHORIZED", "Login required", 401);
  }
  if (session.user.role !== "ADMIN") {
    throw new AppError("FORBIDDEN", "Admin access required", 403);
  }
  return session.user;
}
