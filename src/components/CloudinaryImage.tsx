"use client";

import Image, { type ImageProps } from "next/image";
import { cloudinaryLoader } from "@/utils/cloudinary-url";

export function CloudinaryImage({ alt, ...props }: Omit<ImageProps, "loader">) {
  return <Image {...props} alt={alt} loader={cloudinaryLoader} />;
}
