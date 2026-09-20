import { z } from "zod";

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const objectIdSchema = z.string().regex(OBJECT_ID_REGEX, "Invalid id");
export const slugSchema = z
  .string()
  .min(1)
  .max(140)
  .regex(SLUG_REGEX, "Slug must be lowercase letters, numbers and hyphens");

const categoryImageSchema = z.object({
  publicId: z.string().min(1).max(512),
  secureUrl: z.string().url().max(2048),
  alt: z.string().min(1).max(200),
});

export const categoryInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  slug: slugSchema.optional(),
  description: z.string().trim().max(2000).optional(),
  image: categoryImageSchema.optional(),
  parentId: objectIdSchema.nullable().optional(),
  isPublished: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  seoTitle: z.string().trim().max(160).optional(),
  seoDescription: z.string().trim().max(320).optional(),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;
