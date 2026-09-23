import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

import { loadTestEnv } from "./env";

/** Brings the integration database (DATABASE_URL_TEST) up to the checked-in migrations, once. */
export default async function setup(): Promise<void> {
  const pool = new Pool({ connectionString: loadTestEnv() });
  try {
    await migrate(drizzle({ client: pool }), { migrationsFolder: "drizzle" });
  } finally {
    await pool.end();
  }
}
