import { cookies } from "next/headers";
import { auth } from "./auth";
import { AppError } from "./errors";
import { GUEST_COOKIE, readGuestToken } from "./guest-token";
import { connectDb } from "./db";
import { Order } from "@/models/Order";

async function identities() {
  const [session, jar] = await Promise.all([auth(), cookies()]);
  return { member: session?.user?.id, guest: await readGuestToken(jar.get(GUEST_COOKIE)?.value) };
}

/** Checkout identities grant cart/order access only; account APIs still require sign-in. */
export async function getCheckoutIdentity(): Promise<{ id: string; guest: boolean }> {
  const identity = await identities();
  if (identity.member) return { id: identity.member, guest: false };
  if (identity.guest) return { id: identity.guest, guest: true };
  throw new AppError("UNAUTHORIZED", "Start guest checkout or sign in to continue", 401);
}

/** Also lets a shopper view their guest order after signing in on the same browser. */
export async function getCheckoutOrderOwner(orderId: string): Promise<string> {
  const identity = await identities();
  const ids = [identity.member, identity.guest].filter((id): id is string => typeof id === "string");
  if (!ids.length) throw new AppError("UNAUTHORIZED", "Open this order in the browser used at checkout or contact support", 401);
  if (!/^[a-f0-9]{24}$/i.test(orderId)) throw new AppError("NOT_FOUND", "Order not found", 404);
  await connectDb();
  const order = await Order.findOne({ _id: orderId, userId: { $in: ids } }).select("userId").lean();
  if (!order) throw new AppError("NOT_FOUND", "Order not found", 404);
  return order.userId.toString();
}
