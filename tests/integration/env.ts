/**
 * Integration tests run against a real Postgres (AGENTS.md §9): locally the Docker database's
 * director_test, in CI the service container, later the Neon test branch. Never the app database:
 * tests truncate what they touch.
 */
export function loadTestEnv(): string {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // CI provides the variables directly.
  }
  const url = process.env.DATABASE_URL_TEST;
  if (!url) throw new Error("DATABASE_URL_TEST is not set (see .env.example)");
  return url;
}
