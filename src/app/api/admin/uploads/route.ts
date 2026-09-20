import type { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { AppError, errorResponse, successResponse } from "@/lib/errors";
import { assertUploadFileOk, uploadBuffer } from "@/lib/cloudinary";

/**
 * Admin image/video upload. Multipart `file` → Cloudinary → reference.
 * The Cloudinary secret never leaves the server (see STORAGE.md).
 */
export async function POST(req: NextRequest): Promise<Response> {
  try {
    await requireAdmin();
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      throw new AppError("VALIDATION_ERROR", "Multipart field 'file' is required", 400);
    }
    const kind = assertUploadFileOk({ type: file.type, size: file.size, name: file.name });
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadBuffer(buffer, {
      folder: "satvastones/products",
      resourceType: kind,
    });
    return successResponse(result, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
