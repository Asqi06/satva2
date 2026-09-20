import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connectDb, resetDbCache } from "@/lib/db";
import { AuditLog } from "@/models/AuditLog";
import { auditAdmin } from "@/lib/audit";

describe("admin audit log", () => {
  let mongod: MongoMemoryServer | undefined;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();
    resetDbCache();
    await connectDb();
    await AuditLog.syncIndexes();
  }, 120000);

  afterAll(async () => {
    await mongoose.disconnect();
    resetDbCache();
    if (mongod) await mongod.stop();
  });

  beforeEach(async () => {
    await AuditLog.deleteMany({});
  });

  it("records actor, action, target and metadata", async () => {
    await auditAdmin({
      actorId: new mongoose.Types.ObjectId().toString(),
      actorEmail: "owner@x.co",
      action: "product.update",
      target: "prod_1",
      metadata: { slug: "ring" },
    });
    const rows = await AuditLog.find({}).lean();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      actorEmail: "owner@x.co",
      action: "product.update",
      target: "prod_1",
    });
    expect(rows[0]?.metadata).toMatchObject({ slug: "ring" });
  });

  it("never throws, even for malformed entries", async () => {
    await expect(
      auditAdmin({ actorId: "not-an-id", actorEmail: "x", action: "test" }),
    ).resolves.toBeUndefined();
    expect(await AuditLog.countDocuments({})).toBe(0);
  });
});
