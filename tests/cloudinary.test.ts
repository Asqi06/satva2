import { describe, expect, it } from "vitest";
import { bannerInputSchema } from "@/schemas/content";
import { publicMediaUrlSchema } from "@/schemas/category";
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
  it("keeps videos under the serverless body budget", () => {
    expect(() => assertUploadFileOk({ type: "video/mp4", size: 5 * 1024 * 1024, name: "large.mp4" })).toThrow(/max 4MB/);
  });

  it("rejects unsafe banner targets and media protocols", () => {
    const banner = { title: "Collection", image: { publicId: "x", secureUrl: "https://res.cloudinary.com/x/image/upload/x", alt: "Jewellery" }, link: "/shop" };
    expect(bannerInputSchema.safeParse(banner).success).toBe(true);
    for (const link of ["javascript:alert(1)", "//evil.example", "/\\evil.example", "data:text/html,test"]) {
      expect(bannerInputSchema.safeParse({ ...banner, link }).success).toBe(false);
    }
    for (const url of ["http://res.cloudinary.com/x", "https://res.cloudinary.com.evil.example/x", "data:image/png,test"]) {
      expect(publicMediaUrlSchema.safeParse(url).success).toBe(false);
    }
  });

});
