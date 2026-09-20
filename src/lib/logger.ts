/**
 * Minimal structured logger (Phase 0). JSON lines in production.
 * NEVER pass secrets, tokens, cookies, or payment data as fields.
 * See LOGGING.md.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

type LogFields = Record<string, unknown>;

const REDACT_KEY_PARTS = [
  "password",
  "secret",
  "token",
  "signature",
  "authorization",
  "cookie",
  "card",
  "cvv",
  "apikey",
  "api_key",
];

/** Recursively redact values whose key looks sensitive. */
export function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      const lowered = key.toLowerCase().replace(/[^a-z]/g, "");
      out[key] = REDACT_KEY_PARTS.some((part) => lowered.includes(part))
        ? "[REDACTED]"
        : redact(entry);
    }
    return out;
  }
  return value;
}

function emit(level: LogLevel, message: string, fields: LogFields = {}): void {
  const entry = {
    level,
    msg: message,
    ts: new Date().toISOString(),
    ...(redact(fields) as LogFields),
  };
  const line = JSON.stringify(entry);
  switch (level) {
    case "debug":
      console.debug(line);
      break;
    case "info":
      console.info(line);
      break;
    case "warn":
      console.warn(line);
      break;
    case "error":
      console.error(line);
      break;
  }
}

export const logger = {
  debug: (message: string, fields?: LogFields) => emit("debug", message, fields),
  info: (message: string, fields?: LogFields) => emit("info", message, fields),
  warn: (message: string, fields?: LogFields) => emit("warn", message, fields),
  error: (message: string, fields?: LogFields) => emit("error", message, fields),
};
