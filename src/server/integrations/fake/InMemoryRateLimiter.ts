import type { RateLimiter } from "@/server/modules/limits";

/**
 * Fixed-window counter in process memory, for PROVIDERS=fake. Per-instance only, which is fine for
 * development; production uses Upstash (S4).
 */
export class InMemoryRateLimiter implements RateLimiter {
  private readonly windows = new Map<string, { resetAt: number; count: number }>();

  constructor(private readonly now: () => number = Date.now) {}

  hit(key: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean }> {
    const at = this.now();
    const current = this.windows.get(key);
    const window =
      current && current.resetAt > at ? current : { resetAt: at + windowSeconds * 1000, count: 0 };
    window.count += 1;
    this.windows.set(key, window);
    return Promise.resolve({ allowed: window.count <= limit });
  }
}
