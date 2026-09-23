import type { ErrorCode } from "@/contracts/errors";

import { ApiError } from "./apiClient";

/** Error code → what the user reads. One home for error copy (AGENTS.md §8); exhaustive by type. */
export const ERROR_COPY = {
  VALIDATION_FAILED: "Something in that request wasn't quite right. Check it and try again.",
  UNAUTHENTICATED: "Your session has ended. Start again from the brief.",
  FORBIDDEN: "This project is read-only.",
  NOT_FOUND: "We couldn't find that project.",
  RATE_LIMITED: "You're going a little fast. Wait a moment and try again.",
  PROJECT_NOT_READY: "The Director is still working on this. Try again in a moment.",
  DIRECTION_ALREADY_SELECTED: "You've already chosen a direction for this film.",
  SHOT_NOT_EDITABLE: "Choose this direction first, then edit its shots.",
  ILLEGAL_TRANSITION: "That change is no longer possible. Refresh to see the latest state.",
  INTERNAL: "Something went wrong on our side. Please try again.",
} satisfies Record<ErrorCode, string>;

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return ERROR_COPY[error.code];
  return ERROR_COPY.INTERNAL;
}
