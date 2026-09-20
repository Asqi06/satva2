import { describe, expect, it } from "vitest";
import { z } from "zod";
import { AppError, toErrorBody } from "@/lib/errors";

describe("toErrorBody", () => {
  it("maps AppError with its code, message, and status", () => {
    const { status, body } = toErrorBody(new AppError("NOT_FOUND", "Product not found", 404));
    expect(status).toBe(404);
    expect(body).toEqual({
      success: false,
      error: { code: "NOT_FOUND", message: "Product not found" },
    });
  });

  it("includes details when provided", () => {
    const { status, body } = toErrorBody(
      new AppError("CONFLICT", "Slug taken", 409, { slug: "ring" }),
    );
    expect(status).toBe(409);
    expect(body.error.details).toEqual({ slug: "ring" });
  });

  it("maps ZodError to VALIDATION_ERROR with field details", () => {
    const schema = z.object({ pincode: z.string().length(6) });
    const parsed = schema.safeParse({ pincode: "123" });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const { status, body } = toErrorBody(parsed.error);
      expect(status).toBe(400);
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.details).toEqual([
        expect.objectContaining({ path: "pincode" }),
      ]);
    }
  });

  it("maps unknown errors to a generic INTERNAL_ERROR without internals", () => {
    const { status, body } = toErrorBody(new Error("mongodb://admin:s3cret exploded"));
    expect(status).toBe(500);
    expect(body.error.code).toBe("INTERNAL_ERROR");
    expect(JSON.stringify(body)).not.toContain("s3cret");
    expect(JSON.stringify(body)).not.toContain("stack");
  });
});
