import { sql } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { InMemoryRateLimiter } from "@/server/integrations/fake/InMemoryRateLimiter";
import { createCreditsModule, InsufficientCreditsError } from "@/server/modules/credits";
import { createLimitsModule } from "@/server/modules/limits";
import { createDb, createUnitOfWork } from "@/server/platform/db";

import { loadTestEnv } from "./env";

const db = createDb(loadTestEnv());
const uow = createUnitOfWork(db);
const credits = createCreditsModule({ db });
const limits = createLimitsModule({
  db,
  rateLimiter: new InMemoryRateLimiter(),
  policy: { guestVideoCap: 6, userVideoCap: 18, dailySpendCapCents: 1000 },
});

const reserveOne = (userId: string, assetId: string, cost: number) =>
  uow.run((tx) => credits.reserve(tx, { userId, items: [{ assetId, attempt: 1, cost }] }));

beforeEach(async () => {
  await db.execute(sql`truncate credit_ledger, credit_accounts, usage_daily`);
});

afterAll(async () => {
  await db.$client.end();
});

describe("money path (real Postgres)", () => {
  it("two parallel reservations can never overdraw the account", async () => {
    await credits.grant({ userId: "usr_race", amount: 30, key: "grant:race" });

    const results = await Promise.allSettled([
      reserveOne("usr_race", "ast_a", 30),
      reserveOne("usr_race", "ast_b", 30),
    ]);

    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const rejected = results.find((r) => r.status === "rejected");
    expect(rejected?.status === "rejected" && rejected.reason).toBeInstanceOf(
      InsufficientCreditsError,
    );
    expect(await credits.balanceOf("usr_race")).toBe(0);
  });

  it("many parallel reservations spend exactly what was granted", async () => {
    await credits.grant({ userId: "usr_many", amount: 40, key: "grant:many" });

    const results = await Promise.allSettled(
      Array.from({ length: 8 }, (_, i) => reserveOne("usr_many", `ast_${String(i)}`, 10)),
    );

    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(4);
    expect(await credits.balanceOf("usr_many")).toBe(0);
  });

  it("grants are idempotent by key", async () => {
    await credits.grant({ userId: "usr_g", amount: 40, key: "grant:guest:usr_g" });
    await credits.grant({ userId: "usr_g", amount: 40, key: "grant:guest:usr_g" });

    expect(await credits.balanceOf("usr_g")).toBe(40);
  });

  it("release refunds exactly once; capture keeps the spend", async () => {
    await credits.grant({ userId: "usr_s", amount: 20, key: "grant:s" });
    await reserveOne("usr_s", "ast_fail", 10);
    await reserveOne("usr_s", "ast_ok", 10);

    await credits.release({ assetId: "ast_fail", attempt: 1 });
    await credits.release({ assetId: "ast_fail", attempt: 1 });
    await credits.capture({ assetId: "ast_ok", attempt: 1 });

    expect(await credits.balanceOf("usr_s")).toBe(10);
  });

  it("a rolled-back unit of work leaves no reservation behind", async () => {
    await credits.grant({ userId: "usr_rb", amount: 10, key: "grant:rb" });

    await expect(
      uow.run(async (tx) => {
        await credits.reserve(tx, {
          userId: "usr_rb",
          items: [{ assetId: "ast_rb", attempt: 1, cost: 10 }],
        });
        throw new Error("later step failed");
      }),
    ).rejects.toThrow("later step failed");

    expect(await credits.balanceOf("usr_rb")).toBe(10);
  });

  it("video caps hold under concurrent requests", async () => {
    const produce = () =>
      uow.run((tx) =>
        limits.recordUsage(tx, { userId: "usr_cap", isGuest: true, videos: 3, spendCents: 0 }),
      );

    const results = await Promise.allSettled([produce(), produce(), produce()]);

    // Guest cap is 6 videos a day: exactly two productions of 3 fit.
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(2);
    expect((await limits.usageToday("usr_cap", true)).videos).toBe(6);
  });
});
