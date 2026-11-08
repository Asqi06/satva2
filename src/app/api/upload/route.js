import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dqguetjwm';
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;
const UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET;

if (API_KEY && API_SECRET) {
  cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
  });
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const folder = formData.get('folder') || 'satvastones/products';

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'A valid file must be uploaded under the "file" field.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Method 1: Cloudinary Signed Upload with API Key & Secret
    if (API_KEY && API_SECRET) {
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'image',
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(buffer);
      });

      return NextResponse.json({
        success: true,
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        format: uploadResult.format,
        width: uploadResult.width,
        height: uploadResult.height,
        provider: 'cloudinary_signed',
      });
    }

    // Method 2: Cloudinary Unsigned Upload with Upload Preset
    if (UPLOAD_PRESET) {
      const uploadData = new FormData();
      uploadData.append('file', new Blob([buffer], { type: file.type }), file.name);
      uploadData.append('upload_preset', UPLOAD_PRESET);
      uploadData.append('folder', folder);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: uploadData,
      });

      const data = await res.json();
      if (res.ok && data.secure_url) {
        return NextResponse.json({
          success: true,
          url: data.secure_url,
          publicId: data.public_id,
          format: data.format,
          width: data.width,
          height: data.height,
          provider: 'cloudinary_unsigned',
        });
      }
    }

    // Method 3: Local Storage Fallback if Cloudinary credentials are not yet configured
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    const ext = path.extname(file.name) || '.jpg';
    const filename = `satva-${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const localUrl = `/uploads/${filename}`;
    return NextResponse.json({
      success: true,
      url: localUrl,
      publicId: filename,
      provider: 'local_storage',
      notice: 'Saved to local storage. To upload directly to Cloudinary, add CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET or CLOUDINARY_UPLOAD_PRESET to .env.local.',
    });
  } catch (err) {
    console.error('API /api/upload error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Image upload failed.' },
      { status: 500 }
    );
  }
}
