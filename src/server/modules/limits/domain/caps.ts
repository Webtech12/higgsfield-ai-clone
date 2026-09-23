import { DomainError } from "@/server/platform/errors";

export interface CapPolicy {
  guestVideoCap: number;
  userVideoCap: number;
  dailySpendCapCents: number;
}

export class LimitReachedError extends DomainError {
  readonly code = "LIMIT_REACHED";
}

export class DailyBudgetReachedError extends DomainError {
  readonly code = "DAILY_BUDGET_REACHED";
  override readonly retryable = true;
}

export class RateLimitedError extends DomainError {
  readonly code = "RATE_LIMITED";
  override readonly retryable = true;
}

export const videoCapFor = (policy: CapPolicy, isGuest: boolean): number =>
  isGuest ? policy.guestVideoCap : policy.userVideoCap;

/** The UTC day usage is counted against. */
export const usageDay = (now: Date): string => now.toISOString().slice(0, 10);
