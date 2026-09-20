import { describe, expect, it } from "vitest";
import { User } from "@/models/User";

describe("User model", () => {
  it("defaults new users to CUSTOMER with empty addresses", () => {
    const user = new User({ name: "Test", email: "Test@Example.com" });
    expect(user.role).toBe("CUSTOMER");
    expect(user.addresses).toEqual([]);
    // Schema lowercases email.
    expect(user.email).toBe("test@example.com");
  });

  it("rejects an invalid role", async () => {
    const user = new User({ email: "a@b.co", role: "SUPERADMIN" });
    await expect(user.validate()).rejects.toThrow(/`role`.*validator|validation failed/i);
  });

  it("rejects a bad pincode in an embedded address", async () => {
    const user = new User({
      email: "a@b.co",
      addresses: [
        {
          fullName: "Test",
          phone: "9876543210",
          addressLine1: "1 Main St",
          city: "Vapi",
          state: "Gujarat",
          pincode: "123",
        },
      ],
    });
    await expect(user.validate()).rejects.toThrow(/Pincode/);
  });

  it("rejects a bad phone in an embedded address", async () => {
    const user = new User({
      email: "a@b.co",
      addresses: [
        {
          fullName: "Test",
          phone: "12345",
          addressLine1: "1 Main St",
          city: "Vapi",
          state: "Gujarat",
          pincode: "396191",
        },
      ],
    });
    await expect(user.validate()).rejects.toThrow(/Phone/);
  });

  it("accepts a valid address", async () => {
    const user = new User({
      email: "a@b.co",
      addresses: [
        {
          fullName: "Test User",
          phone: "9876543210",
          addressLine1: "1 Main St",
          city: "Vapi",
          state: "Gujarat",
          pincode: "396191",
        },
      ],
    });
    await expect(user.validate()).resolves.toBeUndefined();
  });
});
