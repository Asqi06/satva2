import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * Structured application errors + predictable JSON envelopes.
 * See ERROR_HANDLING.md. Never leak stack traces, DB errors, or secrets.
 */

export const ERROR_CODES = [
  "VALIDATION_ERROR",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "PAYMENT_ERROR",
  "RATE_LIMITED",
  "DATABASE_ERROR",
  "INTERNAL_ERROR",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: ErrorCode, message: string, status: number, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

type ErrorBody = {
  success: false;
  error: { code: ErrorCode; message: string; details?: unknown };
};

export function toErrorBody(error: unknown): { status: number; body: ErrorBody } {
  if (error instanceof AppError) {
    const body: ErrorBody = {
      success: false,
      error: { code: error.code, message: error.message },
    };
    if (error.details !== undefined) body.error.details = error.details;
    return { status: error.status, body };
  }
  if (error instanceof z.ZodError) {
    return {
      status: 400,
      body: {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input",
          details: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
      },
    };
  }
  return {
    status: 500,
    body: {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Something went wrong" },
    },
  };
}

export function errorResponse(error: unknown): NextResponse {
  const { status, body } = toErrorBody(error);
  return NextResponse.json(body, { status });
}

export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}
