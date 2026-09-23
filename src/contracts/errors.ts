import { z } from "zod";

/** Stable error codes shared by the API envelope and the UI copy map (AGENTS.md §8). */
export const ERROR_CODES = [
  "VALIDATION_FAILED",
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "NOT_FOUND",
  "RATE_LIMITED",
  "PROJECT_NOT_READY",
  "DIRECTION_ALREADY_SELECTED",
  "SHOT_NOT_EDITABLE",
  "ILLEGAL_TRANSITION",
  "INSUFFICIENT_CREDITS",
  "LIMIT_REACHED",
  "DAILY_BUDGET_REACHED",
  "INTERNAL",
] as const;
export const ErrorCode = z.enum(ERROR_CODES);
export type ErrorCode = z.infer<typeof ErrorCode>;

export const ApiErrorBody = z.object({
  error: z.object({
    code: ErrorCode,
    message: z.string(),
    retryable: z.boolean(),
  }),
});
export type ApiErrorBody = z.infer<typeof ApiErrorBody>;
