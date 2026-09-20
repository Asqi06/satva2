import { Types } from "mongoose";
import { connectDb } from "./db";
import { logger } from "./logger";
import { AuditLog } from "@/models/AuditLog";

/**
 * Admin audit trail. Call AFTER the mutation succeeds; failures to log
 * never fail the admin action itself (logged to server logs instead).
 */

export interface AuditEntry {
  actorId: string;
  actorEmail: string;
  action: string;
  target?: string;
  metadata?: Record<string, unknown>;
}

export async function auditAdmin(entry: AuditEntry): Promise<void> {
  try {
    await connectDb();
    await AuditLog.create({
      actorId: new Types.ObjectId(entry.actorId),
      actorEmail: entry.actorEmail,
      action: entry.action,
      target: entry.target,
      metadata: entry.metadata,
    });
  } catch (error) {
    logger.error("audit log failed", {
      action: entry.action,
      message: error instanceof Error ? error.message : "unknown",
    });
  }
}
