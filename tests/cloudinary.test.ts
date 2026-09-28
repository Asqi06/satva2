import { Writable } from "node:stream";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { UploadApiOptions, UploadApiResponse, UploadResponseCallback } from "cloudinary";
import { bannerInputSchema } from "@/schemas/content";
import { publicMediaUrlSchema } from "@/schemas/category";
import { assertUploadFileOk, uploadBuffer } from "@/lib/cloudinary";

const uploader = vi.hoisted(() => ({ upload_stream: vi.fn(), unsigned_upload_stream: vi.fn() }));
vi.mock("cloudinary", () => ({ v2: { config: vi.fn(), uploader } }));
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });

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

describe("uploadBuffer", () => {
  it.each(["satvastones/products", "satvastones/reviews"])("uses supported unsigned parameters for %s", async folder => {
    vi.stubEnv("CLOUDINARY_CLOUD_NAME", "test-cloud");
    vi.stubEnv("CLOUDINARY_API_KEY", "");
    vi.stubEnv("CLOUDINARY_API_SECRET", "");
    vi.stubEnv("CLOUDINARY_UPLOAD_PRESET", "test-unsigned");
    uploader.unsigned_upload_stream.mockImplementation((preset: string, options: UploadApiOptions, done: UploadResponseCallback) => new Writable({
      write(_chunk, _encoding, complete) {
        expect(preset).toBe("test-unsigned");
        // Reproduce the upstream API contract, not just a successful SDK stub.
        if (options.allowed_formats) done({ http_code: 400, name: "Error", message: "allowed_formats parameter is not allowed when using unsigned upload" });
        else done(undefined, { public_id: "test/asset", secure_url: "https://res.cloudinary.com/test-cloud/image/upload/asset.png", resource_type: "image", width: 32, height: 32 } as UploadApiResponse);
        complete();
      },
    }));
    await expect(uploadBuffer(Buffer.from("test image"), { folder, resourceType: "image" })).resolves.toMatchObject({ publicId: "test/asset", resourceType: "image", width: 32 });
    expect(uploader.upload_stream).not.toHaveBeenCalled();
  });

  it("retains format restrictions for signed uploads", async () => {
    vi.stubEnv("CLOUDINARY_CLOUD_NAME", "test-cloud");
    vi.stubEnv("CLOUDINARY_API_KEY", "test-key");
    vi.stubEnv("CLOUDINARY_API_SECRET", "test-secret");
    uploader.upload_stream.mockImplementation((options: UploadApiOptions, done: UploadResponseCallback) => new Writable({
      write(_chunk, _encoding, complete) {
        expect(options.allowed_formats).toEqual(["jpg", "png", "webp", "avif"]);
        done(undefined, { public_id: "test/signed", secure_url: "https://res.cloudinary.com/test-cloud/image/upload/signed.png", resource_type: "image" } as UploadApiResponse);
        complete();
      },
    }));
    await expect(uploadBuffer(Buffer.from("test image"), { folder: "satvastones/products", resourceType: "image" })).resolves.toMatchObject({ publicId: "test/signed" });
    expect(uploader.unsigned_upload_stream).not.toHaveBeenCalled();
  });

  it.each([
    ["Upload preset not found: private-name", 502, "Cloudinary rejected the upload preset"],
    ["Invalid image file", 400, "Cloudinary rejected this file"],
  ])("handles a plain SDK rejection: %s", async (message, status, expected) => {
    vi.stubEnv("CLOUDINARY_CLOUD_NAME", "test-cloud");
    vi.stubEnv("CLOUDINARY_API_KEY", "");
    vi.stubEnv("CLOUDINARY_API_SECRET", "");
    vi.stubEnv("CLOUDINARY_UPLOAD_PRESET", "test-unsigned");
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      uploader.unsigned_upload_stream.mockImplementation((_preset: string, _options: UploadApiOptions, done: UploadResponseCallback) => new Writable({
        write(_chunk, _encoding, complete) {
          done({ http_code: 400, name: "Error", message });
          complete();
        },
      }));
      await expect(uploadBuffer(Buffer.from("test image"), { folder: "satvastones/products", resourceType: "image" })).rejects.toMatchObject({ status, message: expect.stringContaining(expected) });
      expect(JSON.stringify(log.mock.calls)).not.toContain("private-name");
    } finally { log.mockRestore(); }
  });
});
