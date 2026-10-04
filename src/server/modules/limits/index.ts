// limits: caps, the daily spend kill-switch, per-network allowances (ADR-027) and request rate
// limits (ADR-016). Public API only.
import type { Database, Tx } from "@/server/platform/db";

import { TakeAllowance } from "./application/TakeAllowance";
import {
  DailyAllowanceReachedError,
  TrialLimitReachedError,
  type MeteredAction,
} from "./domain/allowances";
import {
  DailyBudgetReachedError,
  LimitReachedError,
  RateLimitedError,
  usageDay,
  videoCapFor,
  type CapPolicy,
} from "./domain/caps";
import { UsageRepository } from "./infrastructure/UsageRepository";
import type { RateLimiter } from "./ports/RateLimiter";

export {
  DailyAllowanceReachedError,
  NETWORK_DAILY_ALLOWANCE,
  TrialLimitReachedError,
  type MeteredAction,
} from "./domain/allowances";
export {
  DailyBudgetReachedError,
  LimitReachedError,
  RateLimitedError,
  type CapPolicy,
} from "./domain/caps";
export { networkKeyOf } from "./domain/network";
export type { RateLimiter } from "./ports/RateLimiter";

/** Per-network allowances (ADR-027): each check uses one of today's, and refuses once it's gone. */
function networkAllowances(rateLimiter: RateLimiter) {
  const allowance = new TakeAllowance({ rateLimiter });
  return {
    /** Before a new guest is made: one free trial per network a day. */
    async assertTrialAvailable(network: string): Promise<void> {
      if (!(await allowance.execute({ action: "trial", network }))) {
        throw new TrialLimitReachedError("Today's free trial on this network has been used");
      }
    },

    /** Before free work that still costs us money: a daily allowance per network. */
    async assertDailyAllowance(
      action: Exclude<MeteredAction, "trial">,
      network: string,
    ): Promise<void> {
      if (!(await allowance.execute({ action, network }))) {
        throw new DailyAllowanceReachedError(`This network has used today's ${action} allowance`);
      }
    },
  };
}

export function createLimitsModule(deps: {
  db: Database;
  rateLimiter: RateLimiter;
  policy: CapPolicy;
  now?: () => Date;
}) {
  const usage = new UsageRepository(deps.db);
  const now = deps.now ?? (() => new Date());

  return {
    ...networkAllowances(deps.rateLimiter),

    /**
     * Counts videos and spend inside the caller's transaction. Throwing rolls back the whole unit of
     * work, so a cap can never be exceeded by two concurrent requests (the upsert locks the row).
     */
    async recordUsage(
      tx: Tx,
      command: { userId: string; isGuest: boolean; videos: number; spendCents: number },
    ): Promise<void> {
      const totals = await usage.add(tx, usageDay(now()), command);
      const cap = videoCapFor(deps.policy, command.isGuest);
      if (totals.userVideos > cap) {
        throw new LimitReachedError(`You've reached today's limit of ${String(cap)} videos`);
      }
      if (totals.globalSpendCents > deps.policy.dailySpendCapCents) {
        throw new DailyBudgetReachedError("Director has reached today's generation budget");
      }
    },

    /**
     * Counts provider spend for free work (storyboard frames, redraws) toward the global kill-switch
     * (AGENTS.md §1). Paid work records its spend with its credits, inside the money path.
     */
    async recordFreeSpend(spendCents: number): Promise<void> {
      if (spendCents > 0) await usage.addGlobalSpend(usageDay(now()), spendCents);
    },

    /** Cheap pre-check before any provider work: is the global kill-switch already tripped? */
    async assertCanGenerate(userId: string): Promise<void> {
      const today = await usage.today(usageDay(now()), userId);
      if (today.globalSpendCents >= deps.policy.dailySpendCapCents) {
        throw new DailyBudgetReachedError("Director has reached today's generation budget");
      }
    },

    async assertWithinRate(key: string, limit: number, windowSeconds: number): Promise<void> {
      const { allowed } = await deps.rateLimiter.hit(key, limit, windowSeconds);
      if (!allowed) throw new RateLimitedError("Too many requests, please slow down");
    },

    async usageToday(userId: string, isGuest: boolean): Promise<{ videos: number; cap: number }> {
      const today = await usage.today(usageDay(now()), userId);
      return { videos: today.userVideos, cap: videoCapFor(deps.policy, isGuest) };
    },
  };
}

export type LimitsApi = ReturnType<typeof createLimitsModule>;
