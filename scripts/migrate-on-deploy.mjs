// Applies database migrations during production deploys on Vercel, before `next build` (run by the
// `vercel-build` script). Preview deploys skip it, so they can never migrate the production database.
// Locally, use `npm run db:migrate`.
//
// It uses drizzle-orm's migrator (as the integration tests do) rather than the drizzle-kit CLI, whose
// spinner can swallow the real error; the same migrations table is used either way.
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

if (process.env.VERCEL_ENV !== "production") {
  console.log(`Skipping migrations: VERCEL_ENV is ${process.env.VERCEL_ENV ?? "unset"}`);
  process.exit(0);
}

// Migrations need a direct (unpooled) connection (ADR-003). The Neon integration sets both URLs.
const source = process.env.DATABASE_URL_UNPOOLED ? "DATABASE_URL_UNPOOLED" : "DATABASE_URL";
const url = process.env[source];
if (!url) {
  console.error(
    "Migrations need a database: connect Neon in the Vercel project's Storage tab (it sets " +
      "DATABASE_URL and DATABASE_URL_UNPOOLED for Production), then redeploy.",
  );
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: url, max: 1 });
try {
  console.log(`Applying migrations over ${source}…`);
  await migrate(drizzle({ client: pool }), { migrationsFolder: "drizzle" });
  console.log("Migrations are up to date.");
} catch (error) {
  console.error("Migrations failed:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
