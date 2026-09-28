import { v2 as cloudinary, type UploadApiErrorResponse, type UploadApiResponse } from "cloudinary";
import { AppError } from "./errors";
import { requireServerVar, serverEnvPresence } from "./env";
import { logger } from "./logger";

/**
 * Optional unsigned-upload preset (public name, not a secret). When the
 * API key/secret are absent, uploads go through this preset instead of
 * signed calls — validation, auth and size checks still run server-side
 * in our API routes. The public preset also permits direct uploads; restrict
 * its formats, size and folder in Cloudinary, or use signed credentials.
 */
function uploadPreset(): string | null {
  const preset = process.env.CLOUDINARY_UPLOAD_PRESET?.trim();
  return preset ? preset : null;
}

function hasSignedCredentials(): boolean {
  const presence = serverEnvPresence();
  return Boolean(presence.CLOUDINARY_API_KEY && presence.CLOUDINARY_API_SECRET);
}

/**
 * Fail fast with an actionable message when image uploads can't work.
 * Names the missing keys only — never their values. Called by both
 * upload routes before touching multipart bodies.
 */
export function assertCloudinaryConfigured(): void {
  const presence = serverEnvPresence();
  if (!presence.CLOUDINARY_CLOUD_NAME || (!hasSignedCredentials() && !uploadPreset())) {
    throw new AppError(
      "INTERNAL_ERROR",
      "Image uploads are not configured — set CLOUDINARY_CLOUD_NAME plus either CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET, or an unsigned CLOUDINARY_UPLOAD_PRESET, in Vercel → Settings → Environment Variables (Production), then redeploy.",
      503,
    );
  }
}

/**
 * Cloudinary access (server-only). Uploads run through our API so the
 * API secret never reaches the browser (see STORAGE.md).
 */

// 4MB: Vercel serverless bodies cap ~4.5MB, so 5MB uploads die at the
// platform before reaching this code. Multipart overhead needs headroom.
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 4 * 1024 * 1024;
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
      throw new AppError("VALIDATION_ERROR", `Video too large (max 4MB): ${file.name}`, 413);
    }
    return "video";
  }
  throw new AppError("VALIDATION_ERROR", `Unsupported file type: ${file.type || "unknown"}`, 400);
}

let configured = false;

export function getCloudinary() {
  if (!configured) {
    // api_key/secret stay optional: unsigned-preset mode needs cloud_name only.
    cloudinary.config({
      cloud_name: requireServerVar("CLOUDINARY_CLOUD_NAME"),
      ...(hasSignedCredentials()
        ? {
            api_key: requireServerVar("CLOUDINARY_API_KEY"),
            api_secret: requireServerVar("CLOUDINARY_API_SECRET"),
          }
        : {}),
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
  const preset = hasSignedCredentials() ? null : uploadPreset();
  return new Promise<UploadResult>((resolve, reject) => {
    const done = (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
      if (error || !result) {
        // ponytail: preset errors use provider text; new wording falls back. Prefer stable provider codes if offered.
        const presetFailure = preset !== null && /upload preset|unsigned upload/i.test(error?.message ?? "");
        const invalidFile = error?.http_code === 400 && !presetFailure;
        const message = presetFailure
          ? "Cloudinary rejected the upload preset. Check CLOUDINARY_UPLOAD_PRESET belongs to CLOUDINARY_CLOUD_NAME and its signing mode is Unsigned, then redeploy."
          : invalidFile
            ? "Cloudinary rejected this file. Use a valid JPG, PNG, WebP or AVIF image (MP4, WebM or MOV for video) and check the preset's allowed formats."
            : "Cloudinary could not complete the upload. Check its account status and upload configuration, then retry.";
        // SDK errors can be plain objects; never log raw messages containing keys or signatures.
        logger.error("cloudinary upload failed", { mode: preset ? "unsigned" : "signed", providerStatus: error?.http_code, message });
        reject(new AppError(invalidFile ? "VALIDATION_ERROR" : "INTERNAL_ERROR", message, invalidFile ? 400 : 502));
        return;
      }
      resolve({
        publicId: result.public_id,
        secureUrl: result.secure_url,
        width: result.width,
        height: result.height,
        resourceType: result.resource_type,
      });
    };
    // Unsigned format restrictions belong in the preset; Cloudinary rejects them per-call.
    const stream =
      preset !== null
        ? cloud.uploader.unsigned_upload_stream(
            preset,
            { folder: opts.folder, resource_type: opts.resourceType },
            done,
          )
        : cloud.uploader.upload_stream(
            { folder: opts.folder, resource_type: opts.resourceType, allowed_formats: opts.resourceType === "image" ? ["jpg", "png", "webp", "avif"] : ["mp4", "webm", "mov"] },
            done,
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
