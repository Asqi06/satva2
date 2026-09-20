import mongoose from "mongoose";
import { afterAll, describe, expect, it } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connectDb, resetDbCache } from "@/lib/db";

describe("connectDb", () => {
  afterAll(async () => {
    await mongoose.disconnect();
    resetDbCache();
  });

  it("connects and reuses the cached connection", async () => {
    const mongod = await MongoMemoryServer.create();
    try {
      process.env.MONGODB_URI = mongod.getUri();
      resetDbCache();
      const first = await connectDb();
      const second = await connectDb();
      expect(first).toBe(second);
      expect(first.connection.readyState).toBe(1);
    } finally {
      await mongod.stop();
    }
  }, 120000);
});
