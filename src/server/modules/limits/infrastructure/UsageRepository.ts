import "server-only";

import { and, eq, sql } from "drizzle-orm";

import { executor, type Database, type Tx } from "@/server/platform/db";

import { usageDaily } from "./schema";

const GLOBAL = { scope: "global" as const, scopeId: "all" };

export class UsageRepository {
  constructor(private readonly db: Database) {}

  /** Adds to today's counters and returns the new totals. The upsert locks the rows it touches. */
  async add(
    tx: Tx,
    day: string,
    usage: { userId: string; videos: number; spendCents: number },
  ): Promise<{ userVideos: number; globalSpendCents: number }> {
    const ex = executor(this.db, tx);
    const target = [usageDaily.day, usageDaily.scope, usageDaily.scopeId];
    const [user] = await ex
      .insert(usageDaily)
      .values({
        day,
        scope: "user",
        scopeId: usage.userId,
        videos: usage.videos,
        spendCents: usage.spendCents,
      })
      .onConflictDoUpdate({
        target,
        set: {
          videos: sql`${usageDaily.videos} + ${usage.videos}`,
          spendCents: sql`${usageDaily.spendCents} + ${usage.spendCents}`,
        },
      })
      .returning({ videos: usageDaily.videos });
    const [global] = await ex
      .insert(usageDaily)
      .values({ day, ...GLOBAL, videos: usage.videos, spendCents: usage.spendCents })
      .onConflictDoUpdate({
        target,
        set: {
          videos: sql`${usageDaily.videos} + ${usage.videos}`,
          spendCents: sql`${usageDaily.spendCents} + ${usage.spendCents}`,
        },
      })
      .returning({ spendCents: usageDaily.spendCents });
    return { userVideos: user?.videos ?? 0, globalSpendCents: global?.spendCents ?? 0 };
  }

  /** Adds spend that no one paid credits for (frames, redraws) to today's global counter. */
  async addGlobalSpend(day: string, spendCents: number): Promise<void> {
    await this.db
      .insert(usageDaily)
      .values({ day, ...GLOBAL, videos: 0, spendCents })
      .onConflictDoUpdate({
        target: [usageDaily.day, usageDaily.scope, usageDaily.scopeId],
        set: { spendCents: sql`${usageDaily.spendCents} + ${spendCents}` },
      });
  }

  async today(
    day: string,
    userId: string,
  ): Promise<{ userVideos: number; globalSpendCents: number }> {
    const rows = await this.db
      .select()
      .from(usageDaily)
      .where(
        and(
          eq(usageDaily.day, day),
          sql`(${usageDaily.scope} = 'user' and ${usageDaily.scopeId} = ${userId}) or ${usageDaily.scope} = 'global'`,
        ),
      );
    return {
      userVideos: rows.find((r) => r.scope === "user")?.videos ?? 0,
      globalSpendCents: rows.find((r) => r.scope === "global")?.spendCents ?? 0,
    };
  }
}
