import { date, integer, pgTable, primaryKey, text } from "drizzle-orm/pg-core";

/** Per-day counters: videos per user (caps) and spend for everyone (the kill-switch, ADR-016). */
export const usageDaily = pgTable(
  "usage_daily",
  {
    day: date({ mode: "string" }).notNull(),
    scope: text().$type<"user" | "global">().notNull(),
    scopeId: text().notNull(),
    videos: integer().notNull().default(0),
    spendCents: integer().notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.day, t.scope, t.scopeId] })],
);
