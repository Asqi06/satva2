import mongoose from "mongoose";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connectDb, resetDbCache } from "@/lib/db";
import { User } from "@/models/User";
import { ensureCustomerRoleByEmail, getUserRoleByEmail } from "@/services/user-service";

describe("user roles", () => {
  let mongod: MongoMemoryServer | undefined;

  afterAll(async () => {
    await mongoose.disconnect();
    resetDbCache();
    if (mongod) await mongod.stop();
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  it("enforces unique email", async () => {
    mongod ??= await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();
    resetDbCache();
    await connectDb();
    // Unique indexes build in the background — wait for them before racing.
    await User.syncIndexes();
    await User.create({ email: "dup@example.com" });
    await expect(User.create({ email: "dup@example.com" })).rejects.toMatchObject({
      code: 11000,
    });
  }, 120000);

  it("defaults adapter-style docs to CUSTOMER without touching ADMIN", async () => {
    mongod ??= await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();
    resetDbCache();
    await connectDb();

    // Adapter-created doc without a role (bypasses Mongoose defaults).
    await User.collection.insertOne({ email: "new@example.com", name: "New" });
    expect(await ensureCustomerRoleByEmail("new@example.com")).toBe("CUSTOMER");
    expect(await getUserRoleByEmail("new@example.com")).toBe("CUSTOMER");

    await User.create({ email: "owner@example.com", role: "ADMIN" });
    expect(await ensureCustomerRoleByEmail("owner@example.com")).toBe("ADMIN");
    expect(await getUserRoleByEmail("OWNER@example.com")).toBe("ADMIN");
  }, 120000);

  it("returns null for unknown email", async () => {
    mongod ??= await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();
    resetDbCache();
    await connectDb();
    expect(await getUserRoleByEmail("ghost@example.com")).toBeNull();
  }, 120000);
});
