import "server-only";

import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { getEnv } from "../env";

/** Carries its pool, so a script or test that owns the connection can close it (`$client.end()`). */
export type Database = NodePgDatabase & { $client: Pool };

/**
 * node-postgres over Neon's pooled URL, not the Neon HTTP driver: the money path needs interactive
 * transactions with SELECT … FOR UPDATE (AGENTS.md §2). TypeScript keys stay camelCase; Postgres
 * columns are snake_case.
 */
export function createDb(connectionString: string): Database {
  return drizzle({ client: new Pool({ connectionString, max: 5 }), casing: "snake_case" });
}

let db: Database | undefined;

/** The app's database, one small pool per server instance. */
export function getDb(): Database {
  db ??= createDb(getEnv().DATABASE_URL);
  return db;
}
