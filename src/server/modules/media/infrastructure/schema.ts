import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Brand photos (ADR-024). A brief may only use photos its own user uploaded, so every lookup is by
 * owner. No FK into identity's tables (AGENTS.md §3).
 */
export const uploads = pgTable(
  "uploads",
  {
    id: text().primaryKey(),
    userId: text().notNull(),
    url: text().notNull(),
    contentType: text().notNull(),
    sizeBytes: integer().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("uploads_user_created_idx").on(t.userId, t.createdAt.desc())],
);
