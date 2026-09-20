import { z } from "zod";

export const bannerInputSchema = z.object({
  title: z.string().trim().min(1).max(120),
  subtitle: z.string().trim().max(280).optional(),
  image: z.object({
    publicId: z.string().min(1).max(512),
    secureUrl: z.string().url().max(2048),
    alt: z.string().min(1).max(200),
  }),
  link: z.string().trim().min(1).max(512),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  startsAt: z.string().datetime({ offset: true }).optional(),
  endsAt: z.string().datetime({ offset: true }).optional(),
});

export type BannerInput = z.infer<typeof bannerInputSchema>;

export const newsletterSchema = z.object({
  email: z.string().trim().email().max(320),
  name: z.string().trim().max(120).optional(),
  // Honeypot: humans leave it blank; bots fill it.
  company: z.string().max(200).optional(),
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;

export const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(320),
  topic: z.string().trim().max(120).optional(),
  message: z.string().trim().min(10, "Tell us a little more (10+ characters)").max(2000),
  company: z.string().max(200).optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;
