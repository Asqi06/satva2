import { v2 as cloudinary } from "cloudinary";
import { AppError } from "./errors";
import { requireServerVar } from "./env";
import { logger } from "./logger";

/**
 * Cloudinary access (server-only). Uploads run through our API so the
 * API secret never reaches the browser (see STORAGE.md).
 */

// 4MB: Vercel serverless bodies cap ~4.5MB, so 5MB uploads die at the
// platform before reaching this code. Multipart overhead needs headroom.
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 25 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

/** Validate an upload candidate before spending a network call. */
export function assertUploadFileOk(file: { type: string; size: number; name: string }): "image" | "video" {
  if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
    if (file.size > MAX_IMAGE_BYTES) {
      throw new AppError("VALIDATION_ERROR", `Image too large (max 4MB, JPG/PNG/WebP/AVIF): ${file.name}`, 413);
    }
    return "image";
  }
  if (ALLOWED_VIDEO_TYPES.includes(file.type)) {
    if (file.size > MAX_VIDEO_BYTES) {
      throw new AppError("VALIDATION_ERROR", `Video too large (max 25MB): ${file.name}`, 413);
    }
    return "video";
  }
  throw new AppError("VALIDATION_ERROR", `Unsupported file type: ${file.type || "unknown"}`, 400);
}

let configured = false;

export function getCloudinary() {
  if (!configured) {
    cloudinary.config({
      cloud_name: requireServerVar("CLOUDINARY_CLOUD_NAME"),
      api_key: requireServerVar("CLOUDINARY_API_KEY"),
      api_secret: requireServerVar("CLOUDINARY_API_SECRET"),
    });
    configured = true;
  }
  return cloudinary;
}

export interface UploadResult {
  publicId: string;
  secureUrl: string;
  width?: number;
  height?: number;
  resourceType: string;
}

export async function uploadBuffer(
  buffer: Buffer,
  opts: { folder: string; resourceType: "image" | "video" },
): Promise<UploadResult> {
  const cloud = getCloudinary();
  return new Promise<UploadResult>((resolve, reject) => {
    const stream = cloud.uploader.upload_stream(
      { folder: opts.folder, resource_type: opts.resourceType },
      (error, result) => {
        if (error || !result) {
          reject(error instanceof Error ? error : new Error("Upload failed"));
          return;
        }
        resolve({
          publicId: result.public_id,
          secureUrl: result.secure_url,
          width: result.width,
          height: result.height,
          resourceType: result.resource_type,
        });
      },
    );
    stream.end(buffer);
  });
}

/** Best-effort cleanup (e.g. product delete). Never throws. */
export async function deleteAssets(publicIds: string[]): Promise<void> {
  const cloud = getCloudinary();
  for (const publicId of publicIds) {
    try {
      await cloud.uploader.destroy(publicId);
    } catch (error) {
      logger.warn("cloudinary delete failed", {
        publicId,
        message: error instanceof Error ? error.message : "unknown",
      });
    }
  }
}
