import { defineConfig } from "drizzle-kit";

// Tooling config, run by drizzle-kit outside the app, so it reads process.env directly rather than
// through src/server/platform/env.ts. Migrations use the direct (unpooled) connection (ADR-003).
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/modules/*/infrastructure/schema.ts",
  out: "./drizzle",
  // Matches the app client: camelCase in TypeScript, snake_case in Postgres.
  casing: "snake_case",
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
});
