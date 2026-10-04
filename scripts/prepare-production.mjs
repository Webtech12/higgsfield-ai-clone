// Prepares a production deploy on Vercel, before `next build` (run by the `vercel-build` script):
// first it refuses settings that only work on a developer's machine, then it migrates the database.
// Preview deploys skip both, so they can never migrate the production database. Locally, use
// `npm run db:migrate`.
//
// Migrations use drizzle-orm's migrator (as the integration tests do) rather than the drizzle-kit
// CLI, whose spinner can swallow the real error; both use the same migrations table.
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

if (process.env.VERCEL_ENV !== "production") {
  console.log(
    `Skipping production checks and migrations: VERCEL_ENV is ${process.env.VERCEL_ENV ?? "unset"}`,
  );
  process.exit(0);
}

// 1. Local-only settings, typically copied from .env.local into the Vercel dashboard.
const isLocalhost = (value) => {
  try {
    return ["localhost", "127.0.0.1", "[::1]"].includes(new URL(value).hostname);
  } catch {
    return false;
  }
};
const problems = [];
for (const name of [
  "DATABASE_URL",
  "DATABASE_URL_UNPOOLED",
  "BETTER_AUTH_URL",
  "NEXT_PUBLIC_APP_URL",
]) {
  const value = process.env[name];
  if (value && isLocalhost(value)) problems.push(`${name} points at localhost.`);
}
if (process.env.INNGEST_DEV) {
  problems.push(
    "INNGEST_DEV is set, so workflow events would go to a local dev server. Remove it.",
  );
}
if (problems.length > 0) {
  console.error(
    [
      "This production deploy has settings that only work locally (Vercel → Settings → Environment Variables):",
      ...problems.map((problem) => `  - ${problem}`),
      "Database URLs come from Neon (connect it in the Storage tab); the app URLs are the live URL.",
    ].join("\n"),
  );
  process.exit(1);
}

// 2. Migrations, over a direct (unpooled) connection (ADR-003). Neon's integration sets both URLs.
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
