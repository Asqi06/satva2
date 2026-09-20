import { describe, expect, it } from "vitest";
import { getClientEnv, getServerEnv, requireServerVar, serverEnvPresence } from "@/lib/env";

const FULL_SERVER_ENV = {
  MONGODB_URI: "mongodb://localhost:27017/test",
  AUTH_SECRET: "test-secret",
  GOOGLE_CLIENT_ID: "test-google-id",
  GOOGLE_CLIENT_SECRET: "test-google-secret",
  RAZORPAY_KEY_ID: "rzp_test_id",
  RAZORPAY_KEY_SECRET: "test-rzp-secret",
  RAZORPAY_WEBHOOK_SECRET: "test-webhook-secret",
  CLOUDINARY_CLOUD_NAME: "test-cloud",
  CLOUDINARY_API_KEY: "test-key",
  CLOUDINARY_API_SECRET: "test-cloud-secret",
  RESEND_API_KEY: "test-resend-key",
};

describe("getServerEnv", () => {
  it("returns parsed env when everything is set", () => {
    for (const [key, value] of Object.entries(FULL_SERVER_ENV)) {
      process.env[key] = value;
    }
    const env = getServerEnv();
    expect(env.MONGODB_URI).toBe("mongodb://localhost:27017/test");
    expect(env.RAZORPAY_KEY_ID).toBe("rzp_test_id");
  });

  it("fails fast listing the missing variable", () => {
    for (const [key, value] of Object.entries(FULL_SERVER_ENV)) {
      process.env[key] = value;
    }
    delete process.env.RAZORPAY_KEY_SECRET;
    expect(() => getServerEnv()).toThrow(/RAZORPAY_KEY_SECRET/);
    process.env.RAZORPAY_KEY_SECRET = "test-rzp-secret";
  });
});

describe("requireServerVar", () => {
  it("returns the value when set", () => {
    process.env.MONGODB_URI = "mongodb://localhost:27017/test";
    expect(requireServerVar("MONGODB_URI")).toBe("mongodb://localhost:27017/test");
  });

  it("throws a clear error naming the variable when missing", () => {
    delete process.env.AUTH_SECRET;
    expect(() => requireServerVar("AUTH_SECRET")).toThrow(/AUTH_SECRET/);
  });
});

describe("serverEnvPresence", () => {
  it("reports booleans, never values", () => {
    process.env.MONGODB_URI = "super-secret-uri";
    const presence = serverEnvPresence();
    expect(presence.MONGODB_URI).toBe(true);
    expect(JSON.stringify(presence)).not.toContain("super-secret-uri");
  });
});

describe("getClientEnv", () => {
  it("defaults the app URL when unset", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.NEXT_PUBLIC_GA_ID;
    expect(getClientEnv().NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
  });

  it("treats empty optional vars as absent", () => {
    process.env.NEXT_PUBLIC_APP_URL = "";
    process.env.NEXT_PUBLIC_GA_ID = "";
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = "";
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = "";
    const env = getClientEnv();
    expect(env.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
    expect(env.NEXT_PUBLIC_GA_ID).toBeUndefined();
    expect(env.NEXT_PUBLIC_RAZORPAY_KEY_ID).toBeUndefined();
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.NEXT_PUBLIC_GA_ID;
    delete process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    delete process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  });

  it("rejects an invalid app URL", () => {
    process.env.NEXT_PUBLIC_APP_URL = "not-a-url";
    expect(() => getClientEnv()).toThrow();
    delete process.env.NEXT_PUBLIC_APP_URL;
  });
});
