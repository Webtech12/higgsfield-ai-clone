import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import boundaries from "eslint-plugin-boundaries";
import jsxA11y from "eslint-plugin-jsx-a11y";
import tseslint from "typescript-eslint";

// --- Vendor isolation (AGENTS.md §6) -----------------------------------------------------------
// Each group names the packages and where they may be imported. A later block replaces the rule
// for the files it matches, so the most specific folders come last.

const VENDOR_SDKS = {
  group: ["@fal-ai/*", "openai", "openai/*", "@aws-sdk/*", "@upstash/*", "resend", "resend/*"],
  message: "Vendor SDKs are imported only in src/server/integrations/** (AGENTS.md §6).",
};
const DRIZZLE = {
  group: ["drizzle-orm", "drizzle-orm/*"],
  message:
    "drizzle-orm is imported only in infrastructure/, platform/db and server/queries (AGENTS.md §6).",
};
const BETTER_AUTH = {
  group: ["better-auth", "better-auth/*"],
  message: "better-auth is imported only in the identity module and features/auth (AGENTS.md §6).",
};
const CONTAINER = {
  group: ["@/server/container", "**/container"],
  message: "Use cases and domain code never import the composition root (AGENTS.md §6).",
};

const restrict = (...groups) => ({
  "no-restricted-imports": ["error", { patterns: groups }],
});

// --- Module and layer boundaries (AGENTS.md §3, §7) ---------------------------------------------

const SERVER_TYPES = [
  "server-module",
  "server-process",
  "server-query",
  "server-integration",
  "server-platform",
];

const boundariesConfig = {
  files: ["src/**/*.{ts,tsx}"],
  plugins: { boundaries },
  settings: {
    "boundaries/elements": [
      { type: "app", pattern: "src/app" },
      { type: "feature", pattern: "src/features/*", capture: ["featureName"] },
      { type: "entity", pattern: "src/entities/*", capture: ["entityName"] },
      { type: "shared", pattern: "src/shared" },
      { type: "contracts", pattern: "src/contracts" },
      { type: "server-module", pattern: "src/server/modules/*", capture: ["moduleName"] },
      { type: "server-process", pattern: "src/server/processes" },
      { type: "server-query", pattern: "src/server/queries" },
      { type: "server-integration", pattern: "src/server/integrations" },
      { type: "server-platform", pattern: "src/server/platform" },
    ],
  },
  rules: {
    "boundaries/dependencies": [
      "error",
      {
        default: "allow",
        policies: [
          // Frontend layers point downward only: app → features → entities → shared → contracts.
          {
            from: { element: { type: "feature" } },
            disallow: { to: { element: { type: "app" } } },
          },
          {
            from: { element: { type: "entity" } },
            disallow: { to: { element: { types: { anyOf: ["app", "feature"] } } } },
          },
          {
            from: { element: { type: "shared" } },
            disallow: { to: { element: { types: { anyOf: ["app", "feature", "entity"] } } } },
          },
          {
            from: { element: { type: "contracts" } },
            disallow: {
              to: {
                element: {
                  types: { anyOf: ["app", "feature", "entity", "shared", ...SERVER_TYPES] },
                },
              },
            },
          },
          // Features never import each other; shared code moves down to entities/ or shared/.
          // (Imports inside one feature are internal to its element, so they are not affected.)
          {
            from: { element: { type: "feature" } },
            disallow: { to: { element: { type: "feature" } } },
          },
          // Client-side layers never import server code.
          {
            from: { element: { types: { anyOf: ["feature", "entity", "shared"] } } },
            disallow: { to: { element: { types: { anyOf: SERVER_TYPES } } } },
          },
          // Modules never depend on processes, read queries or adapters (the container is covered below).
          {
            from: { element: { type: "server-module" } },
            disallow: {
              to: {
                element: {
                  types: { anyOf: ["server-process", "server-query", "server-integration"] },
                },
              },
            },
          },
        ],
      },
    ],
  },
};

export default defineConfig([
  ...nextVitals,
  ...nextTs,

  // Strict, type-aware TypeScript rules (AGENTS.md §8).
  {
    files: ["**/*.{ts,tsx}"],
    extends: [tseslint.configs.strictTypeChecked],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
    },
  },

  // Accessibility: the full recommended set, on top of the subset in core-web-vitals.
  { files: ["src/**/*.tsx"], rules: jsxA11y.flatConfigs.recommended.rules },

  boundariesConfig,

  // Size signals (AGENTS.md §8): warnings that prompt a split, not hard failures.
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "max-lines": ["warn", { max: 250, skipBlankLines: true, skipComments: true }],
      "max-lines-per-function": ["warn", { max: 50, skipBlankLines: true, skipComments: true }],
      complexity: ["warn", 10],
    },
  },
  // Components are functions too, but their budget is ~150 lines.
  {
    files: ["src/**/*.tsx"],
    rules: {
      "max-lines-per-function": ["warn", { max: 150, skipBlankLines: true, skipComments: true }],
    },
  },
  // Test files group cases in describe() callbacks; their length says nothing about design.
  { files: ["**/*.test.{ts,tsx}"], rules: { "max-lines-per-function": "off" } },

  // Vendor isolation, most general first.
  { files: ["src/**/*.{ts,tsx}"], rules: restrict(VENDOR_SDKS, DRIZZLE, BETTER_AUTH) },
  { files: ["src/server/integrations/**"], rules: restrict(DRIZZLE, BETTER_AUTH) },
  {
    files: [
      "src/server/modules/*/infrastructure/**",
      "src/server/platform/db/**",
      "src/server/queries/**",
    ],
    rules: restrict(VENDOR_SDKS, BETTER_AUTH, CONTAINER),
  },
  {
    files: ["src/server/modules/identity/**", "src/features/auth/**"],
    rules: restrict(VENDOR_SDKS, DRIZZLE, CONTAINER),
  },
  {
    files: ["src/server/modules/identity/infrastructure/**"],
    rules: restrict(VENDOR_SDKS, CONTAINER),
  },
  {
    files: ["src/server/modules/*/domain/**", "src/server/modules/*/application/**"],
    rules: restrict(VENDOR_SDKS, DRIZZLE, BETTER_AUTH, CONTAINER),
  },

  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Logged verbatim for the graders, and the capture hook: never linted (AGENTS.md §12).
    ".agent-logs/**",
    ".claude/**",
    "drizzle/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
  ]),
]);
