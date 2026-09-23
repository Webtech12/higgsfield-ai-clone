import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import type { AspectRatio, StyleTag } from "@/contracts/brief";
import type { Elements } from "@/contracts/plan";
import type { CameraMove, ProjectStatus, ShotDuration } from "@/contracts/project";

// Tables owned by the projects module. Column names are snake_case via the shared `casing` setting.

export const projects = pgTable(
  "projects",
  {
    id: text().primaryKey(),
    // No FK into identity's tables: modules never reach into each other's schema (AGENTS.md §3).
    userId: text().notNull(),
    title: text().notNull(),
    brief: text().notNull(),
    aspectRatio: text().$type<AspectRatio>().notNull(),
    styles: text()
      .array()
      .$type<StyleTag[]>()
      .notNull()
      .default(sql`'{}'::text[]`),
    status: text().$type<ProjectStatus>().notNull(),
    selectedDirectionId: text(),
    isDemo: boolean().notNull().default(false),
    elements: jsonb().$type<Elements>(),
    /** Bumped on every change to the aggregate; part of the workspace ETag (ADR-013). */
    version: integer().notNull().default(0),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("projects_user_created_idx").on(t.userId, t.createdAt.desc()),
    check(
      "projects_status_check",
      sql`${t.status} in ('planning','planned','selected','producing','ready','failed')`,
    ),
  ],
);

export const directions = pgTable(
  "directions",
  {
    id: text().primaryKey(),
    projectId: text()
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    ordinal: smallint().notNull(),
    name: text().notNull(),
    tagline: text().notNull(),
    look: text().notNull(),
  },
  (t) => [index("directions_project_idx").on(t.projectId, t.ordinal)],
);

export const shots = pgTable(
  "shots",
  {
    id: text().primaryKey(),
    directionId: text()
      .notNull()
      .references(() => directions.id, { onDelete: "cascade" }),
    projectId: text()
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    ordinal: smallint().notNull(),
    title: text().notNull(),
    description: text().notNull(),
    cameraMove: text().$type<CameraMove>().notNull(),
    durationS: smallint().$type<ShotDuration>().notNull(),
    lighting: text().notNull(),
    mood: text().notNull(),
    frameStale: boolean().notNull().default(false),
    currentFrameAssetId: text(),
    currentVideoAssetId: text(),
  },
  (t) => [
    index("shots_direction_idx").on(t.directionId, t.ordinal),
    index("shots_project_idx").on(t.projectId),
  ],
);
