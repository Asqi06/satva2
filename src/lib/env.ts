import { z } from "zod";

/**
 * Environment validation (Phase 0).
 *
 * Validation is LAZY (function calls, never module scope) so `next build`
 * and `/api/health` stay green without secrets. Feature code that needs a
 * secret must call `requireServerVar()` / `getServerEnv()` at its entry
 * point and fail fast with a clear message.
 *
 * Server secrets must NEVER be imported into client components.
 */

const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url("NEXT_PUBLIC_APP_URL must be a valid URL")
    .default("http://localhost:3000"),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().min(1).optional(),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
  NEXT_PUBLIC_GA_ID: z.string().min(1).optional(),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

export function getClientEnv(): ClientEnv {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL;
  // The apex redirects to www; never publish localhost or apex URLs in production metadata.
  const appUrl = process.env.NODE_ENV === "production" &&
    (!configuredUrl || /^https?:\/\/(?:(?:localhost|127\.0\.0\.1)(?::\d+)?|(?:www\.)?satvastones\.in)\/?$/i.test(configuredUrl))
      ? "https://www.satvastones.in"
      : configuredUrl;
  // Next.js injects unset vars as empty strings; treat those as absent
  // so optional keys fall back to undefined/defaults instead of failing min(1).
  const raw: Record<string, string> = {};
  for (const [key, value] of Object.entries({
    NEXT_PUBLIC_APP_URL: appUrl,
    NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
  })) {
    if (value !== undefined && value !== "") raw[key] = value;
  }
  return clientEnvSchema.parse(raw);
}

const serverEnvSchema = z.object({
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required"),
  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),
  RAZORPAY_KEY_ID: z.string().min(1, "RAZORPAY_KEY_ID is required"),
  RAZORPAY_KEY_SECRET: z.string().min(1, "RAZORPAY_KEY_SECRET is required"),
  RAZORPAY_WEBHOOK_SECRET: z
    .string()
    .min(1, "RAZORPAY_WEBHOOK_SECRET is required"),
  CLOUDINARY_CLOUD_NAME: z
    .string()
    .min(1, "CLOUDINARY_CLOUD_NAME is required"),
  CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required"),
  CLOUDINARY_API_SECRET: z
    .string()
    .min(1, "CLOUDINARY_API_SECRET is required"),
  RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY is required"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

const SERVER_VAR_NAMES = [
  "MONGODB_URI",
  "AUTH_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "RAZORPAY_WEBHOOK_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "RESEND_API_KEY",
] as const;

export type ServerVarName = (typeof SERVER_VAR_NAMES)[number];

/** Require a single server secret. Throws a clear, value-free error if missing. */
export function requireServerVar(name: ServerVarName): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Copy .env.example to .env.local and fill in values. Never commit secrets.`,
    );
  }
  return value;
}

/** Validate the full server environment. Fails fast, listing every missing variable. */
export function getServerEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues.map((issue) => issue.path.join("."));
    throw new Error(
      `Missing or invalid server environment variables: ${missing.join(", ")}. Copy .env.example to .env.local and fill in values.`,
    );
  }
  return result.data;
}

/**
 * Presence flags only (no values) — safe to expose via /api/health.
 * Never return actual secret values from any API.
 */
export function serverEnvPresence(): Record<ServerVarName, boolean> {
  const presence = {} as Record<ServerVarName, boolean>;
  for (const name of SERVER_VAR_NAMES) {
    presence[name] = Boolean(process.env[name]);
  }
  return presence;
}
