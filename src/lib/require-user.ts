import { auth } from "./auth";
import { AppError } from "./errors";

/** Authenticated-user guard for customer APIs. Returns the user id. */
export async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AppError("UNAUTHORIZED", "Login required", 401);
  }
  return session.user.id;
}
