import { z } from "zod";
import { objectIdSchema } from "./category";

/** Admin coupon management (validation lives in coupon-service). */

const idList = z.array(objectIdSchema).max(100).default([]);

export const couponAdminInputSchema = z
  .object({
    code: z.string().trim().min(2).max(32),
    type: z.enum(["PERCENTAGE", "FIXED"]),
    value: z.number().int().min(1),
    minimumOrderValue: z.number().int().min(0).default(0),
    maximumDiscount: z.number().int().min(1).optional(),
    applicableProductIds: idList,
    applicableCategoryIds: idList,
    firstOrderOnly: z.boolean().default(false),
    usageLimit: z.number().int().min(1).optional(),
    perUserLimit: z.number().int().min(1).optional(),
    expiresAt: z.string().datetime({ offset: true }).optional(),
    isActive: z.boolean().default(true),
  })
  .refine((v) => v.type !== "PERCENTAGE" || v.value <= 100, {
    message: "Percentage value must be 1–100",
    path: ["value"],
  });

export type CouponAdminInput = z.infer<typeof couponAdminInputSchema>;
