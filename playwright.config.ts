import { defineConfig, devices } from "@playwright/test";

const port = 3100;
const isCI = Boolean(process.env.CI);
// Point at an already-running app (e.g. `npm run dev` + `npm run inngest:dev`) instead of building.
const externalBaseUrl = process.env.E2E_BASE_URL;

// E2E runs on fakes: no provider keys, no spend (AGENTS.md §9). The journeys also need Postgres and
// the Inngest dev server; CI starts both (see .github/workflows/ci.yml).
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: externalBaseUrl ?? `http://localhost:${String(port)}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  ...(externalBaseUrl
    ? {}
    : {
        webServer: {
          command: `npm run build && npm run start -- --port ${String(port)}`,
          url: `http://localhost:${String(port)}`,
          reuseExistingServer: !isCI,
          timeout: 300_000,
          env: { PROVIDERS: "fake" },
        },
      }),
});
