// Applies database migrations during production deploys on Vercel, before `next build` (run by the
// `vercel-build` script). Preview deploys skip it, so they can never migrate the production database.
// Locally, use `npm run db:migrate`. Migrations use DATABASE_URL_UNPOOLED (drizzle.config.ts).
import { execFileSync } from "node:child_process";

if (process.env.VERCEL_ENV === "production") {
  execFileSync(process.execPath, ["node_modules/drizzle-kit/bin.cjs", "migrate"], {
    stdio: "inherit",
  });
} else {
  console.log(`Skipping migrations: VERCEL_ENV is ${process.env.VERCEL_ENV ?? "unset"}`);
}
