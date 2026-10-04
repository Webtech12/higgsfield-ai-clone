import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import type { TalentPhoto } from "@/contracts/talent";

/**
 * The talent roster (ADR-024), written only by scripts/seed-talent.mjs. A release's signed copy stays
 * offline: the row keeps its date, its scope and a reference to where it's kept.
 */
export const talents = pgTable(
  "talents",
  {
    id: text().primaryKey(),
    slug: text().notNull().unique(),
    name: text().notNull(),
    tagline: text().notNull(),
    bio: text().notNull(),
    tags: text()
      .array()
      .$type<string[]>()
      .notNull()
      .default(sql`'{}'::text[]`),
    photos: jsonb().$type<TalentPhoto[]>().notNull(),
    consentSignedOn: date({ mode: "string" }).notNull(),
    consentScope: text().notNull(),
    consentReference: text().notNull(),
    /** False once consent ends: the talent can't be cast or used in new generations. */
    isActive: boolean().notNull().default(true),
    sortOrder: smallint().notNull().default(0),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("talents_active_order_idx").on(t.isActive, t.sortOrder)],
);
