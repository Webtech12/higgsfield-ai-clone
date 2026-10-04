import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import type { RateLimiter } from "@/server/modules/limits";

/**
 * Fixed-window rate limits shared by every server instance (ADR-016). Each distinct policy (limit
 * and window) gets its own limiter, created on first use.
 */
export class UpstashRateLimiter implements RateLimiter {
  private readonly redis: Redis;
  private readonly limiters = new Map<string, Ratelimit>();

  constructor(config: { url: string; token: string }) {
    this.redis = new Redis(config);
  }

  async hit(key: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean }> {
    const { success } = await this.limiterFor(limit, windowSeconds).limit(key);
    return { allowed: success };
  }

  private limiterFor(limit: number, windowSeconds: number): Ratelimit {
    const policy = `${String(limit)}/${String(windowSeconds)}s`;
    let limiter = this.limiters.get(policy);
    if (!limiter) {
      limiter = new Ratelimit({
        redis: this.redis,
        limiter: Ratelimit.fixedWindow(limit, `${windowSeconds} s`),
        prefix: `director:rl:${policy}`,
      });
      this.limiters.set(policy, limiter);
    }
    return limiter;
  }
}
