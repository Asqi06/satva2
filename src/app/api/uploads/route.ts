import type { NextRequest } from "next/server";
import { AppError, errorResponse, successResponse } from "@/lib/errors";
import { limitOrThrow } from "@/lib/rate-limit";
import { requireUserId } from "@/lib/require-user";
import { assertUploadFileOk, uploadBuffer } from "@/lib/cloudinary";

/**
 * Member image upload (reviews). Images only — videos stay admin-only.
 * Same validation as admin uploads; own folder for lifecycle separation.
 */
export async function POST(req: NextRequest): Promise<Response> {
  try {
    const userId = await requireUserId();
    limitOrThrow(req, "uploads", 20, 60_000, userId);
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      throw new AppError("VALIDATION_ERROR", "Multipart field 'file' is required", 400);
    }
    const kind = assertUploadFileOk({ type: file.type, size: file.size, name: file.name });
    if (kind !== "image") {
      throw new AppError("VALIDATION_ERROR", "Only images are allowed here", 400);
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadBuffer(buffer, { folder: "satvastones/reviews", resourceType: "image" });
    return successResponse(result, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
