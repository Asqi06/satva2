import { z } from "zod";
import { objectIdSchema } from "./category";

export const cartItemInputSchema = z.object({
  productId: objectIdSchema,
  variantSku: z.string().trim().min(1).max(64).optional(),
  qty: z.number().int().min(1).max(99),
});

export type CartItemInput = z.infer<typeof cartItemInputSchema>;

export const cartQtySchema = z.object({
  qty: z.number().int().min(0).max(99),
});

export const cartMergeSchema = z.object({
  items: z.array(cartItemInputSchema).max(50),
});

export type CartMergeInput = z.infer<typeof cartMergeSchema>;

export const wishlistInputSchema = z.object({
  productId: objectIdSchema,
});

export type WishlistInput = z.infer<typeof wishlistInputSchema>;
