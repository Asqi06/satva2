import { z } from "zod";
import { objectIdSchema } from "./category";

/** Address form (embedded in User; snapshot copied to Order at purchase). */
export const addressInputSchema = z.object({
  label: z.string().trim().max(32).optional(),
  fullName: z.string().trim().min(1, "Full name is required").max(120),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number"),
  addressLine1: z.string().trim().min(1, "Address is required").max(256),
  addressLine2: z.string().trim().max(256).optional(),
  city: z.string().trim().min(1, "City is required").max(120),
  state: z.string().trim().min(1, "State is required").max(120),
  pincode: z.string().trim().regex(/^[1-9][0-9]{5}$/, "Enter a 6-digit pincode"),
  landmark: z.string().trim().max(256).optional(),
  isDefault: z.boolean().default(false),
});

export type AddressInput = z.infer<typeof addressInputSchema>;

export const createOrderSchema = z.object({
  addressId: objectIdSchema,
  couponCode: z.string().trim().max(32).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const couponValidateSchema = z.object({
  code: z.string().trim().min(1).max(32),
});

export type CouponValidateInput = z.infer<typeof couponValidateSchema>;

export const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;

export const cancelOrderSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
