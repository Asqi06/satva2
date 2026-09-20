import mongoose, { Document, Model, Schema, Types } from "mongoose";

/** Admin action audit trail. Written by admin routes after success. */
export interface IAuditLog extends Document {
  actorId: Types.ObjectId;
  actorEmail: string;
  action: string;
  target?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const auditSchema = new Schema<IAuditLog>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    actorEmail: { type: String, required: true, maxlength: 320 },
    action: { type: String, required: true, maxlength: 120 },
    target: { type: String, maxlength: 256 },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "auditlogs" },
);

auditSchema.index({ actorId: 1, createdAt: -1 });
auditSchema.index({ action: 1, createdAt: -1 });

export const AuditLog: Model<IAuditLog> =
  (mongoose.models.AuditLog as Model<IAuditLog> | undefined) ??
  mongoose.model<IAuditLog>("AuditLog", auditSchema);
