import { describe, expect, it } from "vitest";
import { assertUploadFileOk } from "@/lib/cloudinary";

describe("assertUploadFileOk", () => {
  it("accepts images within budget", () => {
    expect(assertUploadFileOk({ type: "image/webp", size: 1024, name: "a.webp" })).toBe("image");
  });

  it("rejects oversized images", () => {
    expect(() =>
      assertUploadFileOk({ type: "image/jpeg", size: 6 * 1024 * 1024, name: "big.jpg" }),
    ).toThrow(/too large/i);
  });

  it("accepts videos within budget", () => {
    expect(assertUploadFileOk({ type: "video/mp4", size: 1024, name: "v.mp4" })).toBe("video");
  });

  it("rejects unknown types", () => {
    expect(() => assertUploadFileOk({ type: "application/pdf", size: 10, name: "x.pdf" })).toThrow(
      /unsupported/i,
    );
  });
});
