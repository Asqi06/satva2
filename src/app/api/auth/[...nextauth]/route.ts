import type { NextRequest } from "next/server";
import { getAuthHandlers } from "@/lib/auth";
import { errorResponse } from "@/lib/errors";

/**
 * Auth.js request handlers. Resolved lazily per request (ADR-010) so
 * missing env fails fast here — not at build time. Wrapped so config
 * failures (e.g. missing env in dev) return the JSON envelope instead
 * of an empty-body 500 that clients cannot parse.
 */
export async function GET(req: NextRequest): Promise<Response> {
  try {
    return await getAuthHandlers().GET(req);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    return await getAuthHandlers().POST(req);
  } catch (error) {
    return errorResponse(error);
  }
}
