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
  SHOT_NOT_EDITABLE: "Shots can be edited in your chosen direction, before production starts.",
  ILLEGAL_TRANSITION: "That change is no longer possible. Refresh to see the latest state.",
  // Viewer-neutral on purpose: the guest sign-in offer (more credits, a higher limit) is a button
  // shown next to these messages, not a promise inside them (AGENTS.md §5).
  INSUFFICIENT_CREDITS: "You don't have enough credits for this.",
  LIMIT_REACHED: "You've reached today's video limit. Come back tomorrow for more.",
  DAILY_BUDGET_REACHED:
    "Director has used today's generation budget. Explore the demo film, or try again tomorrow.",
  INTERNAL: "Something went wrong on our side. Please try again.",
} satisfies Record<ErrorCode, string>;

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return ERROR_COPY[error.code];
  return ERROR_COPY.INTERNAL;
}
