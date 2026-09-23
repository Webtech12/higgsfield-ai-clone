import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { anonymous } from "better-auth/plugins/anonymous";

import { getDb } from "@/server/platform/db";
import { getEnv } from "@/server/platform/env";

import * as schema from "./schema";

function createAuth() {
  const env = getEnv();
  return betterAuth({
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL ?? env.NEXT_PUBLIC_APP_URL,
    database: drizzleAdapter(getDb(), { provider: "pg", schema }),
    plugins: [
      // Guests are real users with isAnonymous = true (AGENTS.md §5). The anonymous row is never
      // deleted: its ledger history references it (ADR-019).
      anonymous({ disableDeleteAnonymousUser: true }),
      // Lets server-side calls (like creating a guest in a route handler) set cookies.
      nextCookies(),
    ],
  });
}

let auth: ReturnType<typeof createAuth> | undefined;

/** Built lazily so pages that never touch auth don't need its configuration at build time. */
export function getAuth(): ReturnType<typeof createAuth> {
  auth ??= createAuth();
  return auth;
}
