import { z } from "zod";
import { publicMediaUrlSchema } from "./category";

const reviewImageSchema = z.object({
  publicId: z.string().min(1).max(512),
  secureUrl: publicMediaUrlSchema,
});

export const reviewInputSchema = z.object({
  rating: z.number().int().min(1, "Rating must be 1–5").max(5, "Rating must be 1–5"),
  title: z.string().trim().max(160).optional(),
  comment: z.string().trim().max(2000).optional(),
  images: z.array(reviewImageSchema).max(4).default([]),
});

export type ReviewInput = z.infer<typeof reviewInputSchema>;
