import { describe, expect, it } from "vitest";

import { NETWORK_DAILY_ALLOWANCE } from "../domain/allowances";
import type { RateLimiter } from "../ports/RateLimiter";
import { TakeAllowance } from "./TakeAllowance";

/** Counts hits per key within one window, and records the policy each key was asked for. */
function countingLimiter() {
  const counts = new Map<string, number>();
  const policies = new Map<string, { limit: number; windowSeconds: number }>();
  const limiter: RateLimiter = {
    hit(key, limit, windowSeconds) {
      const count = (counts.get(key) ?? 0) + 1;
      counts.set(key, count);
      policies.set(key, { limit, windowSeconds });
      return Promise.resolve({ allowed: count <= limit });
    },
  };
  return { limiter, policies };
}

describe("TakeAllowance", () => {
  it("gives a network one free trial a day", async () => {
    const take = new TakeAllowance({ rateLimiter: countingLimiter().limiter });

    expect(await take.execute({ action: "trial", network: "v4:203.0.113.7" })).toBe(true);
    expect(await take.execute({ action: "trial", network: "v4:203.0.113.7" })).toBe(false);
  });

  it("keeps each network's allowance separate", async () => {
    const take = new TakeAllowance({ rateLimiter: countingLimiter().limiter });

    await take.execute({ action: "trial", network: "v4:203.0.113.7" });

    expect(await take.execute({ action: "trial", network: "v6:2001:db8:0:1" })).toBe(true);
  });

  it("keeps each action's allowance separate, at its size from the table, per day", async () => {
    const { limiter, policies } = countingLimiter();
    const take = new TakeAllowance({ rateLimiter: limiter });

    for (let i = 0; i < NETWORK_DAILY_ALLOWANCE.brief; i++) {
      expect(await take.execute({ action: "brief", network: "v4:198.51.100.1" })).toBe(true);
    }
    expect(await take.execute({ action: "brief", network: "v4:198.51.100.1" })).toBe(false);
    expect(await take.execute({ action: "coach", network: "v4:198.51.100.1" })).toBe(true);

    expect([...policies.values()]).toEqual([
      { limit: NETWORK_DAILY_ALLOWANCE.brief, windowSeconds: 86_400 },
      { limit: NETWORK_DAILY_ALLOWANCE.coach, windowSeconds: 86_400 },
    ]);
  });
});
