import { describe, expect, it } from "vitest";
import { redact } from "@/lib/logger";

describe("redact", () => {
  it("redacts sensitive keys including nested ones", () => {
    const out = redact({
      userId: "u1",
      razorpaySignature: "sig-123",
      nested: { apiKey: "key-456", amount: 999 },
      items: [{ token: "t", qty: 2 }],
    });
    expect(out).toEqual({
      userId: "u1",
      razorpaySignature: "[REDACTED]",
      nested: { apiKey: "[REDACTED]", amount: 999 },
      items: [{ token: "[REDACTED]", qty: 2 }],
    });
  });

  it("leaves non-sensitive payloads intact", () => {
    expect(redact({ orderId: "o1", status: "PAID" })).toEqual({
      orderId: "o1",
      status: "PAID",
    });
  });
});
