import mongoose from "mongoose";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connectDb, resetDbCache } from "@/lib/db";
import { User } from "@/models/User";
import {
  addAddress,
  deleteAddress,
  listAddresses,
  updateAddress,
} from "@/services/address-service";

const HOME = {
  fullName: "Test User",
  phone: "9876543210",
  addressLine1: "1 Main St",
  city: "Vapi",
  state: "Gujarat",
  pincode: "396191",
  isDefault: false,
};

describe("address service", () => {
  let mongod: MongoMemoryServer | undefined;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();
    resetDbCache();
    await connectDb();
    await User.syncIndexes();
    await User.create([{ email: "a@x.co" }, { email: "b@x.co" }]);
  }, 120000);

  afterAll(async () => {
    await mongoose.disconnect();
    resetDbCache();
    if (mongod) await mongod.stop();
  });

  afterEach(async () => {
    await User.updateMany({}, { $set: { addresses: [] } });
  });

  it("creates, lists, and defaults the first address", async () => {
    const user = await User.findOne({ email: "a@x.co" }).select("_id").lean();
    const id = user?._id.toString() ?? "";
    const created = await addAddress(id, HOME);
    expect(created.isDefault).toBe(true);
    const list = await listAddresses(id);
    expect(list).toHaveLength(1);
  });

  it("rotates the default flag", async () => {
    const user = await User.findOne({ email: "a@x.co" }).select("_id").lean();
    const id = user?._id.toString() ?? "";
    const first = await addAddress(id, HOME);
    const second = await addAddress(id, { ...HOME, addressLine1: "2 Other St", isDefault: true });
    const list = await listAddresses(id);
    expect(list.find((a) => a.id === first.id)?.isDefault).toBe(false);
    expect(list.find((a) => a.id === second.id)?.isDefault).toBe(true);
    await updateAddress(id, first.id, { isDefault: true });
    const relisted = await listAddresses(id);
    expect(relisted.find((a) => a.id === first.id)?.isDefault).toBe(true);
  });

  it("rejects bad pincodes and isolates users", async () => {
    const a = await User.findOne({ email: "a@x.co" }).select("_id").lean();
    const b = await User.findOne({ email: "b@x.co" }).select("_id").lean();
    const idA = a?._id.toString() ?? "";
    const idB = b?._id.toString() ?? "";
    await expect(addAddress(idA, { ...HOME, pincode: "123" })).rejects.toThrow();
    const created = await addAddress(idA, HOME);
    await expect(updateAddress(idB, created.id, { city: "X" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    expect(await listAddresses(idB)).toEqual([]);
  });

  it("rejects invalid phones at the model layer too", async () => {
    const user = await User.findOne({ email: "a@x.co" }).select("_id").lean();
    const id = user?._id.toString() ?? "";
    await expect(addAddress(id, { ...HOME, phone: "12345" })).rejects.toThrow(/Phone/);
  });

  it("promotes the oldest remaining address on delete", async () => {    const user = await User.findOne({ email: "a@x.co" }).select("_id").lean();
    const id = user?._id.toString() ?? "";
    const first = await addAddress(id, HOME);
    await addAddress(id, { ...HOME, addressLine1: "2 Other St" });
    await deleteAddress(id, first.id);
    const list = await listAddresses(id);
    expect(list).toHaveLength(1);
    expect(list[0]?.isDefault).toBe(true);
  });
});
