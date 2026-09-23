import "server-only";

import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { getEnv } from "../env";

/**
 * node-postgres over Neon's pooled URL, not the Neon HTTP driver: the money path needs interactive
 * transactions with SELECT … FOR UPDATE (AGENTS.md §2). One small pool per server instance.
 */
let db: NodePgDatabase | undefined;

export function getDb(): NodePgDatabase {
  if (!db) {
    const pool = new Pool({ connectionString: getEnv().DATABASE_URL, max: 5 });
    // TypeScript keys stay camelCase; Postgres columns are snake_case.
    db = drizzle({ client: pool, casing: "snake_case" });
  }
  return db;
}

export type Database = NodePgDatabase;
