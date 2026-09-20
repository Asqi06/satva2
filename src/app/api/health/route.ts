import { serverEnvPresence } from "@/lib/env";
import { successResponse } from "@/lib/errors";

/**
 * Liveness probe. Secret-free by design: reports presence booleans only.
 */
export async function GET(): Promise<Response> {
  return successResponse({
    ok: true,
    service: "satvastones",
    timestamp: new Date().toISOString(),
    env: serverEnvPresence(),
  });
}
