import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

import type { AssetKind, AssetStatus } from "@/contracts/project";

import type { AssetMeta } from "../domain/Asset";

/**
 * Immutable, versioned outputs (ADR-011). Provider attempt details live on the row in the lean core
 * (ADR-018); a separate generation_jobs table arrives with model fallback.
 */
export const assets = pgTable(
  "assets",
  {
    id: text().primaryKey(),
    // Plain ids, no FKs into the projects module's tables (AGENTS.md §3).
    projectId: text().notNull(),
    shotId: text().notNull(),
    kind: text().$type<AssetKind>().notNull(),
    version: integer().notNull(),
    parentAssetId: text(),
    status: text().$type<AssetStatus>().notNull(),
    model: text().notNull(),
    prompt: text().notNull(),
    sourceUrl: text(),
    providerRequestId: text(),
    url: text(),
    error: text(),
    costCredits: integer().notNull().default(0),
    attempt: integer().notNull().default(1),
    meta: jsonb().$type<AssetMeta>().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("assets_shot_kind_version_key").on(t.shotId, t.kind, t.version),
    index("assets_project_idx").on(t.projectId),
    index("assets_status_updated_idx").on(t.status, t.updatedAt),
    check("assets_kind_check", sql`${t.kind} in ('frame','video')`),
    check(
      "assets_status_check",
      sql`${t.status} in ('queued','submitted','running','persisting','succeeded','failed')`,
    ),
  ],
);
