import { NextResponse } from "next/server";
import { errorResponse, successResponse } from "@/lib/errors";
import { releaseExpiredReservations } from "@/services/inventory-service";

/**
 * Scheduled reservation sweep (Vercel Cron, see vercel.json).
 * Guarded by CRON_SECRET bearer — no session involved.
 * Lazy sweeping at order creation already covers correctness;
 * this bounds how long expired holds linger without traffic.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Login required" } },
      { status: 401 },
    );
  }
  try {
    const released = await releaseExpiredReservations();
    return successResponse({ released });
  } catch (error) {
    return errorResponse(error);
  }
}
